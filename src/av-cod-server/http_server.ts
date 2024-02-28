import { fastify, FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'
import { DittoCOD } from '../ditto_cod.js'
import { Config } from './config.js'
import {
    Geometry,
    Timestamp,
    TrialId,
    v0TrialEnd,
    v0TrialInit,
    v0TrialStart,
} from './protocol.js'

const URL_BASE = '/api/trial/0/'
const JSON_CONTENT = 'application/json; charset=utf-8'

export class HttpServer {
    dittoCod: DittoCOD
    config: Config
    fastify: FastifyInstance

    constructor(dittoCod: DittoCOD, config: Config) {
        this.dittoCod = dittoCod
        this.config = config
        this.fastify = fastify({ logger: true })
    }

    private async handleState(_req: FastifyRequest, rep: FastifyReply) {
        // XXX TODO implement
        rep.header('Content-Type', JSON_CONTENT)
            .code(200)
            .send(new v0TrialInit().serialize())
    }

    private async handleStart(_req: FastifyRequest, rep: FastifyReply) {
        // XXX TODO implement
        const ts = new Timestamp()
        const id = new TrialId()
        const num_targets = 3
        const geom = new Geometry()
        rep.header('Content-Type', JSON_CONTENT)
            .code(200)
            .send(new v0TrialStart(ts, id, num_targets, geom).serialize())
    }

    private async handleEnd(_req: FastifyRequest, rep: FastifyReply) {
        // XXX TODO implement
        const ts = new Timestamp()
        const id = new TrialId()
        rep.header('Content-Type', JSON_CONTENT)
            .code(200)
            .send(new v0TrialEnd(ts, id).serialize())
    }

    private async registerRoutes() {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        this.fastify.get(URL_BASE + 'state', this.handleState)
        this.fastify.get(URL_BASE + 'start', this.handleStart)
        this.fastify.get(URL_BASE + 'end', this.handleEnd)
    }

    async start() {
        const port = parseInt(this.config.getStr('HTTP_PORT'))

        this.registerRoutes()

        const start = async () => {
            this.fastify
                .listen({
                    host: '127.0.0.1',
                    port: port,
                })
                .then((address) =>
                    console.info(`--> http server listening on ${address}`)
                )
                .catch((err) => {
                    this.fastify.log.error(err)
                    throw err
                })
        }
        start()
    }

    async stop() {
        console.info('<-- http server shutdown')
        this.fastify.close()
    }
}
