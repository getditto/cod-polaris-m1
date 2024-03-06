import { IncomingMessage, ServerResponse } from 'node:http'

import { DittoCOD } from '../ditto_cod.js'
import { Config } from '../common-cod/config.js'
import { v0TrialWait } from '../common-cod/protocol.js'
import { HttpBase, HttpStatus, normalizeUrl } from '../common-cod/http_base.js'

const URL_BASE = '/api'
const URL_TRIAL_START = URL_BASE + '/trial_start'
const URL_TRIAL_END = URL_BASE + '/trial_end'

const JSON_CONTENT = 'application/json; charset=utf-8'

export class HttpServer {
    dittoCod: DittoCOD
    config: Config
    base: HttpBase

    constructor(dittoCod: DittoCOD, config: Config) {
        this.dittoCod = dittoCod
        this.config = config
        this.base = new HttpBase(config.toHttpConfig())
    }

    private async handleStart(
        body: string,
        req: IncomingMessage,
        rep: ServerResponse
    ) {
        // TODO
        // For now return 400
        rep.writeHead(HttpStatus.BadRequest)
        rep.end()
    }

    private async handleEnd(
        body: string,
        req: IncomingMessage,
        rep: ServerResponse
    ) {
        // TODO
        // For now return 400
        rep.writeHead(HttpStatus.BadRequest)
        rep.end()
    }

    private async handleWait(
        body: string,
        _req: IncomingMessage,
        rep: ServerResponse
    ) {
        const _v0Wait = v0TrialWait.fromString(body)
        console.debug('Received trial Wait (health check):', _v0Wait)
        rep.writeHead(HttpStatus.Ok, { 'Content-Type': JSON_CONTENT })
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
                    console.info('unsupported version:', init.version)
                    rep.writeHead(HttpStatus.BadRequest)
                    rep.end()
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
                console.log('error handling POST (422):', e)
                rep.writeHead(HttpStatus.UnprocessableEntity)
                rep.end()
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
