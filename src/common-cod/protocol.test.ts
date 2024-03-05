import { Timestamp, v0TrialInit } from './protocol.js'

// Test ser/deser of Timestamp
test('timestamp serde', () => {
    const ts = new Timestamp()
    const str = ts.toString() // serialize
    const ts2 = Timestamp.fromString(str) // deserialize
    expect(ts2).toEqual(ts)
})

test('v0 init serde', () => {
    const init = new v0TrialInit()
    const str = init.serialize() // serialize
    const init2 = v0TrialInit.fromString(str) // deserialize
    expect(init2).toEqual(init)
})
