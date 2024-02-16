import { ATR } from './atr.js'
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
