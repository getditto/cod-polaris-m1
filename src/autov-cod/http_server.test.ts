import axios from 'axios'
import { HttpServer } from './http_server.js'
import { Config } from '../common-cod/config.js'
import { DittoCOD } from '../ditto_cod.js'
import { HttpStatus } from '../common-cod/basic_http.js'
import { TrialModel } from '../common-cod/trial_model.js'
import { TestDittoCOD } from '../test_ditto_cod.js'
import { LogLevel, getLogLevel, setLogLevel } from '../logger.js'

setLogLevel(LogLevel.debug)
// TODO factor out common test fixture for Base and Autov http services
class TestFixture {
    private httpServer: HttpServer | null = null
    dittoCod: DittoCOD
    config: Config
    trialModel: TrialModel | null = null
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
        await this.dittoCod.start(getLogLevel() == LogLevel.debug)
        await this.trialModel!.start()
        this.httpServer = new HttpServer(this.trialModel!, this.config)
        await this.httpServer!.start()
    }
    async stop() {
        await this.httpServer!.stop()
        await this.trialModel!.stop()
        await this.dittoCod.stop()
    }

    getPort(): number {
        return this.httpServer!.base.config.port
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
        .get(`http://localhost:${fixture.getPort()}/api/trial`)
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

test('http bad trial id', async () => {
    await axios
        .get(`http://localhost:${fixture.getPort()}/api/trial/0.2.3/start`)
        .then((res) => {
            console.info('Response:', res.data)
        })
        .catch((err) => {
            expect(err.response.status).toBe(HttpStatus.BadRequest)
        })
})
