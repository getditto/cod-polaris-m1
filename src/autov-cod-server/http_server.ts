import http, { IncomingMessage, ServerResponse } from 'node:http'

import { DittoCOD } from '../ditto_cod.js'
import { Config } from './config.js'
import {
    Geometry,
    Timestamp,
    TrialId,
    v0TrialEnd,
    v0TrialInit,
    v0TrialStart,
} from './protocol.js'
import { CondPromise } from '../util/cond_promise.js'

const URL_BASE = '/api/trial/0/'
const JSON_CONTENT = 'application/json; charset=utf-8'

export class HttpServer {
    dittoCod: DittoCOD
    config: Config
    server: http.Server
    // A promise that resolves after we receive a 'close' event from http.Server
    serverFinished: CondPromise

    constructor(dittoCod: DittoCOD, config: Config) {
        this.dittoCod = dittoCod
        this.config = config
        this.server = http.createServer()
        this.serverFinished = new CondPromise()
    }

    private async handleState(_req: IncomingMessage, rep: ServerResponse) {
        // XXX TODO implement
        rep.writeHead(200, { 'Content-Type': JSON_CONTENT })
        rep.end(new v0TrialInit().serialize())
    }

    private async handleStart(_req: IncomingMessage, rep: ServerResponse) {
        // XXX TODO implement
        const ts = new Timestamp()
        const id = new TrialId()
        const num_targets = 3
        const geom = new Geometry()
        rep.writeHead(200, { 'Content-Type': JSON_CONTENT })
        rep.end(new v0TrialStart(ts, id, num_targets, geom).serialize())
    }

    private async handleEnd(_req: IncomingMessage, rep: ServerResponse) {
        // XXX TODO implement
        const ts = new Timestamp()
        const id = new TrialId()
        rep.writeHead(200, { 'Content-Type': JSON_CONTENT })
        rep.end(new v0TrialEnd(ts, id).serialize())
    }

    private async registerRoutes() {
        this.server.on(
            'request',
            (req: IncomingMessage, res: ServerResponse) => {
                if (req.method !== 'GET') {
                    res.writeHead(405)
                    res.end()
                    return
                }
                switch (req.url) {
                    case URL_BASE + 'state':
                        this.handleState(req, res)
                        break
                    case URL_BASE + 'start':
                        this.handleStart(req, res)
                        break
                    case URL_BASE + 'end':
                        this.handleEnd(req, res)
                        break
                    default:
                        res.writeHead(404)
                        res.end()
                }
            }
        )
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

        await this.registerRoutes()
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
