import http, { IncomingMessage, ServerResponse } from 'node:http'
import { CondPromise } from '../util/cond_promise.js'

export class HttpConfig {
    host: string
    port: number
    constructor(host: string, port: number) {
        this.host = host
        this.port = port
    }
}

// Response codes allowed by the spec we're implementing
export enum HttpStatus {
    Ok = 200,
    Created = 201,
    NoConent = 204, // only used for http OPTIONS
    BadRequest = 400,
    Unauthorized = 401,
    NotFound = 404,
    UnprocessableEntity = 422,
    TooManyRequests = 429,
}

export function normalizeUrl(url: string): string {
    if (url.endsWith('/')) {
        return url.slice(0, -1)!
    }
    return url
}

// Basic prevention from XSS getting through our exception -> http response
// body path via some future 3rd party dependency
export function sanitizeResponse(body: string) {
    return body.replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

const JSON_CONTENT = 'application/json; charset=utf-8'
const CONTENT_TYPE_JSON = { 'Content-Type': JSON_CONTENT }
export const CORS_ALLOW_ANY = {
    'Access-Control-Allow-Origin': '*', /* @dev First, read about security */
    'Access-Control-Allow-Methods': 'OPTIONS, POST, GET',
    'Access-Control-Max-Age': 86400, // 30 days
  }
export const CONTENT_TYPE_JSON_CORS_ANY = { ...CONTENT_TYPE_JSON, ...CORS_ALLOW_ANY }

export class BasicHttp {
    // TODO factor out http-specific config
    config: HttpConfig
    server: http.Server
    // A promise that resolves after we receive a 'close' event from http.Server
    serverFinished: CondPromise

    constructor(config: HttpConfig) {
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

    handleOptions(req: IncomingMessage, rep: ServerResponse): boolean {
        if (req.method === 'OPTIONS') {
            rep.writeHead(HttpStatus.NoConent, CORS_ALLOW_ANY)
            rep.end()
            return true
        }
        return false
    }

    async start() {
        await this.registerEvents()

        const options = {
            host: this.config.host,
            port: this.config.port,
        }
        this.server.listen(options, () => {
            console.info(
                `--> http server listening on ${options.host}:${this.config.port}`
            )
        })
    }

    async stop() {
        console.info('<-- http server shutdown')
        this.server.close()
        // waits for http.Server 'close' event
        await this.serverFinished.getPromise()
    }
}

export async function requestData(req: IncomingMessage): Promise<string> {
    return new Promise((resolve, reject) => {
        let data = ''
        req.on('data', (chunk) => {
            data += chunk
        })
        req.on('end', () => {
            resolve(data)
        })
        req.on('error', (err) => {
            reject(err)
        })
    })
}
