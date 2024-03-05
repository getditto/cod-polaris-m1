import { IncomingMessage, ServerResponse } from 'node:http'

import { DittoCOD } from '../ditto_cod.js'
import { Config } from '../common-cod/config.js'
import {
    Geometry,
    Timestamp,
    TrialId,
    v0TrialEnd,
    v0TrialInit,
    v0TrialStart,
} from '../common-cod/protocol.js'
import { CondPromise } from '../util/cond_promise.js'
import { HttpBase } from '../common-cod/http_base.js'

const URL_BASE = '/api/trial/0/'
const JSON_CONTENT = 'application/json; charset=utf-8'

export class HttpServer {
    dittoCod: DittoCOD
    config: Config
    base: HttpBase
    // A promise that resolves after we receive a 'close' event from http.Server
    serverFinished: CondPromise

    constructor(dittoCod: DittoCOD, config: Config) {
        this.dittoCod = dittoCod
        this.config = config
        this.base = new HttpBase(config.toHttpConfig())
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
        this.base.server.on(
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

    async start() {
        await this.registerRoutes()
        await this.base.start()
    }

    async stop() {
        console.info('<-- autov http server shutdown')
        await this.base.stop()
    }
}
