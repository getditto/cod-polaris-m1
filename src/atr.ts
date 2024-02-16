import { Config } from './config.js'

export class DetectedObject {
    // blah blah
}

// TODO
// this is function calls between boxes, but do we want to use ditto
export class ATR {
    confg: Config
    objectsToReport: DetectedObject[] = []

    constructor(config: Config) {
        this.confg = config
    }

    async start(): Promise<void> {
        // Start camera loop / timer
        // begin detection loop
    }

    async stop(): Promise<void> {}

    // @private
    async detectionLoop(): Promise<void> {
        // grab image
        // run model
        // if no match, return null
        //
        // refresh timer
    }

    // MAYBE this doesn't exist, it just writes to ditto

    // "poll" implies we don't block for long
    async pollDetection(): Promise<DetectedObject | null> {
        return null
    }
}
