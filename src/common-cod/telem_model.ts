import { assert } from 'console'
import { DittoCOD } from '../ditto_cod.js'
import { Config } from './config.js'
import { CoordValueV0, GeomTypeV0, v0Telemetry } from './protocol.js'
import { Store } from '@dittolive/ditto'

export const COLLECTION = 'telemetry'
export const MODEL_VERSION = 0

type v0GeomRecord = { [key: string]: GeomTypeV0 | CoordValueV0 }
type TelemDocV0 = Record<
    string,
    string | number | boolean | v0GeomRecord | undefined
>
export class TelemModel {
    dittoCod: DittoCOD
    config: Config
    store: Store | null = null

    constructor(dittoCod: DittoCOD, config: Config) {
        this.dittoCod = dittoCod
        this.config = config
    }

    private telemV0toDocV0(vt: v0Telemetry): TelemDocV0 {
        return {
            lon: vt.lon,
            lat: vt.lat,
            alt: vt.alt,
            timestamp: vt.timestamp.toString(),
            node_id: vt.id,
            heading: vt.heading,
            behavior: vt.behavior,
            mission_phase: vt.mission_phase,
            phase_loc: vt.phase_loc,
            model_version: MODEL_VERSION,
            consumed: false,
        }
    }

    async writeTelem(v0Telem: v0Telemetry) {
        // TODO
        console.info('-> write: ', v0Telem)
        const doc = this.telemV0toDocV0(v0Telem)
        const q = `INSERT INTO ${COLLECTION} DOCUMENTS (:doc)`
        console.debug('writeTelem: ', q)
        await this.store!.execute(q, { doc: doc })
        console.debug('-> ', doc)
    }

    async start() {
        assert(this.dittoCod.isRunning(), 'Must start DittoCOD before model.')
        this.store = this.dittoCod.store()
    }

    async stop() {
        // no-op for now
    }
}
