import { Config } from './config'

test('config get', () => {
    const config = new Config('config.json.example')

    expect(config.getStr('APP_ID')).toBe('your-app-id-here')
    expect(config.getBool('USE_BLE')).toBe(true)

    // wrong type
    expect(() => config.getBool('APP_ID')).toThrow()

    // crazy key
    expect(() => config.getStr('blah blah blah')).toThrow()
})
