import axios from 'axios'
import { HttpServer } from './http_server.js'
import { Config } from '../common-cod/config.js'
import { DittoCOD } from '../ditto_cod.js'
import { HttpStatus } from '../common-cod/http_base.js'

class TestServer {
    private httpServer: HttpServer | null = null
    async start() {
        const config = new Config('./autov-config.json.example')
        const dittoCod = new DittoCOD(config.toDittoConfig())
        this.httpServer = new HttpServer(dittoCod, config)
        await this.httpServer!.start()
    }
    async stop() {
        await this.httpServer!.stop()
    }
}

const testServer = new TestServer()

beforeAll(async () => {
    await testServer.start()
})

afterAll(async () => {
    await testServer.stop()
})

test('http sanity', async () => {
    await axios.get('http://localhost:8081/api/trial').then((res) => {
        expect(res.status).toBe(HttpStatus.Ok)
        const obj = res.data
        expect(obj).toHaveProperty('version')
        expect(obj.version).toBe(0)
        expect(obj).toHaveProperty('name')
        expect(obj.name).toBe('Wait')
        expect(obj).toHaveProperty('timestamp')
        expect(obj.timestamp).toMatch(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.*Z/)
        console.log('Validated GET /api/trial/ response from server')
    })
})

test('http bad trial id', async () => {
    await axios
        .get('http://localhost:8081/api/trial/0.2.3/start')
        .then((res) => {
            console.info('Response:', res)
        })
        .catch((err) => {
            expect(err.response.status).toBe(HttpStatus.BadRequest)
        })
})
