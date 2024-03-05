import { DittoCOD } from '../ditto_cod.js'
import { Config } from '../common-cod/config.js'
import { HttpServer } from './http_server.js'

function usage() {
    console.log('Usage: node index.js [config-filename]')
    console.log('  <config-filename> defaults to ./config.json')
}

async function main() {
    let configFn = './config.json'
    if (process.argv.length > 2) {
        const a = process.argv[2]
        if (process.argv.length != 3 || a == '-h' || a == '--help') {
            usage()
            return
        } else {
            configFn = a
        }
    }
    let config
    try {
        config = new Config(configFn)
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
