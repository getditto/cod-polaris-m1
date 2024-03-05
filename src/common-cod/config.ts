// TODO copy-pasta: factor out common w/ ../config.ts
import { strict as assert } from 'assert'
import { existsSync } from 'fs'
import nconf from 'nconf'
import { DittoConfig } from '../ditto_cod.js'
import { HttpConfig } from '../common-cod/http_base.js'

const DEFAULT_TEST_DURATION_SEC = 60

export class Config {
    // Add defaults here (by type)
    // TODO test this is subset of keys
    boolDefaults: Map<string, boolean | null> = new Map([
        ['ditto:use-cloud', false],
        ['ditto:use-lan', false],
        ['ditto:use-ble', false],
    ])

    // Anything missing will be replaced with empty string
    strDefaults: Map<string, string | null> = new Map([
        ['ditto:persist-dir', './ditto'],
        ['test-duration-sec', DEFAULT_TEST_DURATION_SEC.toString()],
        ['http-port', '8081'],
        ['http-host', '127.0.0.1'],
    ])

    // Add all shouty keys here
    boolKeys = ['USE_CLOUD', 'USE_LAN', 'USE_BLE']
    strKeys = [
        'APP_ID',
        'APP_TOKEN',
        'OFFLINE_TOKEN',
        'SHARED_KEY',
        'BPA_URL',
        'IMG_HEIGHT',
        'IMG_WIDTH',
        'TEST_DURATION_SEC',
        'HTTP_PORT',
        'HTTP_HOST',
    ]

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
            this.getStr('APP_ID')
        )
        dittoConf.bpUrl = this.getStr('BPA_URL')
        dittoConf.sharedKey = this.getStr('SHARED_KEY')
        dittoConf.offlineToken = this.getStr('OFFLINE_TOKEN')
        return dittoConf
    }

    toHttpConfig(): HttpConfig {
        return new HttpConfig(
            this.getStr('HTTP_HOST'),
            parseInt(this.getStr('HTTP_PORT'))
        )
    }
}
