// Simple promise wrapper that allows resolution from external events
// i.e. I want a condition variable (Condvar in rust, pthread_cond_t in posix threads).
export class CondPromise {
    private resolveCb: () => void
    private rejectCb: () => void
    private promise: Promise<void>
    constructor() {
        // the provided executor function is called immediately, but
        // typescript complains we don't initialize our resolveCb and rejectCb
        this.resolveCb = () => {}
        this.rejectCb = () => {}

        this.promise = new Promise((resolve, reject) => {
            this.resolveCb = resolve
            this.rejectCb = reject
        })
    }
    getPromise() {
        return this.promise
    }
    resolve() {
        setImmediate(() => this.resolveCb())
    }
    reject() {
        setImmediate(() => this.rejectCb())
    }
}
