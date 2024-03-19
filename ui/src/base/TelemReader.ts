import { LogCb } from '../common/Log'
import { TelemRecord } from '../common/types'
import { assert } from '../common/util'
import { BaseClient } from './BaseClient'

const BACKOFF_MIN = 200
const BACKOFF_MAX = 5000
export type TelemCb = (t: TelemRecord[]) => void
export class TelemReader {
    client: BaseClient
    telemCb: TelemCb
    logCb: LogCb
    running: boolean
    backOffTimer: number

    constructor(client: BaseClient, telemCb: TelemCb, logCb: LogCb) {
        this.client = client
        this.telemCb = telemCb
        this.logCb = logCb
        this.running = false
        this.backOffTimer = BACKOFF_MIN
    }

    destructor() {
        console.warn('TelemReader.destructor')
    }

    private async backOff() {
        this.backOffTimer = Math.min(this.backOffTimer * 1.3, BACKOFF_MAX)
        await new Promise((resolve) => setTimeout(resolve, this.backOffTimer))
    }

    private backOffReset() {
        this.backOffTimer = BACKOFF_MIN
    }

    async readLoop() {
        assert(this.running != undefined, 'running undefined in loop WTF')
        console.debug('TelemReader.readLoop ', this.running)
        while (this.running) {
            const telem = await this.client.consumeTelem()
            if (telem && telem.length > 0) {
                this.telemCb(telem)
                this.backOffReset()
            } else {
                await this.backOff()
            }
        }
    }

    start() {
        assert(this.running != undefined, 'running undefined in start WTF')
        if (!this.running) {
            console.debug('TelemReader.start')
            this.running = true
            // capture this so it doesn't get cleaned up
            setTimeout(() => this.readLoop(), 0)
        }
    }

    stop() {
        console.debug('TelemReader.stop')
        this.running = false
    }
}
