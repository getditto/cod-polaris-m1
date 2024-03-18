import { TelemRecord } from '../common/types'

const TURN_P = 0.1
const TURN_MAX = 45.0
const APPROX_MI_PER_DEG = 69.0 + 55.1 / 2
const MIN_EDGE_MI = 0.25
const N = 'N'
const E = 'E'
const S = 'S'
const W = 'W'
const [MIN_VEL, MAX_VEL] = [5.0, 30.0]
const DELTA_V_MAX = 1.0
const CHANGE_BEHAVIOR_P = 0.15

export type Behavior = 'loiter' | 'transiting' | 'finding' | 'tracking'
export type MissionPhase = 'wait' | 'find' | 'identify' | 'close'
const ACTIVE_PHASES: MissionPhase[] = ['find', 'identify', 'close']

// Generates a stream of synthetic telemetry records
// Very low-tech randomized model.
export class TelemGenerator {
    avId: string
    // NW lat, lon, SE lat, lon
    boundingBox: [number, number, number, number]

    lastCoords: [number, number]
    approxNextCoords: [number, number]
    heading: number
    velocityMPH: number
    behavior: Behavior
    missionPhase: MissionPhase

    // corner is [lat, lon] in decimal degrees
    constructor(
        avId: string,
        nwCorner: [number, number],
        width: number,
        height: number
    ) {
        this.avId = avId
        this.boundingBox = [
            nwCorner[0],
            nwCorner[1],
            nwCorner[0] + width,
            nwCorner[1] + height,
        ]
        // Enter from East, heading West
        const midLat = (this.boundingBox[0] + this.boundingBox[2]) / 2
        this.lastCoords = [midLat, this.boundingBox[3] - 0.01]
        this.approxNextCoords = [this.lastCoords[0], this.lastCoords[1] - 0.01]
        this.heading = 270.0
        const approxSqMi = width * 55.1 * height * 69.0
        this.velocityMPH = (MIN_VEL + MAX_VEL) / 2
        this.behavior = 'loiter'
        this.missionPhase = 'wait'
        console.log(
            `TelemGenerator: id ${avId} entering from East in approx ${approxSqMi} sq mi area.`
        )
    }

    public setStartStates(): void {
        this.behavior = 'transiting'
        this.missionPhase = 'find'
    }

    public static default(avId: string = 'uav_1'): TelemGenerator {
        return new TelemGenerator(avId, [39.5296, -119.8138], 0.4, 0.4)
    }

    private wrapHeading() {
        if (this.heading < 0) {
            this.heading += 360
        } else if (this.heading > 360) {
            this.heading -= 360
        }
    }

    // If we're getting close to an edge, return heading to move away from it.
    // Else return null
    private turnFromEdge(): number | null {
        // Distance from N, E, S, W edges
        const edgeDists: [string, number][] = [
            [N, this.boundingBox[2] - this.lastCoords[0]],
            [E, this.boundingBox[3] - this.lastCoords[1]],
            [S, this.lastCoords[0] - this.boundingBox[0]],
            [W, this.lastCoords[1] - this.boundingBox[1]],
        ]

        // Sort by distance, grab min
        edgeDists.sort((a, b) => a[1] - b[1])
        const edge = edgeDists[0][0]
        const dist = edgeDists[0][1] * APPROX_MI_PER_DEG
        if (dist > MIN_EDGE_MI) {
            return null
        }
        let deg = 0
        switch (edge) {
            case N:
                deg = 180.0
                break
            case E:
                deg = 270.0
                break
            case S:
                deg = 0.0
                break
            case W:
                deg = 90.0
                break
        }
        // Add a little randomness (+/1 3 degrees)
        deg += (Math.random() - 0.5) * 6
        this.wrapHeading()
        console.debug(`turnFromEdge: edge ${edge}, heading ${deg}`)
        return deg
    }

    private updateModel(deltaTSec: number, isStarted: boolean) {
        // 1. Decide new heading
        const turn = this.turnFromEdge()
        if (turn != null) {
            this.heading = turn
            this.wrapHeading()
        } else {
            if (Math.random() < TURN_P) {
                const turnDelta = (Math.random() - 0.5) * 2 * TURN_MAX
                this.heading += turnDelta
                this.wrapHeading()
                console.debug(
                    `genTelem: turning ${turnDelta} degrees to heading ${this.heading}`
                )
            }
        }
        // 2. Change velocity within min/max
        const deltaV = (Math.random() - 0.5) * 2 * DELTA_V_MAX
        let newV = this.velocityMPH + deltaV
        newV = Math.min(newV, MAX_VEL)
        this.velocityMPH = Math.max(newV, MIN_VEL)

        // 3. Move according to heading & velocity
        const degVelocity = this.velocityMPH / APPROX_MI_PER_DEG
        const deltaLat = Math.sin(this.heading) * degVelocity * deltaTSec
        const deltaLon = Math.cos(this.heading) * degVelocity * deltaTSec
        this.lastCoords[0] += deltaLat
        this.lastCoords[1] += deltaLon
        this.approxNextCoords[0] = this.lastCoords[0] + deltaLat
        this.approxNextCoords[1] = this.lastCoords[1] + deltaLon
        console.debug(
            `genTelem: at ${this.lastCoords} (delta ${deltaLat}, ` +
                `${deltaLon}), head ${this.heading}, v=${this.velocityMPH}`
        )

        // 4. Change behavior & phase, doesn't affect model
        if (Math.random() < CHANGE_BEHAVIOR_P) {
            if (isStarted) {
                this.missionPhase =
                    ACTIVE_PHASES[
                        Math.floor(Math.random() * ACTIVE_PHASES.length)
                    ]
            } else {
                this.missionPhase = 'wait'
            }
        }
        if (this.missionPhase == 'wait') {
            this.behavior = 'loiter'
        } else if (this.missionPhase == 'find') {
            this.behavior = 'transiting'
        } else if (this.missionPhase == 'identify') {
            this.behavior = 'tracking'
        } else if (this.missionPhase == 'close') {
            this.behavior = 'tracking'
        }
    }

    // Random walk within bounding box
    public genTelem(deltaTSec: number, isStarted: boolean): TelemRecord {
        this.updateModel(deltaTSec, isStarted)
        const now = new Date().toISOString()
        return {
            lon: this.lastCoords[1],
            lat: this.lastCoords[0],
            alt: 0.0,
            timestamp: now,
            id: this.avId,
            heading: this.heading,
            behavior: this.behavior,
            mission_phase: this.missionPhase,
            phase_loc: { type: 'Point', coordinates: this.approxNextCoords },
        }
    }
}
