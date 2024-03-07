import assert from 'assert'
import { DittoCOD } from '../ditto_cod.js'
import { Config } from './config.js'
import { v0TrialEnd, v0TrialStart } from './protocol.js'

export class TrialModel {
    dittoCod: DittoCOD
    config: Config
    constructor(dittoCod: DittoCOD, config: Config) {
        this.dittoCod = dittoCod
        this.config = config
    }

    async startTrial(v0Start: v0TrialStart) {
        console.debug('TrialModel start: ', v0Start)
    }

    async endTrial(v0End: v0TrialEnd) {
        console.debug('TrialModel end: ', v0End)
    }

    async start() {
        assert(this.dittoCod.isRunning(), 'Must start DittoCOD before Models')
        // no-op for now
    }

    async stop() {
        // no-op for now
    }
}
