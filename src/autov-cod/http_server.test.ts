import axios from 'axios'
import { HttpServer } from './http_server.js'
import { Config } from '../common-cod/config.js'
import { DittoCOD } from '../ditto_cod.js'
import {
    AuthHeader,
    HttpStatus,
    bearerToken,
} from '../common-cod/basic_http.js'
import { TrialModel } from '../common-cod/trial_model.js'
import { TestDittoCOD } from '../test_ditto_cod.js'
import { LogLevel, getLogLevel, setLogLevel } from '../logger.js'
import { TelemModel } from '../common-cod/telem_model.js'
import { v0Telemetry } from '../common-cod/protocol.js'

setLogLevel(LogLevel.debug)
// TODO factor out common test fixture for Base and Autov http services
class TestFixture {
    private httpServer: HttpServer | null = null
    dittoCod: DittoCOD
    config: Config
    trialModel: TrialModel | null = null
    telemModel: TelemModel | null = null
    constructor() {
        this.config = new Config('./autov-config.json.example')
        if (this.config.isUnitTestConfig()) {
            console.warn(this.config.unitTestWarning())
            this.dittoCod = new TestDittoCOD(this.config.toDittoConfig())
        } else {
            this.dittoCod = new DittoCOD(this.config.toDittoConfig())
        }
    }
    async start() {
        this.trialModel = new TrialModel(this.dittoCod, this.config)
        this.telemModel = new TelemModel(this.dittoCod, this.config)
        await this.dittoCod.start(getLogLevel() == LogLevel.debug)
        await this.trialModel!.start()
        await this.telemModel!.start()
        this.httpServer = new HttpServer(
            this.trialModel!,
            this.telemModel!,
            this.config
        )
        await this.httpServer!.start()
    }
    async stop() {
        await this.httpServer!.stop()
        await this.telemModel!.stop()
        await this.trialModel!.stop()
        await this.dittoCod.stop()
    }

    getPort(): number {
        return this.httpServer!.base.config.port
    }

    authConfig(): Record<string, AuthHeader> {
        return {
            headers: bearerToken(this.httpServer!.base.config.bearerToken!),
        }
    }

    badAuth(): Record<string, AuthHeader> {
        return {
            headers: bearerToken('badBearerToken1234'),
        }
    }
}

const fixture = new TestFixture()

beforeAll(async () => {
    await fixture.start()
})

afterAll(async () => {
    await fixture.stop()
})

test('http sanity', async () => {
    await axios
        .get(
            `http://localhost:${fixture.getPort()}/api/trial`,
            fixture.authConfig()
        )
        .then((res) => {
            expect(res.status).toBe(HttpStatus.Ok)
            const obj = res.data
            expect(obj).toHaveProperty('version')
            expect(obj.version).toBe(0)
            expect(obj).toHaveProperty('name')
            expect(obj.name).toBe('Wait')
            expect(obj).toHaveProperty('timestamp')
            expect(obj.timestamp).toMatch(
                /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.*Z/
            )
            console.log('Validated GET /api/trial/ response from server')
        })
})

test('http auth failure get', async () => {
    await axios
        .get(
            `http://localhost:${fixture.getPort()}/api/trial`,
            fixture.badAuth()
        )
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        .then((res) => {
            expect(false).toBe(true)
        })
        .catch((err) => {
            expect(err.response.status).toBe(HttpStatus.Unauthorized)
        })
})

test('telem sanity', async () => {
    const p1 = '[-119.88577910,39.5277639]'
    const telemStr =
        '{"lon":-122.67648,"lat":45.52306,"alt":101,' +
        '"timestamp":"2024-03-11T22:26:23.718Z","id":"test_vehicle1",' +
        '"heading":92.312,"behavior":"some-algorithm","mission_phase":"find",' +
        '"phase_loc":{"type":"Polygon","coordinates":[' +
        p1 +
        ',' +
        '[-119.88577910818,39.5277639091],[-119.88077910818,39.5277639091],' +
        '[-119.88077910818,39.5317639091],[-119.88576818351,39.5317649091],' +
        p1 +
        ']}}'

    const telem = v0Telemetry.fromString(telemStr)
    expect(telem).toBeDefined()
    await axios
        .post(
            `http://localhost:${fixture.getPort()}/api/telemetry`,
            telemStr,
            fixture.authConfig()
        )
        .then((res) => {
            expect(res.status).toBe(HttpStatus.Created)
        })
})

test('telem bad request', async () => {
    const telemStr =
        '{"lon":-122.67648,"lat":45.52306,"alt":101,' +
        '"timestamp":"2024-03-11T22:26:23.718Z","id":"test_vehicle1",' +
        '"heading":92.312,"behavior":"some-algorithm","mission_phase":"find",' +
        '"phase_loc":{"type":"Polygon","coordinates":[' +
        '[-119.88577910818,39.52776390],[-119.88077910818,39.52776390],' +
        '[-119.88077910818,39.53176390],[-119.0,39.0]]}}'
    const telem = v0Telemetry.fromString(telemStr)
    expect(telem).toBeDefined()
    await axios
        .post(
            `http://localhost:${fixture.getPort()}/api/telemetry`,
            telemStr,
            fixture.authConfig()
        )
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        .then((res) => {
            expect(false).toBe(true)
        })
        .catch((err) => {
            expect(err.response.status).toBe(HttpStatus.BadRequest)
            expect(err.response.data).toMatch(/Invalid telemetry/)
        })
})
