import { ConfigBase } from '../config_base.js'
import { DEFAULT_TEST_DURATION_SEC } from '../default.js'
import { HttpConfig } from './http_base.js'

export class Config extends ConfigBase {
    constructor(configFilename: string) {
        super(configFilename)
        this.addStrKeys([
            'IMG_HEIGHT',
            'IMG_WIDTH',
            'TEST_DURATION_SEC',
            'HTTP_PORT',
            'HTTP_HOST',
        ])
        this.addStrDefaults(
            new Map([
                ['test-duration-sec', DEFAULT_TEST_DURATION_SEC.toString()],
                ['http-port', '8081'],
                ['http-host', '127.0.0.1'],
            ])
        )
    }
    toHttpConfig(): HttpConfig {
        return new HttpConfig(
            this.getStr('HTTP_HOST'),
            parseInt(this.getStr('HTTP_PORT'))
        )
    }

    isUnitTestConfig(): boolean {
        return this.getStr('APP_ID') == 'your-app-id-here'
    }

    unitTestWarning(): string {
        const bar = '==================================================='
        return bar + '\nWARNING: using default unit test configuration\n' + bar
    }
}
