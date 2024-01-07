// Stringify that handles BigInts
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function stringify(obj: any): string {
    return JSON.stringify(obj, (_k, v) => {
        typeof v === 'bigint' ? v.toString() : v
    })
}
