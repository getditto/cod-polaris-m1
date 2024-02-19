import { ATR, Model, BoxCoordinates, DetectedObject } from './atr.js'
import { Config } from './config.js'

test('atr start stop', async () => {
    const config = new Config('./config.json.example')
    const atr = new ATR(config)

    await atr.start()
    await atr.stop()
})

test('atr pollDetection', async () => {
    const config = new Config('./config.json.example')
    const atr = new ATR(config)
    const objectIDStub = ''
    const objectTypeStub = ''
    const confidenceStub = 0.0
    const modelIDStub = ''
    const imagePathStub = ''
    const minBoxStub = new BoxCoordinates(0, 0)
    const maxBoxStub = new BoxCoordinates(0, 0)
    const detectedObject = new DetectedObject(
        objectIDStub,
        objectTypeStub,
        confidenceStub,
        modelIDStub,
        imagePathStub,
        minBoxStub,
        maxBoxStub
    )

    atr.objectsToReport = [detectedObject]

    const result = await atr.pollDetection()
    expect(result).toEqual(detectedObject)
    const emptyResult = await atr.pollDetection()
    expect(emptyResult).toBeNull
})

test('Model detectObject', async () => {
    const model = new Model()
    const result = await model.detectObject()
    expect(result === true || result === false).toBe(true)
})

test('BoxCoordinates getBoxArray', async () => {
    const testArray = [1, 8]
    const coordinates = new BoxCoordinates(1, 8)
    const result = coordinates.getBoxArray()
    expect(result).toEqual(testArray)
})
