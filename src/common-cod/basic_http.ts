import http, { IncomingMessage, ServerResponse } from 'node:http'
import { CondPromise } from '../util/cond_promise.js'

export class HttpConfig {
    host: string
    port: number
    bearerToken: string | null = null
    constructor(host: string, port: number, bearerToken: string | null) {
        this.host = host
        this.port = port
        this.bearerToken = bearerToken
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

export class AuthHeader {
    Authorization: string = ''
}

export function bearerToken(tok: string): AuthHeader {
    return { Authorization: `Bearer ${tok}` }
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
const PLAIN_TEXT = 'text/plain; charset=utf-8'
const CONTENT_TYPE_JSON = { 'Content-Type': JSON_CONTENT }
const CONTENT_TYPE_PLAIN = { 'Content-Type': PLAIN_TEXT }
export const CORS_ALLOW_ANY = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers':
        'Content-Type, Content-Length, X-Requested-With',
    'Access-Control-Max-Age': '86400',
    Vary: 'Origin',
}
export const CONTENT_TYPE_JSON_CORS_ANY = {
    ...CORS_ALLOW_ANY,
    ...CONTENT_TYPE_JSON,
}
export const CONTENT_TYPE_PLAIN_CORS_ANY = {
    ...CORS_ALLOW_ANY,
    ...CONTENT_TYPE_PLAIN,
}

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

    private handleOptions(req: IncomingMessage, rep: ServerResponse): boolean {
        console.debug(`handleOptions request: ${req.method} ${req.url}`)
        if (req.method === 'OPTIONS') {
            rep.writeHead(HttpStatus.NoConent, CORS_ALLOW_ANY)
            rep.end()
            return true
        }
        return false
    }

    private checkAuthorized(
        req: IncomingMessage,
        rep: ServerResponse
    ): boolean {
        if (
            this.config.bearerToken === null ||
            this.config.bearerToken === ''
        ) {
            return true
        }
        let bearer: string | null = null
        const auth = req.headers['authorization']
        if (auth) {
            const parts = auth.split(' ')
            if (parts.length === 2 && parts[0] === 'Bearer') {
                bearer = parts[1]
            }
        }
        if (bearer == null || bearer != this.config.bearerToken) {
            rep.writeHead(HttpStatus.Unauthorized, CORS_ALLOW_ANY)
            rep.end()
            return false
        } else {
            return true
        }
    }

    // Handle http requests that are common to both services.
    // Return true if the request is complete and response has been sent.
    // Return false if the request still needs to be handled.
    handleCommon(req: IncomingMessage, rep: ServerResponse): boolean {
        if (this.checkAuthorized(req, rep) === false) {
            return true
        }
        return this.handleOptions(req, rep)
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
