import { DittoCOD } from '../ditto_cod.js'
import { Config } from './config.js'
import { HttpServer } from './http_server.js'

function usage() {
    console.log('Usage: node index.js')
    console.log('  Arguments go in ./config.json')
}

async function main() {
    if (process.argv.length != 2) {
        usage()
        return
    }
    let config
    try {
        config = new Config('./config.json')
    } catch (e) {
        usage()
        throw e
    }

    const dittoCod = new DittoCOD(config.toDittoConfig())
    await dittoCod.start()

    const httpServer = new HttpServer(dittoCod, config)
    await httpServer.start()
}

// async main boilerplate
main()
    .then(() => {
        console.debug('Exiting.')
        process.exit()
    })
    .catch((e) => {
        console.error(`main() error: ${e}`)
        throw e
    })
