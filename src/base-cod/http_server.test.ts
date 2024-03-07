import axios from 'axios'
import { HttpServer } from './http_server.js'
import { Config } from '../common-cod/config.js'
import { DittoCOD } from '../ditto_cod.js'
import {
    Geometry,
    Timestamp,
    TrialId,
    v0TrialEnd,
    v0TrialStart,
    v0TrialWait,
} from '../common-cod/protocol.js'
import { HttpStatus } from '../common-cod/http_base.js'

class TestServer {
    private httpServer: HttpServer | null = null
    async start() {
        const config = new Config('./base-config.json.example')
        const dittoCod = new DittoCOD(config.toDittoConfig())
        this.httpServer = new HttpServer(dittoCod, config)
        await this.httpServer!.start()
    }
    async stop() {
        await this.httpServer!.stop()
    }

    getPort(): number {
        return this.httpServer!.base.config.port
    }
}

const testServer = new TestServer()

beforeAll(async () => {
    await testServer.start()
})

afterAll(async () => {
    await testServer.stop()
})

test('base health check', async () => {
    // For now: POST Wait message to /api/trial_start and confirm 200 response
    const initMsg = new v0TrialWait()
    const postData = initMsg.serialize()
    const url = `http://localhost:${testServer.getPort()}/api/trial_start`
    await axios
        .post(url, postData)
        .then((res) => {
            expect(res.status).toBe(HttpStatus.Ok)
        })
        .catch((err) => {
            console.error('Response error status:', err.response.status)
            throw err
        })

    // POST init message with bad version to /api/trial and confirm 401 response
    initMsg.version = 99
    const postBad = initMsg.serialize()
    await axios
        .post(url, postBad)
        .then((res) => {
            expect(res.status).toBe(HttpStatus.BadRequest)
        })
        .catch((err) => {
            expect(err.response.status).toBe(HttpStatus.BadRequest)
        })
})

describe('base trial start', () => {
    const ts = new Timestamp()
    const id = TrialId.fromString('350.1.0')
    const n = 12
    const geom = Geometry.polygon([
        [-50.12, 30.12],
        [-51.12, 32.09],
        [-49.91, 32.101],
        [-50.12, 30.12],
    ])
    const startMsg = new v0TrialStart(ts, id, n, geom)
    const postData = startMsg.serialize()
    test('valid trial start', async () => {
        const url = `http://localhost:${testServer.getPort()}/api/trial_start`
        await axios
            .post(url, postData)
            .then((res) => {
                expect(res.status).toBe(HttpStatus.Created)
            })
            .catch((err) => {
                expect(err).toBeNull()
            })
    })

    test('invalid start trial_id', async () => {
        const url = `http://localhost:${testServer.getPort()}/api/trial_start`
        // have to bypass strong typing to mess up id
        const untypedObj = JSON.parse(postData)
        untypedObj.trial_id = '12.3'
        await axios
            .post(url, untypedObj)
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            .then((_res) => {
                // axios rejects promises on non-200 status codes
                expect(false).toBeTruthy()
            })
            .catch((err) => {
                expect(err.response.status).toBe(HttpStatus.UnprocessableEntity)
                expect(err.response.data).toContain('Invalid trial_id')
            })
    })
})

describe('base trial end', () => {
    const ts = new Timestamp()
    const id = TrialId.fromString('350.1.0')
    const startMsg = new v0TrialEnd(ts, id)
    const postData = startMsg.serialize()
    test('valid trial end', async () => {
        const url = `http://localhost:${testServer.getPort()}/api/trial_end`
        await axios
            .post(url, postData)
            .then((res) => {
                expect(res.status).toBe(HttpStatus.Created)
            })
            .catch((err) => {
                expect(err).toBeNull()
            })
    })

    test('invalid end trial_id', async () => {
        const url = `http://localhost:${testServer.getPort()}/api/trial_end`
        // have to bypass strong typing to mess up id
        const untypedObj = JSON.parse(postData)
        untypedObj.trial_id = '12.3.213x'
        await axios
            .post(url, untypedObj)
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            .then((_res) => {
                // axios rejects promises on non-200 status codes
                expect(false).toBeTruthy()
            })
            .catch((err) => {
                expect(err.response.status).toBe(HttpStatus.UnprocessableEntity)
                expect(err.response.data).toContain('Invalid trial_id')
            })
    })
})
