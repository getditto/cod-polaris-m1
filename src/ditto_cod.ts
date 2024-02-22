import {
    init,
    Authenticator,
    Ditto,
    Identity,
    TransportConfig,
} from '@dittolive/ditto'
import { Config } from './config.js'

export class DittoCOD {
    config: Config
    ditto: Ditto | null
    identity: Identity
    transportConf: TransportConfig
    persistDir: string

    constructor(config: Config, persistDir: string) {
        this.config = config
        this.ditto = null
        this.identity = this.initIdentity()
        this.transportConf = this.initTransport()
        this.persistDir = persistDir
    }

    // @private
    initTransport(): TransportConfig {
        const tc = new TransportConfig()
        tc.peerToPeer.bluetoothLE.isEnabled = this.config.getBool('USE_BLE')
        tc.peerToPeer.lan.isEnabled = this.config.getBool('USE_LAN')
        console.debug('transportConfig: ', tc.peerToPeer)
        return tc
    }

    // @private
    initIdentity(): Identity {
        const authHandler = {
            authenticationRequired: async function (
                authenticator: Authenticator
            ) {
                await authenticator.loginWithToken(
                    'full_access',
                    'dummy-provider'
                )
                console.log(`Login requested`)
            },
            authenticationExpiringSoon: function (
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                _authenticator: Authenticator,
                secondsRemaining: number
            ) {
                console.log(
                    `Auth token expiring in ${secondsRemaining} seconds`
                )
            },
        }
        const bpaUrl = this.config.getStr('BPA_URL')
        const appId = this.config.getStr('APP_ID')
        console.log(`BPA_URL: ${bpaUrl}`)

        let identity: Identity
        // TODO use empty string instead of NA?
        if (bpaUrl == 'NA') {
            identity = {
                type: 'sharedKey',
                appID: appId,
                sharedKey: this.config.getStr('SHARED_KEY'),
            }
        } else if (bpaUrl == 'portal') {
            identity = {
                type: 'onlinePlayground',
                appID: appId,
                token: this.config.getStr('APP_TOKEN'),
            }
        } else if (bpaUrl == 'offline') {
            identity = {
                type: 'offlinePlayground',
                appID: this.config.getStr('APP_ID'),
            }
        } else {
            identity = {
                type: 'onlineWithAuthentication',
                appID: this.config.getStr('APP_ID'),
                enableDittoCloudSync: false,
                authHandler: authHandler,
                customAuthURL: bpaUrl,
            }
        }
        return identity
    }

    // Call before using this instance
    async start(): Promise<void> {
        await init()
        console.log(`Starting cod-polaris-m1...`)
        this.ditto = new Ditto(this.identity, this.persistDir)
        const bpaUrl = this.config.getStr('BPA_URL')
        if (bpaUrl == 'NA' || bpaUrl == 'offline') {
            console.debug('--> Setting offline only license..')
            this.ditto.setOfflineOnlyLicenseToken(
                this.config.getStr('OFFLINE_TOKEN')
            )
        }
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const _transportConditionsObserver =
            this.ditto!.observeTransportConditions(
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

        this.ditto.setTransportConfig(this.transportConf)
        this.ditto.startSync()
    }

    // Call before exiting
    async stop(): Promise<void> {
        this.ditto!.stopSync()
    }
}
