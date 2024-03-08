import assert from 'assert'
import { DittoCOD } from '../ditto_cod.js'
import { Config } from './config.js'
import { CoordValueV0, v0TrialEnd, v0TrialStart } from './protocol.js'
import { Store } from '@dittolive/ditto'

export const COLLECTION = 'trials'
export const MODEL_VERSION = 0

type TrialDocV0 = Record<string, string | number | CoordValueV0>
export class TrialModel {
    dittoCod: DittoCOD
    config: Config
    store: Store | null = null
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
        console.debug('TrialModel start: ', v0Start)
        const doc = this.startV0ToDocV0(v0Start)
        await this.store!.execute(
            `INSERT INTO ${COLLECTION} DOCUMENTS (:doc) ` +
                'ON ID CONFLICT DO UPDATE',
            { doc }
        )
        console.debug('-> ', doc)
    }

    async endTrial(v0End: v0TrialEnd) {
        console.debug('TrialModel end: ', v0End)
        const doc = {
            id: v0End.trial_id.toString(),
            name: v0End.name,
            timestamp: v0End.timestamp.toString(),
        }
        await this.store!.execute(
            `UPDATE ${COLLECTION} ` +
                'SET name = :name, timestamp = :timestamp ' +
                'WHERE _id = :id',
            doc
        )
        console.debug('-> ', doc)
    }

    async start() {
        assert(this.dittoCod.isRunning(), 'Must start DittoCOD before Models')
        this.store = this.dittoCod.store()
    }

    async stop() {
        // no-op for now
    }
}
