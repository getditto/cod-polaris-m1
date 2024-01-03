import { init, Authenticator, Collection, Ditto, Identity, Subscription, TransportConfig } from '@dittolive/ditto'
import { v4 as uuidv4 } from 'uuid';

let nconf = require("nconf")

let ditto: Ditto
let collection: Collection
let transportConfig: TransportConfig
let identity: Identity
let interval = 2000 // 1000ms or 1Hz
let counter = 0
let presenceObserver

//const startTime: number = Date.now();

nconf.argv()
  .env()
  .file({ file: 'config.json' })

process.once('SIGINT', async () => {
  try {
    await sleep(500)
  } finally {
    console.log('SIGINT received...')
    process.exit(0)
  }
});

// Random number generator for fake data
//function randomIntFromInterval(min: number, max: number) { // min and max included 
//  return Math.floor(Math.random() * (max - min + 1) + min)
//}

// Sleeper
function sleep(ms: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

const dID = uuidv4();

// This is the Ditto doc generator
function doOnInterval() {

  counter += 1

  //  const currentTime: number = startTime + (interval * speed * counter); // Current time after 1 hour (milliseconds)

  let siteID = `${ditto.siteID}`
  console.log(`SITE ID: ${siteID}`)
  // This is just enough fake data
  let payload = {
    "_id": dID,
    "title": "cod-polaris-m1",
    "description": "test marker",
    "timestamp": Date.now(),
    "nodeId": "alpha",
    "state": "published",
    "isRemoved": false,
    "siteId": siteID,
    "timeMillis": Date.now() + 0.001
  }
  collection.upsert(payload)

  console.log(`Upserting to ditto: [${counter}]`, payload)
}

const getConfig = (key: string, fallback?: any) => nconf.get(key) || fallback;
const asBoolean = (value: any) => [true, 'true', 'True', 'TRUE', '1', 1].includes(value);

async function main() {
  await init()
  console.log("Starting cod-polaris-m1...")

  const config: Record<string, any> = {
    APP_ID: getConfig('ditto:app-id', ''),
    APP_TOKEN: getConfig('ditto:app-token', ''),
    OFFLINE_TOKEN: getConfig('ditto:offline-token', ''),
    SHARED_KEY: getConfig('ditto:shared-key', ''),
    USE_CLOUD: asBoolean(getConfig('ditto:use-cloud', true)),
    USE_LAN: asBoolean(getConfig('ditto:use-lan', true)),
    USE_BLE: asBoolean(getConfig('ditto:use-ble', true)),
    BPA_URL: getConfig('ditto:bpa-url', ''),
  };

  // We're testing BLE here
  transportConfig = new TransportConfig()
  transportConfig.peerToPeer.bluetoothLE.isEnabled = config.USE_BLE
  transportConfig.peerToPeer.lan.isEnabled = config.USE_LAN

  // }
  const authHandler = {
    authenticationRequired: async function(authenticator: Authenticator) {
      await authenticator.loginWithToken("full_access", "dummy-provider")
      console.log(`Login requested`);

    },
    authenticationExpiringSoon: function(authenticator: Authenticator, secondsRemaining: number) {
      console.log(`Auth token expiring in ${secondsRemaining} seconds`)
    }
  }

  console.log(`BPA_URL: ${config.BPA_URL}`)

  if (config.BPA_URL == "NA") {
    identity = {
      type: 'sharedKey',
      appID: config.APP_ID,
      sharedKey: config.SHARED_KEY
    }
  } else if (config.BPA_URL == "portal") {
    identity = {
      type: 'onlinePlayground',
      appID: config.APP_ID,
      token: config.APP_TOKEN,
    }
  } else {
    identity = {
      type: 'onlineWithAuthentication',
      appID: config.APP_ID,
      enableDittoCloudSync: false,
      authHandler: authHandler,
      customAuthURL: config.BPA_URL,
    }
  }

  ditto = new Ditto(identity, "./ditto")

  if (config.BPA_URL == "NA") {
    ditto.setOfflineOnlyLicenseToken(config.OFFLINE_TOKEN)
  }
  const transportConditionsObserver = ditto.observeTransportConditions((condition, source) => {
    if (condition === 'BLEDisabled') {
      console.log('BLE disabled')
    } else if (condition === 'NoBLECentralPermission') {
      console.log('Permission missing for BLE')
    } else if (condition === 'NoBLEPeripheralPermission') {
      console.log('Permissions missing for BLE')
    }
  })

  ditto.setTransportConfig(transportConfig)

  ditto.startSync()

  // Console out the peers found
  presenceObserver = ditto.presence.observe((graph) => {
    if (graph.remotePeers.length != 0) {
      graph.remotePeers.forEach((peer) => {
        console.log("peer connection: ", peer.deviceName, peer.connections[0].connectionType)
      })
    }
  })

  // Basic Ditto collection and subscription
  collection = ditto.store.collection("TAK_Markers")

  // Wait five seconds at start to try and find BLE peers before writing docs
  await sleep(5000)

  // Do the thing
  setInterval(doOnInterval, interval)
}

main()
