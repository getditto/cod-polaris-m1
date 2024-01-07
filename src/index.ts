import { Config } from './config'
import {
    init,
    Authenticator,
    Ditto,
    Identity,
    TransportConfig,
} from '@dittolive/ditto'
import {
    DEFAULT_COLLECTION,
    DEFAULT_MSG_INTERVAL,
    DEFAULT_TEST_DURATION_SEC,
} from './default'
import { Producer } from './producer'

process.once('SIGINT', async () => {
    try {
        await sleep(500)
    } finally {
        console.log('SIGINT received...')
        process.exit(0)
    }
})

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

async function main() {
    await init()
    console.log('Starting cod-polaris-m1...')

    const config = new Config('./config.json')

    // We're testing BLE here
    const transportConfig = new TransportConfig()
    transportConfig.peerToPeer.bluetoothLE.isEnabled = config.getBool('USE_BLE')
    transportConfig.peerToPeer.lan.isEnabled = config.getBool('USE_LAN')

    // }
    const authHandler = {
        authenticationRequired: async function (authenticator: Authenticator) {
            await authenticator.loginWithToken('full_access', 'dummy-provider')
            console.log(`Login requested`)
        },
        authenticationExpiringSoon: function (
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

    const ditto = new Ditto(identity, './ditto')

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

    const producer = new Producer(ditto, DEFAULT_COLLECTION)

    // Begin test...
    await producer.start(DEFAULT_MSG_INTERVAL)
    await sleep(DEFAULT_TEST_DURATION_SEC * 1000)
    const stats = await producer.stop()

    console.log(`Producer wrote ${stats.records} records (upserts)`)
}

main()
    .then(() => {
        console.debug('main() done')
    })
    .catch((e) => {
        console.error(`main() error: ${e}`)
    })
