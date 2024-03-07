import { strict as assert } from 'assert'
import { existsSync } from 'fs'
import nconf from 'nconf'
import { DittoConfig } from './ditto_config.js'

export class ConfigBase {
    // Dfaults, by type...
    boolDefaults: Map<string, boolean | null> = new Map([
        ['ditto:use-cloud', false],
        ['ditto:use-lan', false],
        ['ditto:use-ble', false],
    ])

    // Anything missing will be replaced with empty string
    strDefaults: Map<string, string | null> = new Map([
        ['ditto:persist-dir', './ditto'],
    ])

    // Add all SHOUTY_KEYS here, by type
    boolKeys = ['USE_CLOUD', 'USE_LAN', 'USE_BLE']
    strKeys = [
        'APP_ID',
        'APP_TOKEN',
        'OFFLINE_TOKEN',
        'SHARED_KEY',
        'BPA_URL',
        'PERSIST_DIR',
    ]

    // Helper methods for subclass customization
    addBoolDefaults(defaults: Map<string, boolean | null>) {
        this.boolDefaults = new Map([...this.boolDefaults, ...defaults])
    }

    addStrDefaults(defaults: Map<string, string | null>) {
        this.strDefaults = new Map([...this.strDefaults, ...defaults])
    }

    addBoolKeys(keys: string[]) {
        this.boolKeys = this.boolKeys.concat(keys)
    }
    addStrKeys(keys: string[]) {
        this.strKeys = this.strKeys.concat(keys)
    }

    toConfKey(appKey: string): string {
        return 'ditto:' + appKey.toLowerCase().replace(/_/g, '-')
    }

    asBoolean(value: boolean | string | number): boolean {
        return [true, 'true', 'True', 'TRUE', '1', 1].includes(value)
    }

    constructor(configFilename: string) {
        assert(existsSync(configFilename))
        nconf.argv().env().file({ file: configFilename })
    }

    getStr(key: string): string {
        assert(this.strKeys.includes(key))
        const confKey = this.toConfKey(key)
        return nconf.get(confKey) || this.strDefaults.get(confKey) || ''
    }

    getBool(key: string): boolean {
        assert(this.boolKeys.includes(key))
        const confKey = this.toConfKey(key)
        return nconf.get(confKey) || this.boolDefaults.get(confKey) || false
    }

    toDittoConfig(): DittoConfig {
        const dittoConf = new DittoConfig(
            this.getBool('USE_BLE'),
            this.getBool('USE_LAN'),
            this.getStr('APP_ID'),
            this.getStr('PERSIST_DIR')
        )
        dittoConf.bpUrl = this.getStr('BPA_URL')
        dittoConf.sharedKey = this.getStr('SHARED_KEY')
        dittoConf.appToken = this.getStr('APP_TOKEN')
        dittoConf.offlineToken = this.getStr('OFFLINE_TOKEN')
        dittoConf.cloudSync = this.getBool('USE_CLOUD')
        return dittoConf
    }
}
