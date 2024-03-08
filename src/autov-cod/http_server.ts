import { IncomingMessage, ServerResponse } from 'node:http'

import { Config } from '../common-cod/config.js'
import {
    Geometry,
    Timestamp,
    TrialId,
    v0TrialEnd,
    v0TrialStart,
    v0TrialWait,
} from '../common-cod/protocol.js'
import { CondPromise } from '../util/cond_promise.js'
import {
    CONTENT_TYPE_JSON,
    HttpBase,
    HttpStatus,
    normalizeUrl,
} from '../common-cod/http_base.js'
import { TrialModel } from '../common-cod/trial_model.js'

export class HttpServer {
    trialModel: TrialModel
    config: Config
    base: HttpBase
    // A promise that resolves after we receive a 'close' event from http.Server
    serverFinished: CondPromise

    constructor(trialModel: TrialModel, config: Config) {
        this.trialModel = trialModel
        this.config = config
        this.base = new HttpBase(config.toHttpConfig())
        this.serverFinished = new CondPromise()
    }

    // GET of current trial state
    private async handleState(rep: ServerResponse) {
        // XXX TODO implement
        rep.writeHead(HttpStatus.Ok, CONTENT_TYPE_JSON)
        rep.end(new v0TrialWait().serialize())
    }

    // Long-poll GET waiting for start command
    private async handleStart(tid: TrialId, rep: ServerResponse) {
        console.debug('Received trial start:', tid)
        // XXX TODO implement
        const ts = new Timestamp()
        const id = new TrialId()
        const num_targets = 3
        const geom = new Geometry()
        rep.writeHead(HttpStatus.Ok, CONTENT_TYPE_JSON)
        rep.end(
            new v0TrialStart(
                ts,
                id,
                num_targets,
                geom.type,
                geom.coordinates
            ).serialize()
        )
    }

    // Long-poll GET waiting for start command
    private async handleEnd(tid: TrialId, rep: ServerResponse) {
        console.debug('Received trial end:', tid)
        // XXX TODO implement
        const ts = new Timestamp()
        const id = new TrialId()
        rep.writeHead(HttpStatus.Ok, CONTENT_TYPE_JSON)
        rep.end(new v0TrialEnd(ts, id).serialize())
    }

    private async router(req: IncomingMessage, res: ServerResponse) {
        if (req.method !== 'GET') {
            res.writeHead(HttpStatus.BadRequest)
            res.end()
            return
        }
        const url = normalizeUrl(req.url ?? '')
        const toks = url.split('/').slice(1)
        if (toks.length >= 2 && toks[0] == 'api' && toks[1] == 'trial') {
            if (toks.length == 2) {
                // GET /api/trial -> non-blocking, latest state
                return this.handleState(res)
            } else if (toks.length == 4) {
                const trialId = TrialId.fromString(toks[2])
                if (toks[3] == 'start') {
                    // GET /api/trial/<id>/start -> block for start
                    return this.handleStart(trialId, res)
                } else if (toks[3] == 'end') {
                    // GET /api/trial/<id>/end -> block for end
                    return this.handleEnd(trialId, res)
                }
            }

            res.writeHead(HttpStatus.NotFound)
            res.end()
        }
    }

    private async registerRoutes() {
        this.base.server.on(
            'request',
            (req: IncomingMessage, res: ServerResponse) => {
                this.router(req, res).catch((e) => {
                    console.info('BadRequest: ', e.message)
                    res.writeHead(HttpStatus.BadRequest)
                    res.end()
                })
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
