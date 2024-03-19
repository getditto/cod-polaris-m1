import { IncomingMessage, ServerResponse } from 'node:http'
import { Config } from '../common-cod/config.js'
import {
    TrialEndObjV0,
    TrialStartObjV0,
    v0TrialEnd,
    v0TrialStart,
    v0TrialWait,
} from '../common-cod/protocol.js'
import {
    BasicHttp,
    CONTENT_TYPE_JSON_CORS_ANY,
    CORS_ALLOW_ANY,
    HttpStatus,
    normalizeUrl,
    requestData,
    sanitizeResponse,
} from '../common-cod/basic_http.js'
import { TrialModel } from '../common-cod/trial_model.js'
import { TelemModel } from '../common-cod/telem_model.js'

const URL_BASE = '/api'
const URL_TRIAL_START = URL_BASE + '/trial_start'
const URL_TRIAL_END = URL_BASE + '/trial_end'
const URL_TELEMETRY = URL_BASE + '/telemetry'

export class HttpServer {
    trialModel: TrialModel
    telemModel: TelemModel
    config: Config
    base: BasicHttp

    constructor(
        trialModel: TrialModel,
        telemModel: TelemModel,
        config: Config
    ) {
        this.trialModel = trialModel
        this.telemModel = telemModel
        this.config = config
        this.base = new BasicHttp(config.toHttpConfig())
    }

    private async handleStart(
        obj: TrialStartObjV0,
        req: IncomingMessage,
        rep: ServerResponse
    ) {
        console.debug('Received trial Start:', obj)
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const tStart = v0TrialStart.fromObject(obj)
        await this.trialModel.startTrial(tStart)
        rep.writeHead(HttpStatus.Created, CORS_ALLOW_ANY)
        rep.end()
    }

    private async handleEnd(
        obj: TrialEndObjV0,
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        _req: IncomingMessage,
        rep: ServerResponse
    ) {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const tEnd = v0TrialEnd.fromObject(obj)
        await this.trialModel.endTrial(tEnd)
        rep.writeHead(HttpStatus.Created, CORS_ALLOW_ANY)
        rep.end()
    }

    private async handleWait(
        body: string,
        _req: IncomingMessage,
        rep: ServerResponse
    ) {
        const _v0Wait = v0TrialWait.fromString(body)
        console.debug('Received trial Wait (health check):', _v0Wait)
        rep.writeHead(HttpStatus.Ok, CORS_ALLOW_ANY)
        rep.end()
    }

    private async handlePost(req: IncomingMessage, res: ServerResponse) {
        const url = normalizeUrl(req.url ?? '')
        if (url !== URL_TRIAL_START && url !== URL_TRIAL_END) {
            console.info('unsupported url (404):', req.url)
            res.writeHead(HttpStatus.NotFound, CORS_ALLOW_ANY)
            res.end()
            return
        }
        const body = await requestData(req)
        try {
            const init = JSON.parse(body)
            if (init.version != undefined && init.version != 0) {
                const err = `Unsupported version: ${init.version}`
                console.info(err)
                res.writeHead(HttpStatus.BadRequest, CONTENT_TYPE_JSON_CORS_ANY)
                res.end(err)
            } else {
                if (init.name == 'Trial Start') {
                    await this.handleStart(init, req, res)
                } else if (init.name == 'Trial End') {
                    await this.handleEnd(init, req, res)
                } else if (init.name == 'Wait') {
                    // This is not in the spec--but would be good to have a
                    // side-effect free "ping" or "get status" endpoint to
                    // sanity/health check the service
                    await this.handleWait(body, req, res)
                } else {
                    console.warn("Unsupported 'name' field:", init.name)
                    res.writeHead(HttpStatus.BadRequest)
                    res.end()
                }
            }
        } catch (e) {
            let msg = 'error handling POST'
            if (e instanceof Error) {
                msg += ': ' + e.message
            }
            console.info(msg)
            res.writeHead(
                HttpStatus.UnprocessableEntity,
                CONTENT_TYPE_JSON_CORS_ANY
            )
            res.end(sanitizeResponse(msg))
        }
    }

    // TODO For demo / test: this is not in the specification yet.
    private async handleGet(req: IncomingMessage, res: ServerResponse) {
        const url = normalizeUrl(req.url ?? '')
        if (url != URL_TELEMETRY) {
            console.info('unsupported url (404):', req.url)
            res.writeHead(HttpStatus.NotFound, CORS_ALLOW_ANY)
            res.end()
        }
        const telemRecords = await this.telemModel.consumeTelem()
        const plainTelemObjs = telemRecords.map((t) => t.toObject())
        res.writeHead(HttpStatus.Ok, CONTENT_TYPE_JSON_CORS_ANY)
        res.end(JSON.stringify(plainTelemObjs))
    }

    private async router(req: IncomingMessage, res: ServerResponse) {
        if (req.method === 'GET') {
            return this.handleGet(req, res)
        } else if (req.method === 'POST') {
            return this.handlePost(req, res)
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
        console.info('<-- base http server shutdown')
        await this.base.stop()
    }
}
