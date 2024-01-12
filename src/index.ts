import { Config } from './config'
import {
    init,
    Authenticator,
    Ditto,
    Identity,
    TransportConfig,
    DocumentID,
} from '@dittolive/ditto'
import { DEFAULT_COLLECTION, DEFAULT_MSG_INTERVAL } from './default'
import { Producer } from './producer'
import assert from 'assert'
import { v4 as uuidv4 } from 'uuid'
import { Consumer } from './consumer'
import { ImageConfig } from './camera'
import { signalOrTimeout } from './util'

// Random number generator for fake data
//function randomIntFromInterval(min: number, max: number) { // min and max included
//  return Math.floor(Math.random() * (max - min + 1) + min)
//}

// Sleeper
function sleep(ms: number) {
    return new Promise((resolve) => {
        setTimeout(resolve, ms)
    })
}

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

    await init()
    console.log(`Starting cod-polaris-m1 (${process.argv[2]})...`)

    const config = new Config('./config.json')

    // We're testing BLE here
    const transportConfig = new TransportConfig()
    transportConfig.peerToPeer.bluetoothLE.isEnabled = config.getBool('USE_BLE')
    transportConfig.peerToPeer.lan.isEnabled = config.getBool('USE_LAN')
    console.log(`transportConfig: (${transportConfig.peerToPeer})`)
    // }
    const authHandler = {
        authenticationRequired: async function(authenticator: Authenticator) {
            await authenticator.loginWithToken('full_access', 'dummy-provider')
            console.log(`Login requested`)
        },
        authenticationExpiringSoon: function(
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            authenticator: Authenticator,
            secondsRemaining: number
        ) {
            console.log(`Auth token expiring in ${secondsRemaining} seconds`)
        },
    }
    const bpaUrl = config.getStr('BPA_URL')
    const appId = config.getStr('APP_ID')
    console.log(`BPA_URL: ${bpaUrl}`)

    let identity: Identity
    // TODO use empty string instead of NA?
    if (bpaUrl == 'NA') {
        identity = {
            type: 'sharedKey',
            appID: appId,
            sharedKey: config.getStr('SHARED_KEY'),
        }
    } else if (bpaUrl == 'portal') {
        identity = {
            type: 'onlinePlayground',
            appID: appId,
            token: config.getStr('APP_TOKEN'),
        }
    } else if (bpaUrl == 'offline') {
        identity = {
            type: 'offlinePlayground',
            appID: config.getStr('APP_ID'),
        }
    } else {
        identity = {
            type: 'onlineWithAuthentication',
            appID: config.getStr('APP_ID'),
            enableDittoCloudSync: false,
            authHandler: authHandler,
            customAuthURL: bpaUrl,
        }
    }

    const persistDir = mode == Mode.Producer ? './ditto-p' : './ditto-c'
    const ditto = new Ditto(identity, persistDir)

    if (bpaUrl == 'NA' || bpaUrl == 'offline') {
        console.debug('--> Setting offline only license..')
        ditto.setOfflineOnlyLicenseToken(config.getStr('OFFLINE_TOKEN'))
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const transportConditionsObserver = ditto.observeTransportConditions(
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        (condition, _source) => {
            if (condition === 'BLEDisabled') {
                console.log('BLE disabled')
            } else if (condition === 'NoBLECentralPermission') {
                console.log('Permission missing for BLE')
            } else if (condition === 'NoBLEPeripheralPermission') {
                console.log('Permissions missing for BLE')
            }
        }
    )

    ditto.setTransportConfig(transportConfig)

    ditto.startSync()

    // Console out the peers found
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const presenceObserver = ditto.presence.observe((graph) => {
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
            ditto,
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
            ditto,
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
    ditto.stopSync()
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
