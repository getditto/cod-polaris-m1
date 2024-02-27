import { Config } from '../config.js'
import { DocumentID } from '@dittolive/ditto'
import { DEFAULT_COLLECTION, DEFAULT_MSG_INTERVAL } from '../default.js'
import { Producer } from './producer.js'
import assert from 'assert'
import { v4 as uuidv4 } from 'uuid'
import { Consumer } from './consumer.js'
import { ImageConfig } from '../camera.js'
import { signalOrTimeout, sleep } from '../util/util.js'
import { DittoCOD } from '../ditto_cod.js'

function usage() {
    console.log('Usage: node index.js [produce | consume]')
}

enum Mode {
    Producer,
    Consumer,
}

async function main() {
    let mode: Mode | null = null
    if (process.argv.length == 3) {
        if (process.argv[2] == 'produce') {
            mode = Mode.Producer
        } else if (process.argv[2] == 'consume') {
            mode = Mode.Consumer
        }
    }
    if (mode == null) {
        usage()
        return
    }

    const config = new Config('./config.json')
    const persistDir = mode == Mode.Producer ? './ditto-p' : './ditto-c'

    const dittoCod = new DittoCOD(config, persistDir)
    await dittoCod.start()

    // Console out the peers found
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const _presenceObserver = dittoCod.ditto!.presence.observe((graph) => {
        if (graph.remotePeers.length != 0) {
            graph.remotePeers.forEach((peer) => {
                console.log(
                    'peer connection: ',
                    peer.deviceName,
                    peer.connections[0].connectionType
                )
            })
        }
    })

    // Wait five seconds at start to try and find BLE peers before writing docs
    await sleep(5000)

    const docId = new DocumentID(uuidv4())

    // Begin test...
    let seconds = parseInt(config.getStr('TEST_DURATION_SEC'))
    if (seconds > 0) {
        console.info(`--> Running test for ${seconds} seconds..`)
    } else {
        console.info('--> Running test indefinitely..')
    }

    let signal: boolean = false
    if (mode == Mode.Producer) {
        const wantImg = config.getBool('PRODUCE_IMAGES')
        let imgConfig: ImageConfig | null = null
        if (wantImg) {
            const w = parseInt(config.getStr('IMG_WIDTH'))
            const h = parseInt(config.getStr('IMG_HEIGHT'))
            imgConfig = new ImageConfig(w, h)
        }
        const producer = new Producer(
            dittoCod.ditto!,
            DEFAULT_COLLECTION,
            docId,
            wantImg,
            imgConfig
        )
        await producer.start(DEFAULT_MSG_INTERVAL)
        signal = await signalOrTimeout(1000 * seconds)
        const stats = await producer.stop()
        console.log(`Producer wrote ${stats.records} records (upserts)`)
    } else {
        assert(mode == Mode.Consumer)
        const consumer = new Consumer(
            dittoCod.ditto!,
            DEFAULT_COLLECTION,
            docId,
            config.getBool('CONSUMER_WEBUI')
        )
        await consumer.start()
        // since we don't coordinate start time, add 5 extra secs for consumer
        if (seconds > 0) {
            seconds += 5
        }
        signal = await signalOrTimeout(1000 * seconds)
        const stats = await consumer.stop()
        console.log(`Consumer read ${stats.uniqueRecords} unique records`)
    }
    if (signal) {
        console.info('Exiting due to signal..')
    }
    dittoCod.stop()
}

main()
    .then(() => {
        console.debug('main() done')
        // XXX not sure why we don't shut down automatically
        process.exit()
    })
    .catch((e) => {
        console.error(`main() error: ${e}`)
        throw e
    })
