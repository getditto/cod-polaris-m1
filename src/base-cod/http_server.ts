import { IncomingMessage, ServerResponse } from 'node:http'
import { Config } from '../common-cod/config.js'
import {
    v0TrialEnd,
    v0TrialStart,
    v0TrialWait,
} from '../common-cod/protocol.js'
import {
    CONTENT_TYPE_JSON,
    HttpBase,
    HttpStatus,
    normalizeUrl,
} from '../common-cod/http_base.js'
import { TrialModel } from '../common-cod/trial_model.js'

const URL_BASE = '/api'
const URL_TRIAL_START = URL_BASE + '/trial_start'
const URL_TRIAL_END = URL_BASE + '/trial_end'

export class HttpServer {
    trialModel: TrialModel
    config: Config
    base: HttpBase

    constructor(trialModel: TrialModel, config: Config) {
        this.trialModel = trialModel
        this.config = config
        this.base = new HttpBase(config.toHttpConfig())
    }

    private async handleStart(
        body: string,
        req: IncomingMessage,
        rep: ServerResponse
    ) {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const _tStart = v0TrialStart.fromString(body)
        rep.writeHead(HttpStatus.Created)
        rep.end()
    }

    private async handleEnd(
        body: string,
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        _req: IncomingMessage,
        rep: ServerResponse
    ) {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const _tEnd = v0TrialEnd.fromString(body)
        rep.writeHead(HttpStatus.Created)
        rep.end()
    }

    private async handleWait(
        body: string,
        _req: IncomingMessage,
        rep: ServerResponse
    ) {
        const _v0Wait = v0TrialWait.fromString(body)
        console.debug('Received trial Wait (health check):', _v0Wait)
        rep.writeHead(HttpStatus.Ok)
        rep.end()
    }

    private async handlePost(req: IncomingMessage, rep: ServerResponse) {
        let body = ''
        req.on('data', (chunk) => {
            body += chunk
        })
        req.on('end', async () => {
            try {
                const init = JSON.parse(body)
                if (init.version != undefined && init.version != 0) {
                    const err = `Unsupported version: ${init.version}`
                    console.info(err)
                    rep.writeHead(HttpStatus.BadRequest, CONTENT_TYPE_JSON)
                    rep.end(err)
                } else {
                    if (init.name == 'Trial Start') {
                        await this.handleStart(body, req, rep)
                    } else if (init.name == 'Trial End') {
                        await this.handleEnd(body, req, rep)
                    } else if (init.name == 'Wait') {
                        // This is not in the spec--but would be good to have a
                        // side-effect free "ping" or "get status" endpoint to
                        // sanity/health check the service
                        await this.handleWait(body, req, rep)
                    } else {
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
                rep.writeHead(HttpStatus.UnprocessableEntity, CONTENT_TYPE_JSON)
                rep.end(msg)
            }
        })
    }

    private async registerRoutes() {
        this.base.server.on(
            'request',
            (req: IncomingMessage, res: ServerResponse) => {
                if (req.method !== 'POST') {
                    res.writeHead(HttpStatus.BadRequest)
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
                        res.writeHead(HttpStatus.NotFound)
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
