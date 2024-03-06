import {
    Geometry,
    Timestamp,
    TrialId,
    v0TrialEnd,
    v0TrialWait,
    v0TrialStart,
} from './protocol.js'

// Test ser/deser of Timestamp
test('timestamp serde', () => {
    const ts = new Timestamp()
    const str = ts.toString() // serialize
    const ts2 = Timestamp.fromString(str) // deserialize
    expect(ts2).toEqual(ts)
})

test('v0 init serde', () => {
    const src = new v0TrialWait()
    const str = src.serialize() // serialize
    const init2 = v0TrialWait.fromString(str) // deserialize
    expect(init2).toEqual(src)
})

test('v0 start serde', () => {
    const ts = new Timestamp()
    const id = TrialId.fromString('1.2.3')
    const numTargets = 4
    const geom = new Geometry()
    const src = new v0TrialStart(ts, id, numTargets, geom)
    const str = src.serialize() // serialize
    console.debug('XXX serialized start:', str)
    const roundTrip = v0TrialStart.fromString(str) // deserialize
    expect(roundTrip).toEqual(src)
})

test('v0 end serde', () => {
    const ts = new Timestamp()
    const id = TrialId.fromString('11.22.33')
    const src = new v0TrialEnd(ts, id)
    const str = src.serialize() // serialize
    const roundTrip = v0TrialEnd.fromString(str) // deserialize
    expect(roundTrip).toEqual(src)
})
