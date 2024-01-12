import { strict as assert } from 'assert'
import { existsSync } from 'fs'
import nconf from 'nconf'
import { DEFAULT_TEST_DURATION_SEC } from './default'

export class Config {
    // Add defaults here (by type)
    // TODO test this is subset of keys
    boolDefaults: Map<string, boolean | null> = new Map([
        ['ditto:use-cloud', true],
        ['ditto:use-lan', true],
        ['ditto:use-ble', true],
        ['ditto:produce-images', true],
        ['ditto:consumer-webui', true],
    ])

    // Anything missing will be replaced with empty string
    strDefaults: Map<string, string | null> = new Map([
        ['ditto:img-height', '1080'],
        ['ditto:img-width', '1920'],
        ['ditto:test-duration-sec', DEFAULT_TEST_DURATION_SEC.toString()],
    ])

    // Add all shouty keys here
    boolKeys = [
        'USE_CLOUD',
        'USE_LAN',
        'USE_BLE',
        'PRODUCE_IMAGES',
        'CONSUMER_WEBUI',
    ]
    strKeys = [
        'APP_ID',
        'APP_TOKEN',
        'OFFLINE_TOKEN',
        'SHARED_KEY',
        'BPA_URL',
        'IMG_HEIGHT',
        'IMG_WIDTH',
        'TEST_DURATION_SEC',
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
}
