import {
    init,
    Authenticator,
    Ditto,
    Identity,
    TransportConfig,
    Store,
} from '@dittolive/ditto'
import { DittoConfig } from './ditto_config.js'

export class DittoCOD {
    config: DittoConfig
    ditto: Ditto | null
    identity: Identity
    transportConf: TransportConfig
    private running: boolean

    constructor(config: DittoConfig) {
        this.config = config
        this.ditto = null
        this.identity = this.initIdentity()
        this.transportConf = this.initTransport()
        this.running = false
    }

    private initTransport(): TransportConfig {
        const tc = new TransportConfig()
        tc.peerToPeer.bluetoothLE.isEnabled = this.config.useBle
        tc.peerToPeer.lan.isEnabled = this.config.useLan
        console.debug('transportConfig: ', tc.peerToPeer)
        return tc
    }

    private initIdentity(): Identity {
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
        const bpaUrl = this.config.bpUrl
        const appId = this.config.appId
        const cloudSync = this.config.cloudSync

        let identity: Identity
        // TODO use empty string instead of NA?
        if (bpaUrl == 'NA') {
            identity = {
                type: 'sharedKey',
                appID: appId,
                sharedKey: this.config.sharedKey || '',
            }
        } else if (bpaUrl == 'portal') {
            identity = {
                type: 'onlinePlayground',
                appID: appId,
                token: this.config.appToken,
                enableDittoCloudSync: cloudSync,
            }
        } else if (bpaUrl == 'offline') {
            identity = {
                type: 'offlinePlayground',
                appID: appId,
            }
        } else {
            identity = {
                type: 'onlineWithAuthentication',
                appID: appId,
                enableDittoCloudSync: false,
                authHandler: authHandler,
                customAuthURL: bpaUrl,
            }
        }
        return identity
    }

    public isRunning(): boolean {
        return this.running
    }

    public store(): Store {
        return this.ditto!.store
    }

    // Call before using this instance
    async start(): Promise<void> {
        await init()
        console.log(`Starting cod-polaris-m1...`)
        this.ditto = new Ditto(this.identity, this.config.persistDir)
        const bpaUrl = this.config.bpUrl
        if (bpaUrl == 'NA' || bpaUrl == 'offline') {
            console.debug('--> Setting offline only license..')
            this.ditto.setOfflineOnlyLicenseToken(this.config.offlineToken)
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
        this.running = true
    }

    // Call before exiting
    async stop(): Promise<void> {
        this.ditto!.stopSync()
        this.running = false
    }
}
