import axios from 'axios'
import { HttpServer } from './http_server.js'
import { Config } from '../common-cod/config.js'
import { DittoCOD } from '../ditto_cod.js'
import { v0TrialInit } from '../common-cod/protocol.js'

test('base http server', async () => {
    const config = new Config('./base-config.json.example')
    const dittoCod = new DittoCOD(config.toDittoConfig())
    const httpServer = new HttpServer(dittoCod, config)
    await httpServer.start()
    // POST init message to /api/trial and confirm 200 response
    const initMsg = new v0TrialInit()
    const postData = initMsg.serialize()
    const url = `http://localhost:${httpServer.base.config.port}/api/trial`
    await axios
        .post(url, postData)
        .then((res) => {
            expect(res.status).toBe(200)
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
            expect(res.status).toBe(401)
        })
        .catch((err) => {
            expect(err.response.status).toBe(401)
        })

    console.log('stopping http server')
    await httpServer.stop()
    console.log('finished http server init test')
})
