import { ExecPromise } from './exec_promise.js'

test('ExecPromise sucess', () => {
    expect.assertions(1)
    const ep = new ExecPromise('echo hello')
    return ep.exec().then((output) => {
        expect(output).toBe('hello\n')
    })
})

test('ExecPromise failure', async () => {
    expect.assertions(1)
    let err: Error | null
    const ep = new ExecPromise('cat non-existant-filename')
    try {
        await ep.exec()
    } catch (e) {
        err = e as Error
    }
    expect(err!.message).toMatch(new RegExp('.*No such file.*'))
})
