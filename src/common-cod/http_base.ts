import http, { IncomingMessage, ServerResponse } from 'node:http'
import { Config } from '../config.js'
import { CondPromise } from '../util/cond_promise.js'

export class HttpBase {
    // TODO factor out http-specific config
    config: Config
    server: http.Server
    // A promise that resolves after we receive a 'close' event from http.Server
    serverFinished: CondPromise

    constructor(config: Config) {
        this.config = config
        this.server = http.createServer()
        this.serverFinished = new CondPromise()
    }

    private async registerEvents() {
        this.server.on('close', () => {
            console.info('http server close event')
            this.serverFinished.resolve()
        })
        this.server.on(
            'dropRequest',
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            (_req: IncomingMessage, _resp: ServerResponse) => {
                console.warn(
                    'http server reached maxRequestsPerSocket, dropping request'
                )
            }
        )
    }

    async start() {
        const port = parseInt(this.config.getStr('HTTP_PORT'))

        await this.registerEvents()

        const options = {
            host: this.config.getStr('HTTP_HOST'),
            port: port,
        }
        this.server.listen(options, () => {
            console.info(`--> http server listening on ${options.host}:${port}`)
        })
    }

    async stop() {
        console.info('<-- http server shutdown')
        this.server.close()
        // waits for http.Server 'close' event
        await this.serverFinished.getPromise()
    }
}
