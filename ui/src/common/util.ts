import axios, { AxiosError } from 'axios'

export function shortUuid(): string {
    return Math.random().toString(36).substring(2, 7)
}

export function getDayOfYear(d: Date): number {
    const startMsec = Date.UTC(d.getFullYear(), 0, 0)
    const dateMsec = Date.UTC(d.getFullYear(), d.getMonth(), d.getDate())
    const msec = dateMsec - startMsec
    return Math.floor(msec / 1000 / 60 / 60 / 24)
}

// return <year>.<dayOfYear>.<trialNum> for 8 trials a day for the next 3 days
export function genTrialIds() {
    const date = new Date()
    let year = date.getFullYear()
    const dayOfYear = getDayOfYear(date)
    const NUM_DAYS = 3
    const ATTEMPTS_PER_DAY = 8
    const trialIds = []
    for (let day = dayOfYear; day < dayOfYear + NUM_DAYS; day++) {
        if (day > 365) {
            day = 1
            year += 1
        }
        for (let attempt = 1; attempt <= ATTEMPTS_PER_DAY; attempt++) {
            trialIds.push(`${year}.${day}.${attempt}`)
        }
    }
    return trialIds
}

export function exceptionMessage(err: Record<string, string>): string {
    if (err.message != undefined) {
        return err.message
    } else {
        return 'Unknown error'
    }
}

export function axiosErrorResponse(
    e: unknown
): [status: number, response: string] {
    const err = e as Record<string, string> | AxiosError
    if (axios.isAxiosError(err) && err.response) {
        return [err.response.status, JSON.stringify(err.response.data)]
    } else {
        return [400, exceptionMessage(err as Record<string, string>)]
    }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function assert(condition: any, msg: string): asserts condition {
    if (!condition) {
        throw new Error(msg)
    }
}
