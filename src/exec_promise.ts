import { exec } from "child_process"

// Promise wrapper around callback-based exec().
// Avoid blocking the event loop.
export class ExecPromise {
    cmd: string
    constructor(cmd: string) {
        this.cmd = cmd
    }
    exec(): Promise<string> {
        return new Promise((resolve, reject) => {
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            exec(this.cmd, (err, stdout, _stderr) => {
                if (err) {
                    reject(err)
                }
                resolve(stdout)
            })
        })
    }
}
