import { strict as assert } from 'assert'
import { existsSync } from 'fs'
import nconf from 'nconf'

export class Config {
    // Add defaults here (by type)
    // TODO test this is subset of keys
    boolDefaults: Map<string, boolean | null> = new Map([
        ['ditto:use-cloud', true],
        ['ditto:use-lan', true],
        ['ditto:use-ble', true],
    ])

    // Anything missing will be replaced with empty string
    strDefaults: Map<string, string | null> = new Map([])

    // Add all shouty keys here
    boolKeys = ['USE_CLOUD', 'USE_LAN', 'USE_BLE']
    strKeys = ['APP_ID', 'APP_TOKEN', 'OFFLINE_TOKEN', 'SHARED_KEY', 'BPA_URL']

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
}