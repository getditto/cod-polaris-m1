import { ATR, Model } from './atr.js'
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

    const result = atr.pollDetection()
    expect(result).toBeNull
})

test('Model detectObject', async () => {
    const model = new Model()
    const result = model.detectObject()
    expect(result).toBeNull
})
