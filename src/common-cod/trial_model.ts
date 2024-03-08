import assert from 'assert'
import { DittoCOD } from '../ditto_cod.js'
import { Config } from './config.js'
import {
    CoordValueV0,
    Timestamp,
    TrialId,
    v0TrialEnd,
    v0TrialStart,
    v0TrialWait,
    Geometry,
    v0TrialObj,
} from './protocol.js'
import { Store, SyncSubscription } from '@dittolive/ditto'

export const COLLECTION = 'trials'
export const MODEL_VERSION = 0

type TrialDocV0 = Record<string, string | number | CoordValueV0>
export class TrialModel {
    dittoCod: DittoCOD
    config: Config
    store: Store | null = null
    trialSub: SyncSubscription | null = null
    constructor(dittoCod: DittoCOD, config: Config) {
        this.dittoCod = dittoCod
        this.config = config
    }

    private startV0ToDocV0(v0Start: v0TrialStart): TrialDocV0 {
        return {
            _id: v0Start.trial_id.toString(),
            name: v0Start.name,
            timestamp: v0Start.timestamp.toString(),
            num_targets: v0Start.num_targets,
            type: v0Start.type,
            coordinates: v0Start.coordinates,
            model_version: MODEL_VERSION,
        }
    }

    async startTrial(v0Start: v0TrialStart) {
        console.debug('-> start: ', v0Start)
        const doc = this.startV0ToDocV0(v0Start)
        const q =
            `INSERT INTO ${COLLECTION} DOCUMENTS (:doc) ` +
            'ON ID CONFLICT DO UPDATE'
        console.debug(`startTrial: ${q}`)
        await this.store!.execute(q, { doc: doc })
        console.debug('-> ', doc)
    }

    async endTrial(v0End: v0TrialEnd) {
        console.debug('-> end: ', v0End)
        const doc = {
            id: v0End.trial_id.toString(),
            name: v0End.name,
            timestamp: v0End.timestamp.toString(),
        }
        const q =
            `UPDATE ${COLLECTION} ` +
            'SET name = :name, timestamp = :timestamp ' +
            'WHERE _id = :id'
        console.debug(`endTrial: ${q}`)
        await this.store!.execute(q, doc)
        console.debug('-> ', doc)
    }

    private trialsQuery(limit: number | null = null): string {
        let q = `SELECT * FROM ${COLLECTION} ORDER BY timestamp`
        if (limit != null) {
            q += ` DESC LIMIT ${limit}`
        }
        return q
    }

    private async ensureSubscribed() {
        if (this.trialSub == null) {
            const sync = this.dittoCod.ditto!.sync
            const q = this.trialsQuery()
            console.debug(`Subscribing: ${q}`)
            this.trialSub = sync.registerSubscription(q)
        }
    }

    async pollTrial(): Promise<v0TrialObj> {
        this.ensureSubscribed()
        // TODO validate timestamp ordering gets latest state
        // Might want to get all results, sort by date, and log a warning if
        // the sorting by _id (trial_id) doesn't match.
        const q = this.trialsQuery(1)
        console.debug(`pollTrial: ${q}`)
        const res = await this.store!.execute(q)
        if (res.items.length == 0) {
            console.info('No trials created yet -> Wait')
            return new v0TrialWait()
        }

        const doc = res.items[0].value
        if (doc.model_version != MODEL_VERSION) {
            throw new Error(`Model version mismatch: ${doc.model_version}`)
        }
        const trialId = TrialId.fromString(doc._id)
        const ts = new Timestamp(new Date(doc.timestamp))
        switch (doc.name) {
            case 'Trial Start': {
                const geom = Geometry.fromFields(doc.type, doc.coordinates)
                if (!geom.isValid()) {
                    throw new Error(
                        `Invalid geometry: ${geom.type} ${geom.coordinates}`
                    )
                }
                return new v0TrialStart(
                    ts,
                    trialId,
                    doc.num_targets,
                    geom.type,
                    geom.coordinates
                )
            }
            case 'Trial End':
                return new v0TrialEnd(ts, trialId)
            default:
                throw new Error(`Unknown trial state: ${doc.name}`)
        }
    }

    async start() {
        assert(this.dittoCod.isRunning(), 'Must start DittoCOD before Models')
        this.store = this.dittoCod.store()
    }

    async stop() {
        if (this.trialSub != null) {
            this.trialSub.cancel()
            this.trialSub = null
        }
    }
}
