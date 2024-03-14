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
} from '../common-cod/basic_http.js'
import { TrialModel } from '../common-cod/trial_model.js'

const URL_BASE = '/api'
const URL_TRIAL_START = URL_BASE + '/trial_start'
const URL_TRIAL_END = URL_BASE + '/trial_end'

export class HttpServer {
    trialModel: TrialModel
    config: Config
    base: BasicHttp

    constructor(trialModel: TrialModel, config: Config) {
        this.trialModel = trialModel
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

    private async handlePost(req: IncomingMessage, rep: ServerResponse) {
        const body = await requestData(req)
        try {
            const init = JSON.parse(body)
            if (init.version != undefined && init.version != 0) {
                const err = `Unsupported version: ${init.version}`
                console.info(err)
                rep.writeHead(HttpStatus.BadRequest, CONTENT_TYPE_JSON_CORS_ANY)
                rep.end(err)
            } else {
                if (init.name == 'Trial Start') {
                    await this.handleStart(init, req, rep)
                } else if (init.name == 'Trial End') {
                    await this.handleEnd(init, req, rep)
                } else if (init.name == 'Wait') {
                    // This is not in the spec--but would be good to have a
                    // side-effect free "ping" or "get status" endpoint to
                    // sanity/health check the service
                    await this.handleWait(body, req, rep)
                } else {
                    console.warn("Unsupported 'name' field:", init.name)
                    rep.writeHead(HttpStatus.BadRequest)
                    rep.end()
                }
            }
        } catch (e) {
            let msg = 'error handling POST'
            if (e instanceof Error) {
                msg += ': ' + e.message
            }
            console.info(msg)
            rep.writeHead(
                HttpStatus.UnprocessableEntity,
                CONTENT_TYPE_JSON_CORS_ANY
            )
            rep.end(msg)
        }
    }

    private async registerRoutes() {
        this.base.server.on(
            'request',
            (req: IncomingMessage, res: ServerResponse) => {
                if (this.base.handleOptions(req, res)) {
                    return
                }
                if (req.method !== 'POST') {
                    res.writeHead(HttpStatus.BadRequest, CORS_ALLOW_ANY)
                    res.end()
                    return
                }
                const url = normalizeUrl(req.url ?? '')
                switch (url) {
                    case URL_TRIAL_START:
                    case URL_TRIAL_END:
                        this.handlePost(req, res)
                        break
                    default:
                        console.info('unsupported url (404):', req.url)
                        res.writeHead(HttpStatus.NotFound, CORS_ALLOW_ANY)
                        res.end()
                        break
                }
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
