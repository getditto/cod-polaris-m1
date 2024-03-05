import { IncomingMessage, ServerResponse } from 'node:http'

import { DittoCOD } from '../ditto_cod.js'
import { Config } from '../common-cod/config.js'
import { v0TrialInit } from '../common-cod/protocol.js'
import { HttpBase } from '../common-cod/http_base.js'

const URL_BASE = '/api/trial'
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
        rep.writeHead(400)
        rep.end()
    }

    private async handleEnd(
        body: string,
        req: IncomingMessage,
        rep: ServerResponse
    ) {
        // TODO
        // For now return 400
        rep.writeHead(400)
        rep.end()
    }

    private async handleInit(
        body: string,
        _req: IncomingMessage,
        rep: ServerResponse
    ) {
        const _v0Init = v0TrialInit.fromString(body)
        console.debug('Received trial init:', _v0Init)
        rep.writeHead(200, { 'Content-Type': JSON_CONTENT })
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
                    rep.writeHead(401)
                    rep.end()
                } else {
                    if (init.name == 'Trial Start') {
                        await this.handleStart(body, req, rep)
                    } else if (init.name == 'Trial End') {
                        await this.handleEnd(body, req, rep)
                    } else if (init.name == 'Init') {
                        await this.handleInit(body, req, rep)
                    } else {
                        rep.writeHead(400)
                        rep.end()
                    }
                }
            } catch (e) {
                console.log('error handling POST (401):', e)
                rep.writeHead(401)
                rep.end()
            }
        })
    }

    private async registerRoutes() {
        this.base.server.on(
            'request',
            (req: IncomingMessage, res: ServerResponse) => {
                if (req.method !== 'POST') {
                    res.writeHead(405)
                    res.end()
                    return
                }
                switch (req.url) {
                    // TODO normalize url to handle w/ and w/o trailing slash
                    case URL_BASE:
                        this.handlePost(req, res)
                        break
                    default:
                        console.info('unsupported url (404):', req.url)
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
        console.info('<-- base http server shutdown')
        await this.base.stop()
    }
}
