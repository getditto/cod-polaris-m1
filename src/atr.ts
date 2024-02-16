import { Config } from './config.js'
import { Camera, ImageConfig } from './camera.js'

export class DetectedObject {
    // blah blah
}

export class Model {
    // Model Loaded by TF might not need a class unless we want to add
    // any other attributes

    // Model also might not be "loaded" the model class might just be
    // the appropriate commands to run in order to get a detection.
    async detectObject(imagePath: string = '/tmp'): Promise<boolean | null> {
        // Temp lint pass
        console.log(imagePath)
        return null
    }
}

// TODO
// this is function calls between boxes, but do we want to use ditto
export class ATR {
    config: Config
    objectsToReport: DetectedObject[] = []
    model: Model
    // imageConfig: ImageConfig
    // camera: Camera
    timerId: NodeJS.Timeout | null

    constructor(config: Config) {
        this.config = config
        this.model = new Model()
        // MARK: How will we handle this?
        // this.imageConfig = new ImageConfig()
        // this.camera = new Camera(this.imageConfig)
        this.timerId = null
    }

    async start(): Promise<void> {
        // This will run the detection loop every 2 seconds
        this.timerId = setInterval(() => {
            this.detectionLoop()
        }, 2000)
    }

    async stop(): Promise<void> {
        if (!this.timerId) {
            console.log('Timer not runnning')
        } else {
            clearInterval(this.timerId)
        }
    }

    // @private
    private async detectionLoop(): Promise<void> {
        // grab image
        // this.camera.capture()
        // run model
        const hit = await this.model.detectObject()
        if (hit) {
            // create a detectedObject
            // store in array
        }
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
