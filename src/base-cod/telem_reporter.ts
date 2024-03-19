import { TelemModel, V0TelemWithId } from '../common-cod/telem_model.js'
import { Config } from '../common-cod/config.js'

// Service which pushes telemetry updates from the COD to a base HTTP API service.
export class TelemReporter {
    config: Config
    telemModel: TelemModel

    constructor(telemModel: TelemModel, config: Config) {
        this.telemModel = telemModel
        this.config = config
    }

    private handleUpdate(telem: V0TelemWithId[]) {
        console.info('-> update: ', telem)
    }

    async start() {
        console.info('TelemReporter.start()')
        this.telemModel.subscribe(this.handleUpdate)
    }

    async stop() {
        console.info('TelemReporter.stop()')
        this.telemModel.unsubscribe()
    }
}
