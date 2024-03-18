import { assert } from 'console'
import { DittoCOD } from '../ditto_cod.js'
import { Config } from './config.js'
import { CoordValueV0, GeomTypeV0, Geometry, v0Telemetry } from './protocol.js'
import {
    DocumentID,
    QueryResult,
    QueryResultItem,
    Store,
    SyncSubscription,
} from '@dittolive/ditto'

export const COLLECTION = 'telemetry'
export const MODEL_VERSION = 0

type v0GeomRecord = { [key: string]: GeomTypeV0 | CoordValueV0 }

type TelemFieldsV0 = string | number | boolean | v0GeomRecord
type TelemDocV0 = { [key: string]: TelemFieldsV0 }
type TelemDocV0WithOptionals = { [key: string]: TelemFieldsV0 | undefined }

export type V0TelemWithId = [_id: DocumentID, v0Telem: v0Telemetry]
export type TelemUpdateCallback = (telem: V0TelemWithId[]) => void

export class TelemModel {
    dittoCod: DittoCOD
    config: Config
    store: Store | null = null
    sub: SyncSubscription | null = null

    constructor(dittoCod: DittoCOD, config: Config) {
        this.dittoCod = dittoCod
        this.config = config
    }

    private telemV0toDocV0(vt: v0Telemetry): TelemDocV0WithOptionals {
        return {
            // _id: undefined, // set on read from Ditto
            lon: vt.lon,
            lat: vt.lat,
            alt: vt.alt,
            timestamp: vt.timestamp.toString(),
            node_id: vt.id,
            heading: vt.heading,
            behavior: vt.behavior,
            mission_phase: vt.mission_phase,
            phase_loc: vt.phase_loc!, // XXX TODO
            model_version: MODEL_VERSION,
            consumed: false,
        }
    }

    private telemQuery(): string {
        return `SELECT * FROM ${COLLECTION} WHERE consumed = false`
    }

    async writeTelem(v0Telem: v0Telemetry) {
        console.info('-> write: ', v0Telem)
        const doc = this.telemV0toDocV0(v0Telem) as TelemDocV0
        const q = `INSERT INTO ${COLLECTION} DOCUMENTS (:doc)`
        console.debug('writeTelem: ', q)
        await this.store!.execute(q, { doc: doc })
        console.debug('-> ', doc)
    }

    private queryItemToV0TelemWithId(qi: QueryResultItem): V0TelemWithId {
        const val = qi.value
        if (val.model_version != MODEL_VERSION) {
            console.error(
                'Got doc with unsupported model_version ',
                val.model_version
            )
        }
        const vt = new v0Telemetry()
        vt.lon = val.lon
        vt.lat = val.lat
        vt.alt = val.alt
        vt.timestamp = Timestamp.fromString(val.timestamp),
        vt.id = val.node_id
        vt.heading = val.heading
        vt.behavior = val.behavior
        vt.mission_phase = val.mission_phase
        if (val.phase_loc) {
            vt.phase_loc = Geometry.fromFields(
                val.phase_loc.name,
                val.phase_loc.coordinates
            ).toObject()
        }
        return [val._id, vt]
    }

    // TODO demo interface for getting / consuming telemetery in one shot
    async consumeTelem(): Promise<v0Telemetry[]> {
        this.ensureSubscribed()
        const records: v0Telemetry[] = []
        const q = this.telemQuery()
        const qResult = await this.store!.execute(q)
        qResult.items.forEach(async (qi: QueryResultItem) => {
            if (!qi || !qi.value) {
                console.debug('Ignoring empty query item.')
                return
            }
            const val = qi.value
            if (val.model_version != MODEL_VERSION) {
                console.warn(
                    'Got doc with unsupported model_version ',
                    val.model_version
                )
            }
            const [id, telem] = this.queryItemToV0TelemWithId(val)
            records.push(telem)
            console.debug('Consuming telemetry record id: ', id)
            const updateQ = `UPDATE ${COLLECTION} SET consumed = true WHERE _id = :id`
            await this.store!.execute(updateQ, { id: id })
        })
        return records
    }

    private ensureSubscribed() {
        if (!this.sub) {
            const q = this.telemQuery()
            this.sub = this.dittoCod.registerSubscription(q)
        }
    }

    // Subscribe to updates on telemetry records. Supply a callback which will
    // be called with a list of telemetry records whenever there is an update.
    subscribe(cb: TelemUpdateCallback) {
        const q = this.telemQuery()
        if (!this.sub) {
            this.sub = this.dittoCod.registerSubscription(q)
        }
        this.store!.registerObserver(q, (result: QueryResult) => {
            const telemObjs: V0TelemWithId[] = result.items.map(
                (qi: QueryResultItem) => {
                    return this.queryItemToV0TelemWithId(qi)
                }
            )
            cb(telemObjs)
        })
    }

    unsubscribe() {
        if (this.sub) {
            this.sub.cancel()
            this.sub = null
        }
    }

    async start() {
        assert(this.dittoCod.isRunning(), 'Must start DittoCOD before model.')
        this.store = this.dittoCod.store()
    }

    async stop() {
        // no-op for now
    }
}
