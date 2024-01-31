// Stringify that handles BigInts
import { Payload, defaultPayload } from './types.js'
import { Document } from '@dittolive/ditto'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function stringify(obj: any): string {
    return JSON.stringify(obj, (_k, v) => {
        typeof v === 'bigint' ? v.toString() : v
    })
}

// Return promise that resolves after specified time or if SIGINT is received.
// Value resolves to true if signal received, else false.
// Pass 0 to wait forever.
export async function signalOrTimeout(msec: number): Promise<boolean> {
    return new Promise((resolve) => {
        let timer: NodeJS.Timeout | null = null
        if (msec > 0) {
            timer = setTimeout(() => {
                resolve(false)
            }, msec)
        }
        process.on('SIGINT', () => {
            if (timer) {
                clearTimeout(timer)
            }
            resolve(true)
        })
    })
}

export function deserPayload(doc: Document): Record<string, string> {
    const payload: Payload = defaultPayload
    const fields: Record<string, string> = {}
    Object.keys(payload).map((key) => {
        const val = doc.at(key)
        if (val != undefined && val != null) {
            fields[key] = val.value.toString()
        }
    })
    return fields
}
