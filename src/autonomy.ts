import { ATR, DetectedObject } from './atr.js'
import { Config } from './config.js'
import { sleep } from './util/util.js'

enum C2Command {
    START,
    END,
}

const C2_START_DELAY_SEC = 1 // How long between startup and mission start
const C2_MISSION_DURATION_SEC = 3 // Time between mission start and end

// Toy implementation of a C2 interface
class C2 {
    config: Config
    beginTime: number
    sentStart: boolean
    sentEnd: boolean
    constructor(config: Config) {
        this.config = config
        this.beginTime = 0
        this.sentStart = false
        this.sentEnd = false
    }

    async start(): Promise<void> {}
    async stop(): Promise<void> {}

    async pollCommand(): Promise<C2Command | null> {
        const now = Date.now()
        let result = null
        if (this.beginTime == 0) {
            this.beginTime = now
        } else {
            const elapsed = now - this.beginTime
            const total_seconds = C2_START_DELAY_SEC + C2_MISSION_DURATION_SEC
            if (elapsed >= total_seconds * 1000 && !this.sentEnd) {
                result = C2Command.END
                this.sentEnd = true
            } else if (
                elapsed >= C2_START_DELAY_SEC * 1000 &&
                !this.sentStart
            ) {
                result = C2Command.START
                this.sentStart = true
            }
        }
        return result
    }
}

export enum MissionState {
    LANDED, // Pre-flight
    WAITING_C2, // Waiting for C2 command (i.e. start)
    RTL_C2, // Return to launch site, reqested by C2
    AUTO_TASK, // Executing autonomous task
    LOITER, // In flight, waiting for task or command
    FAILSAFE_LANDING, // Emergency landing ASAP
}
export const MAX_HZ = 4
const TICK_INTERVAL_MSEC = 1000 / MAX_HZ

// For now, treat this as the main() of the application
export class Autonomy {
    config: Config
    atr: ATR
    c2: C2
    lastTick: number
    state: MissionState
    shutdown: boolean
    constructor(config: Config) {
        this.config = config
        this.atr = new ATR(config)
        this.lastTick = 0
        this.state = MissionState.LANDED
        this.c2 = new C2(config)
        this.shutdown = false
    }

    isMissionActive(): boolean {
        return (
            this.state != MissionState.LANDED &&
            this.state != MissionState.WAITING_C2 &&
            this.state != MissionState.FAILSAFE_LANDING
        )
    }

    // Are we executing a C2 command that "takes over" / precludes autonomy?
    isRunningC2Command(): boolean {
        return (
            this.state == MissionState.WAITING_C2 ||
            this.state == MissionState.RTL_C2
        )
    }

    // @private
    async handleC2Command(cmd: C2Command | null): Promise<void> {
        if (cmd == null) {
            return
        }
        console.debug('Received C2 command: ', C2Command[cmd])
        if (cmd == C2Command.START && !this.isMissionActive()) {
            this.state = MissionState.AUTO_TASK // we're doing stuff
        } else if (cmd == C2Command.END) {
            this.state = MissionState.RTL_C2
        } else {
            console.error(
                'Unexpected command ',
                C2Command[cmd],
                ' in state ',
                MissionState[this.state],
                ', aborting mission.'
            )
            this.state = MissionState.RTL_C2
        }
    }

    // @private
    async handleObjectDetection(obj: DetectedObject | null): Promise<void> {
        if (obj == null) {
            return
        }
        console.info('Detected object: ', obj)
    }

    // @private
    async tick() {
        // TODO check autopilot health & status
        // This would probably check for emergency conditions like low battery
        // or autopiot failsafe. If there is an emergency, it could update the
        // world model for peers, and start shutting down.
        // Also, we'd check for completion of navigation commands (e.g. reached
        // waypoint)

        // poll C2 command queue
        const cmd = await this.c2.pollCommand()
        this.handleC2Command(cmd)

        // Termination condition: we were set to return to launch (land) and no
        // new C2 command received
        if (cmd == null && this.state == MissionState.RTL_C2) {
            this.shutdown = true
            console.info('Eagle has landed.')
            return
        }

        if (!this.isMissionActive()) {
            // Done until mission start
            return
        }

        // TODO poll peer IPC queue
        // e.g. handle messages from peers in our autonomy group, such as:
        // - Command from elected leader
        // - Request for data from peer
        // - Group / leader management messages
        // - Synchronization messages

        // poll local object detection
        const obj = await this.atr.pollDetection()
        this.handleObjectDetection(obj)

        // end main loop
    }

    async mainLoop() {
        while (!this.shutdown) {
            this.lastTick = Date.now()
            await this.tick()
            const elapsed = Date.now() - this.lastTick
            await sleep(TICK_INTERVAL_MSEC - elapsed)
        }
    }

    async main(): Promise<void> {
        // init subsystems
        await this.atr.start()
        await this.c2.start()

        await this.mainLoop()

        // shutdown subsystems
        await this.c2.stop()
        await this.atr.stop()
    }
}
