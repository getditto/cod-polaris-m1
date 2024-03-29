import axios from 'axios'
import { HttpServer } from './http_server.js'
import { Config } from '../common-cod/config.js'
import { DittoCOD } from '../ditto_cod.js'
import { TestDittoCOD } from '../test_ditto_cod.js'
import {
    Geometry,
    Timestamp,
    TrialId,
    v0TrialEnd,
    v0TrialStart,
    v0TrialWait,
} from '../common-cod/protocol.js'
import {
    AuthHeader,
    HttpStatus,
    bearerToken,
} from '../common-cod/basic_http.js'
import { TrialModel } from '../common-cod/trial_model.js'
import { LogLevel, getLogLevel, setLogLevel } from '../logger.js'
import { TelemModel } from '../common-cod/telem_model.js'

setLogLevel(LogLevel.debug)
class TestFixture {
    private httpServer: HttpServer | null = null
    dittoCod: DittoCOD
    config: Config
    trialModel: TrialModel | null = null
    telemModel: TelemModel | null = null
    constructor() {
        this.config = new Config('./base-config.json.example')
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
}

const fixture = new TestFixture()

beforeAll(async () => {
    await fixture.start()
})

afterAll(async () => {
    await fixture.stop()
})

test('base health check', async () => {
    // For now: POST Wait message to /api/trial_start and confirm 200 response
    const initMsg = new v0TrialWait()
    const postData = initMsg.serialize()
    const url = `http://localhost:${fixture.getPort()}/api/trial_start`
    const aconfig = fixture.authConfig()
    await axios
        .post(url, postData, aconfig)
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
        .post(url, postBad, aconfig)
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
    const startMsg = new v0TrialStart(ts, id, n, geom.type, geom.coordinates)
    const postData = startMsg.serialize()
    test('valid trial start', async () => {
        const url = `http://localhost:${fixture.getPort()}/api/trial_start`
        await axios
            .post(url, postData, fixture.authConfig())
            .then((res) => {
                expect(res.status).toBe(HttpStatus.Created)
            })
            .catch((err) => {
                expect(err).toBeNull()
            })
    })

    test('invalid start trial_id', async () => {
        const url = `http://localhost:${fixture.getPort()}/api/trial_start`
        // have to bypass strong typing to mess up id
        const untypedObj = JSON.parse(postData)
        untypedObj.trial_id = '12.3'
        await axios
            .post(url, untypedObj, fixture.authConfig())
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
        const url = `http://localhost:${fixture.getPort()}/api/trial_end`
        await axios
            .post(url, postData, fixture.authConfig())
            .then((res) => {
                expect(res.status).toBe(HttpStatus.Created)
            })
            .catch((err) => {
                expect(err).toBeNull()
            })
    })

    test('invalid end trial_id', async () => {
        const url = `http://localhost:${fixture.getPort()}/api/trial_end`
        // have to bypass strong typing to mess up id
        const untypedObj = JSON.parse(postData)
        untypedObj.trial_id = '12.3.213x'
        await axios
            .post(url, untypedObj, fixture.authConfig())
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

describe('test auth failure', () => {
    const initMsg = new v0TrialWait()
    const postData = initMsg.serialize()
    test('auth fail health check', async () => {
        const url = `http://localhost:${fixture.getPort()}/api/trial_start`
        const aconfig = fixture.authConfig()
        aconfig.headers.Authorization = 'Bearer badtoken3243134'
        await axios
            .post(url, postData, aconfig)
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            .then((res) => {
                // axios rejects promises on non-200 status codes
                expect(false).toBeTruthy()
            })
            .catch((err) => {
                expect(err.response.status).toBe(HttpStatus.Unauthorized)
            })
    })
})
