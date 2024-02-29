import { CondPromise } from './cond_promise.js'

test('cond promise', async () => {
    const events: number[] = []
    const condPromise = new CondPromise()
    const promise = condPromise.getPromise()
    setTimeout(() => {
        events.push(1)
        condPromise.resolve()
    }, 1000)
    console.log('waiting')
    await promise
    console.log('resolved')
    expect(events).toEqual([1])
})
