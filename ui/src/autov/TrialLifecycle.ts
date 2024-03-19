import { LogCb, LogEntry } from '../common/Log'
import { TelemRecord, TrialState } from '../common/types'
import { AutovClient, TrialResponse } from './AutovClient'
import { TelemGenerator } from './TelemGenerator'

export class AvStatus {
    lat: number
    lon: number
    heading: number
    behavior: string
    missionPhase: string
    telemGen: TelemGenerator | null = null
    constructor(
        lat: number,
        lon: number,
        heading: number,
        behavior: string,
        missionPhase: string
    ) {
        this.lat = lat
        this.lon = lon
        this.heading = heading
        this.behavior = behavior
        this.missionPhase = missionPhase
    }
    public static fromTelem(telemRecord: TelemRecord): AvStatus {
        return new AvStatus(
            telemRecord.lat,
            telemRecord.lon,
            telemRecord.heading,
            telemRecord.behavior,
            telemRecord.mission_phase
        )
    }

    public static preInit(): AvStatus {
        return new AvStatus(0, 0, 0, 'power on', 'wait')
    }
}

type TrialStatusCb = (s: TrialState) => void
type AvStatusCb = (s: AvStatus) => void
type ArmCb = (a: boolean) => void

class TelemReporter {
    client: AutovClient
    avStatusCb: AvStatusCb
    logCb: LogCb
    running: boolean
    intervalSec: number
    telem: TelemGenerator
    constructor(
        client: AutovClient,
        avStatusCb: AvStatusCb,
        logCb: LogCb,
        intervalSec: number = 10
    ) {
        this.client = client
        this.avStatusCb = avStatusCb
        this.logCb = logCb
        this.running = false
        this.intervalSec = intervalSec
        this.telem = TelemGenerator.default()
    }

    async wait() {
        const waitTelem = this.telem.genTelem(0, false)
        const status = await this.client.postTelem(waitTelem)
        this.logCb(LogEntry.api('POST /api/telemetry', status == 201))
        this.avStatusCb(AvStatus.preInit())
    }

    // Post telemetry immediately to ack start message, and start interval loop
    async start() {
        this.running = true
        this.telem.setStartStates()
        setTimeout(() => this.loop(), 0)
    }

    stop() {
        this.running = false
    }

    async loop() {
        while (this.running) {
            await this.reportTelem()
            console.debug(
                'TelemReporter.loop: waiting ',
                this.intervalSec,
                ' sec.'
            )
            await new Promise((r) => setTimeout(r, this.intervalSec * 1000))
        }
    }

    setIntervalSec(sec: number) {
        this.intervalSec = sec
    }

    async reportTelem(): Promise<void> {
        const telemRecord = this.telem.genTelem(this.intervalSec, true)
        const status = await this.client.postTelem(telemRecord)
        this.logCb(LogEntry.api('POST /api/telemetry', status == 201))
        this.avStatusCb(AvStatus.fromTelem(telemRecord))
    }
}

// 1. in state Wait or End, user enables Arm.
// 2. Wait for start, call status update cb
// 3. Wait for end, call update cb and clear arm state
// repeat
export class TrialLifecycle {
    client: AutovClient
    trialStatusCb: TrialStatusCb
    avStatusCb: AvStatusCb
    armCb: ArmCb
    logCb: LogCb
    state: TrialState
    telemRate: number
    telem: TelemReporter | null = null
    constructor(
        client: AutovClient,
        trialStatusCb: TrialStatusCb,
        avStatusCb: AvStatusCb,
        armCb: ArmCb,
        logCb: LogCb,
        telemRate: number
    ) {
        this.client = client
        this.trialStatusCb = trialStatusCb
        this.avStatusCb = avStatusCb
        this.armCb = armCb
        this.logCb = logCb
        this.state = TrialState.Wait
        this.telemRate = telemRate
    }

    handleErrResponse(response: TrialResponse): boolean {
        let fail = false
        if (response.error) {
            console.warn('awaitTrialStatus error: ', response.error)
            fail = true
        } else if (response.obj == null) {
            console.warn('awaitTrialStatus: response.obj is null')
            fail = true
        }
        return fail
    }

    setTelemRate(rate: number) {
        console.debug('setTelemRate: ', rate)
        this.telemRate = rate
        this.telem?.setIntervalSec(rate)
    }

    async start() {
        // Wait for Start
        console.debug('trial: waiting for Start')
        this.telem = new TelemReporter(
            this.client,
            this.avStatusCb,
            this.logCb,
            this.telemRate
        )
        this.telem.wait()
        const response: TrialResponse = await this.client.awaitTrial(true)
        if (this.handleErrResponse(response)) {
            this.logCb(LogEntry.api('GET /api/trial/start', false))
            return
        }

        // Got Start
        this.logCb(LogEntry.api('GET /api/trial/start', true))
        this.trialStatusCb(TrialState.Start)
        this.telem.start()

        // Wait for End
        console.debug('trial: waiting for End')
        const response2 = await this.client.awaitTrial(false)
        if (this.handleErrResponse(response2)) {
            this.logCb(LogEntry.api('GET /api/trial/end', false))
            return
        }

        // Got End
        console.debug('trial: completed')
        this.telem.stop()
        this.trialStatusCb(TrialState.End)
        this.armCb(false)
        this.telem = null
    }
}
