import http, { IncomingMessage } from 'node:http'
import { HttpServer } from './http_server.js'
import { Config } from './config.js'
import { DittoCOD } from '../ditto_cod.js'
import { sleep } from '../util/util.js'

// convenience wrapper around node's low-level http interface
async function httpGet(url: string): Promise<string> {
    return new Promise((resolve, reject) => {
        http.get(url, (res: IncomingMessage) => {
            let data = ''
            res.on('data', (chunk) => {
                data += chunk
            })
            res.on('end', () => {
                resolve(data)
            })
        }).on('error', (err) => {
            reject(err)
        })
    })
}

test('http server init', async () => {
    const config = new Config('./acs-config.json.example')
    const dittoCod = new DittoCOD(config.toDittoConfig())
    const httpServer = new HttpServer(dittoCod, config)
    await httpServer.start()
    const response = await httpGet('http://localhost:8081/api/trial/0/state')
    // deserialize into object and check fields
    const obj = JSON.parse(response)
    expect(obj).toHaveProperty('version')
    expect(obj.version).toBe(0)
    expect(obj).toHaveProperty('name')
    expect(obj.name).toBe('Init')
    expect(obj).toHaveProperty('timestamp')
    expect(obj.timestamp).toMatch(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.*Z/)
    console.log('Validated GET /api/trial/0/state response from server')
    // cleanup test if client gets stuck
    const watchdog = setTimeout(() => {
        console.error('watchdog: test timeout, exiting')
        httpServer.server.close()
        process.exit(1)
    }, 4000)
    sleep(5000)
    await httpServer.stop()
    clearTimeout(watchdog)
    console.log('finished http server init test')
})
