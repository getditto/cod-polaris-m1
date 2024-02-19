import { Config } from './config.js'
// import { Camera, ImageConfig } from './camera.js'

export class BoxCoordinates {
    x: number
    y: number

    constructor(x: number, y: number) {
        this.x = x
        this.y = y
    }

    getBoxArray(): Array<number> {
        return [this.x, this.y]
    }
}

export class DetectedObject {
    // blah blah
    objectID: string
    objectType: string
    confidence: number
    modelID: string
    imagePath: string
    minBox: BoxCoordinates
    maxBox: BoxCoordinates

    constructor(
        objectID: string,
        objectType: string,
        confidence: number,
        modelID: string,
        imagePath: string,
        minBox: BoxCoordinates,
        maxBox: BoxCoordinates
    ) {
        this.objectID = objectID
        this.objectType = objectType
        this.confidence = confidence
        this.modelID = modelID
        this.imagePath = imagePath
        this.minBox = minBox
        this.maxBox = maxBox
    }
}

export class Model {
    // Model Loaded by TF might not need a class unless we want to add
    // any other attributes

    // Model also might not be "loaded" the model class might just be
    // the appropriate commands to run in order to get a detection.
    async detectObject(imagePath: string = '/tmp'): Promise<boolean> {
        // Temp lint pass
        // Randomly return a hit
        const randomNumber = Math.random()
        if (randomNumber < 0.2) {
            return true
        } else {
            return false
        }
        console.log(imagePath)
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
        // randomly generate an image path
        const cameraStub = ''
        const hit = await this.model.detectObject(cameraStub)
        if (hit) {
            // create a detectedObject
            const objectIDStub = ''
            const objectTypeStub = ''
            const confidenceStub = 0.0
            const modelIDStub = ''
            const imagePathStub = cameraStub
            const minBoxStub = new BoxCoordinates(0, 0)
            const maxBoxStub = new BoxCoordinates(0, 0)
            const objectDetect = new DetectedObject(
                objectIDStub,
                objectTypeStub,
                confidenceStub,
                modelIDStub,
                imagePathStub,
                minBoxStub,
                maxBoxStub
            )
            this.objectsToReport = [...this.objectsToReport, objectDetect]
            // store in array
        }
    }

    // MAYBE this doesn't exist, it just writes to ditto

    // "poll" implies we don't block for long
    async pollDetection(): Promise<DetectedObject | null> {
        const earliestDetectedObject: DetectedObject | undefined =
            this.objectsToReport.shift()
        return earliestDetectedObject ?? null
    }
}
