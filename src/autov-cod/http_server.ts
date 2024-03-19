import { IncomingMessage, ServerResponse } from 'node:http'

import { Config } from '../common-cod/config.js'
import { v0TrialObj, v0Telemetry } from '../common-cod/protocol.js'
import { CondPromise } from '../util/cond_promise.js'
import {
    CONTENT_TYPE_JSON_CORS_ANY,
    BasicHttp,
    HttpStatus,
    normalizeUrl,
    requestData,
} from '../common-cod/basic_http.js'
import { TrialModel } from '../common-cod/trial_model.js'
import { assert } from 'node:console'
import { TelemModel } from '../common-cod/telem_model.js'
import { sanitizeResponse } from '../common-cod/basic_http.js'

export class HttpServer {
    trialModel: TrialModel
    telemModel: TelemModel
    config: Config
    base: BasicHttp
    // A promise that resolves after we receive a 'close' event from http.Server
    serverFinished: CondPromise

    constructor(
        trialModel: TrialModel,
        telemModel: TelemModel,
        config: Config
    ) {
        this.trialModel = trialModel
        this.telemModel = telemModel
        this.config = config
        this.base = new BasicHttp(config.toHttpConfig())
        this.serverFinished = new CondPromise()
    }

    // GET of current trial state
    private async handleState(rep: ServerResponse) {
        const obj: v0TrialObj = await this.trialModel.pollTrial()
        rep.writeHead(HttpStatus.Ok, CONTENT_TYPE_JSON_CORS_ANY)
        rep.end(obj.serialize())
    }

    // Long-poll GET waiting for start command
    private async handleStart(rep: ServerResponse) {
        console.debug('await trial start')
        const res = await this.trialModel.awaitTrial('Trial Start')
        if (res.errorStr) {
            throw new Error(res.errorStr)
        }
        rep.writeHead(HttpStatus.Ok, CONTENT_TYPE_JSON_CORS_ANY)
        rep.end(res.result!.serialize())
    }

    // Long-poll GET waiting for start command
    private async handleEnd(rep: ServerResponse) {
        console.debug('await trial end')
        const res = await this.trialModel.awaitTrial('Trial End')
        if (res.errorStr) {
            throw new Error(res.errorStr)
        }
        rep.writeHead(HttpStatus.Ok, CONTENT_TYPE_JSON_CORS_ANY)
        rep.end(res.result!.serialize())
    }

    private async handleTrial(req: IncomingMessage, res: ServerResponse) {
        assert(req.method === 'GET')
        const url = normalizeUrl(req.url ?? '')
        const toks = url.split('/').slice(1)
        if (toks.length >= 2 && toks[0] == 'api' && toks[1] == 'trial') {
            if (toks.length == 2) {
                // GET /api/trial -> non-blocking, latest state
                return this.handleState(res)
            } else if (toks.length == 3) {
                if (toks[2] == 'start') {
                    // GET /api/trial/<id>/start -> block for start
                    return this.handleStart(res)
                } else if (toks[2] == 'end') {
                    // GET /api/trial/<id>/end -> block for end
                    return this.handleEnd(res)
                }
            }
        }
        res.writeHead(HttpStatus.NotFound)
        res.end()
    }

    private async handleTelem(req: IncomingMessage, res: ServerResponse) {
        assert(req.method === 'POST')
        const url = normalizeUrl(req.url ?? '')
        const toks = url.split('/').slice(1)
        if (toks.length == 2 && toks[0] == 'api' && toks[1] == 'telemetry') {
            const body = await requestData(req)
            console.debug('Received telemetry:', body)
            const v0Telem = v0Telemetry.fromString(body)
            const err = v0Telem.validationError()
            if (err) {
                throw new Error(`Invalid telemetry: ${err}`)
            }
            this.telemModel.writeTelem(v0Telem)
            // XXX TODO spec requires echoing back the object in the response body
            res.writeHead(HttpStatus.Created)
            res.end()
        } else {
            res.writeHead(HttpStatus.NotFound)
            res.end()
        }
    }

    private async router(req: IncomingMessage, res: ServerResponse) {
        if (req.method === 'GET') {
            return this.handleTrial(req, res)
        } else if (req.method === 'POST') {
            return this.handleTelem(req, res)
        }
    }

    private async registerRoutes() {
        this.base.server.on(
            'request',
            (req: IncomingMessage, res: ServerResponse) => {
                if (this.base.handleCommon(req, res)) {
                    return
                }
                this.router(req, res).catch((e) => {
                    console.info('BadRequest: ', e.message)
                    res.writeHead(HttpStatus.BadRequest)
                    res.end(sanitizeResponse(e.message))
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
