import { LogCb } from '../common/Log'
import { TelemRecord } from '../common/types'
import { BaseClient } from './BaseClient'

export type TelemCb = (t: TelemRecord[]) => void
export class TelemReader {
    client: BaseClient
    telemCb: TelemCb
    logCb: LogCb
    running: boolean

    constructor(client: BaseClient, telemCb: TelemCb, logCb: LogCb) {
        this.client = client
        this.telemCb = telemCb
        this.logCb = logCb
        this.running = false
    }

    destructor() {
        console.warn('TelemReader.destructor')
    }

    async readLoop() {
        console.debug('TelemReader.readLoop')
        while (this.running) {
            const telem = await this.client.consumeTelem()
            console.debug('XXX consumeTelem() ->', telem)
            if (telem) {
                this.telemCb(telem)
            }
            await new Promise((resolve) => setTimeout(resolve, 1000))
        }
    }

    start() {
        console.debug('TelemReader.start')
        this.running = true
        setTimeout(this.readLoop, 0)
    }

    stop() {
        console.debug('TelemReader.stop')
        this.running = false
    }
}
