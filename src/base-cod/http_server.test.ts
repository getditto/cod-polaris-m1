import axios from 'axios'
import { HttpServer } from './http_server.js'
import { Config } from '../common-cod/config.js'
import { DittoCOD } from '../ditto_cod.js'
import { v0TrialWait } from '../common-cod/protocol.js'
import { HttpStatus } from '../common-cod/http_base.js'

test('base http server', async () => {
    const config = new Config('./base-config.json.example')
    const dittoCod = new DittoCOD(config.toDittoConfig())
    const httpServer = new HttpServer(dittoCod, config)
    await httpServer.start()
    // For now: POST Wait message to /api/trial_start and confirm 200 response
    const initMsg = new v0TrialWait()
    const postData = initMsg.serialize()
    const url = `http://localhost:${httpServer.base.config.port}/api/trial_start`
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

    console.log('stopping http server')
    await httpServer.stop()
    console.log('finished http server init test')
})
