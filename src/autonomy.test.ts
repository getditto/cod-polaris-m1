import { Autonomy } from './autonomy.js'
import { Config } from './config.js'

test('autonomy main', async () => {
    const config = new Config('config.json.example')
    const autonomy = new Autonomy(config)
    await autonomy.main()
})
