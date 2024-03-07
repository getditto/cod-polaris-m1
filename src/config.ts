import { ConfigBase } from './config_base.js'
import { DEFAULT_TEST_DURATION_SEC } from './default.js'

export class Config extends ConfigBase {
    constructor(configFilename: string) {
        super(configFilename)
        this.addBoolKeys(['PRODUCE_IMAGES', 'CONSUMER_WEBUI'])
        this.addBoolDefaults(
            new Map([
                ['ditto:produce-images', true],
                ['ditto:consumer-webui', true],
            ])
        )
        this.addStrKeys(['IMG_HEIGHT', 'IMG_WIDTH', 'TEST_DURATION_SEC'])
        this.addStrDefaults(
            new Map([
                ['test-duration-sec', DEFAULT_TEST_DURATION_SEC.toString()],
            ])
        )
    }
}
