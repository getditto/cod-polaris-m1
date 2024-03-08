import {
    init,
    Authenticator,
    Ditto,
    Identity,
    TransportConfig,
    Store,
    Observer,
} from '@dittolive/ditto'
import { DittoConfig } from './ditto_config.js'

export class DittoCOD {
    config: DittoConfig
    ditto: Ditto | null
    identity: Identity
    transportConf: TransportConfig
    private running: boolean
    private transportObserver: Observer | null = null
    private presence: Observer | null = null

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
        console.debug('identity: ', identity)
        return identity
    }

    private startTransportLogging() {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        this.transportObserver = this.ditto!.observeTransportConditions(
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
        this.presence = this.ditto!.presence.observe((graph) => {
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
    }

    private stopTransportLogging() {
        if (this.transportObserver != null) {
            this.transportObserver.stop()
            this.presence!.stop()
            this.transportObserver = null
            this.presence = null
        }
    }

    public isRunning(): boolean {
        return this.running
    }

    public store(): Store {
        return this.ditto!.store
    }

    // Call before using this instance
    async start(logConnectivity: boolean = false): Promise<void> {
        await init()
        console.log(`Starting cod-polaris-m1...`)
        this.ditto = new Ditto(this.identity, this.config.persistDir)
        await this.ditto.disableSyncWithV3()
        const bpaUrl = this.config.bpUrl
        if (bpaUrl == 'NA' || bpaUrl == 'offline') {
            console.debug('--> Setting offline only license..')
            this.ditto.setOfflineOnlyLicenseToken(this.config.offlineToken)
        }
        if (logConnectivity) {
            this.startTransportLogging()
        }

        this.ditto.setTransportConfig(this.transportConf)
        this.ditto.startSync()
        this.running = true
    }

    // Call before exiting
    async stop(): Promise<void> {
        this.stopTransportLogging()
        this.ditto!.stopSync()
        this.running = false
        await this.ditto!.close()
    }
}
