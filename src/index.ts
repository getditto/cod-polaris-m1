import { Config } from './config'
import {
    init,
    Authenticator,
    Collection,
    Ditto,
    Identity,
    TransportConfig,
} from '@dittolive/ditto'
import { v4 as uuidv4 } from 'uuid'


const interval = 2000 // 1000ms or 1Hz
let counter = 0

//const startTime: number = Date.now();


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

const dID = uuidv4()

// This is the Ditto doc generator
function doOnInterval(ditto: Ditto, collection: Collection) {
    counter += 1

    //  const currentTime: number = startTime + (interval * speed * counter); // Current time after 1 hour (milliseconds)

    const siteID = `${ditto.siteID}`
    console.log(`SITE ID: ${siteID}`)
    // This is just enough fake data
    const payload = {
        _id: dID,
        title: 'cod-polaris-m1',
        description: 'test marker',
        timestamp: Date.now(),
        nodeId: 'alpha',
        state: 'published',
        isRemoved: false,
        siteId: siteID,
        timeMillis: Date.now() + 0.001,
    }
    collection.upsert(payload)

    console.log(`Upserting to ditto: [${counter}]`, payload)
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

    if (bpaUrl == 'NA') {
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

    // Basic Ditto collection and subscription
    const collection = ditto.store.collection('TAK_Markers')

    // Wait five seconds at start to try and find BLE peers before writing docs
    await sleep(5000)

    // Do the thing
    setInterval(() => doOnInterval(ditto, collection), interval)
}

main()
