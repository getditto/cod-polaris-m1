import { execSync } from 'child_process'
import { ExecPromise } from './exec_promise'
import assert from 'assert'

// Typescript wrapper for Raspberry Pi camera image acquistion via
// rpicam-apps.

export class ImageConfig {
    width: number
    height: number
    constructor(width: number = 1920, height: number = 1080) {
        assert(width > 0 && height > 0)
        this.width = width
        this.height = height
    }
}

export class Camera {
    rpiCmd = 'rpicam-jpeg'
    appUID: string
    saveDir: string
    imgConfig: ImageConfig

    constructor(config: ImageConfig, saveDir: string = '/tmp') {
        this.appUID = this.shortUUID()
        this.saveDir = saveDir
        this.imgConfig = config

        // Fail-fast if rpicam-jpeg command is not in path
        try {
            execSync(`which ${this.rpiCmd}`)
        } catch (err) {
            console.log(`ERROR: ${this.rpiCmd} not found in path`)
            throw err
        }
    }

    // like UUID but shorter
    shortUUID(): string {
        const datePart = Date.now().toString(36).substring(3)
        const randPart = Math.random().toString(36).substring(2, 5)
        return `${datePart}-${randPart}`
    }

    // Capture a JPEG image from camera and return full path to file.
    async capture(overwrite: boolean = true): Promise<string> {
        let filename: string
        if (overwrite) {
            filename = `${this.saveDir}/${this.appUID}.jpg`
            const ep = new ExecPromise(`rm -f ${filename}`)
            await ep.exec()
        } else {
            filename = `${this.saveDir}/${this.shortUUID()}.jpg`
        }
        const [w, h] = [this.imgConfig.width, this.imgConfig.height]
        const cmd = `${this.rpiCmd} --hdr=off --width=${w} --height=${h} -t 1000 -o ${filename}`
        console.debug(`--> Executing: ${cmd}`)
        const ep = new ExecPromise(cmd)
        await ep.exec()
        return filename
    }
}
