import axios from 'axios'
import { TelemRecord, TrialObj, TrialState } from '../common/types'
import { UiConfig } from '../common/UiConfig'
import { axiosErrorResponse } from '../common/util'

export class TrialResponse {
    httpStatus: number
    obj: TrialObj | null
    error: string | null
    constructor(
        httpStatus: number,
        obj: TrialObj | null,
        error: string | null
    ) {
        this.httpStatus = httpStatus
        this.obj = obj
        this.error = error
    }
    getState(): TrialState | null {
        if (this.obj == null) return null
        switch (this.obj.name) {
            case 'Wait':
                return TrialState.Wait
            case 'Trial Start':
                return TrialState.Start
            case 'Trial End':
                return TrialState.End
            default:
                return null
        }
    }
}

export class AutovClient {
    config: UiConfig
    constructor(config: UiConfig) {
        this.config = config
        if (config.bearerToken != '') {
            axios.defaults.headers.common['Authorization'] =
                `Bearer ${config.bearerToken}`
        }
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    private responseToObj(data: any): TrialObj | null {
        let obj: TrialObj | null = null
        switch (data.name) {
            case 'Wait':
                obj = {
                    version: data.version,
                    name: data.name,
                    timestamp: data.timestamp,
                }
                break
            case 'Trial Start':
                obj = {
                    version: data.version,
                    name: data.name,
                    timestamp: data.timestamp,
                    trial_id: data.trial_id,
                    num_targets: data.num_targets,
                    type: data.type,
                    coordinates: data.coordinates,
                }
                break
            case 'Trial End':
                obj = {
                    version: data.version,
                    name: data.name,
                    timestamp: data.timestamp,
                    trial_id: data.trial_id,
                }
                break
            default:
                break
        }
        return obj
    }

    // Returns HTTP status (201 is success)
    async postTelem(telem: TelemRecord): Promise<number> {
        const url = `${this.config.autovUrl}/api/telemetry`
        let status = 400
        try {
            console.info(`POST ${url}`)
            const res = await axios.post(url, telem)
            status = res.status
            if (res.status != 201) {
                console.warn(
                    'POST /api/telemetry expected 201 response: ',
                    res.status
                )
            }
        } catch (err) {
            console.warn(`POST ${url} failed: ${err}`)
        }
        return status
    }

    async awaitTrial(wantStart: boolean): Promise<TrialResponse> {
        const url = `${this.config.autovUrl}/api/trial/${
            wantStart ? 'start' : 'end'
        }`
        try {
            const res = await axios.get(url)
            // XXX TODO handle timeout/retry
            if (res.status == 200) {
                const obj = this.responseToObj(res.data)
                if (obj == null) {
                    return new TrialResponse(
                        400,
                        null,
                        `unknown trial state: ${res.data.name}`
                    )
                }
                return new TrialResponse(200, obj, null)
            } else {
                return new TrialResponse(res.status, null, null)
            }
        } catch (err) {
            const [status, response] = axiosErrorResponse(err)
            console.warn(`GET ${url} failed: ${response}`)
            return new TrialResponse(status, null, response)
        }
    }

    async getTrial(): Promise<TrialResponse> {
        const url = `${this.config.autovUrl}/api/trial`
        try {
            console.info(`GET ${url}`)
            const res = await axios.get(url)
            if (res.status == 200) {
                const obj = this.responseToObj(res.data)
                if (obj == null) {
                    return new TrialResponse(
                        400,
                        null,
                        `unknown trial state: ${res.data.name}`
                    )
                }
                return new TrialResponse(200, obj, null)
            } else {
                return new TrialResponse(res.status, null, null)
            }
        } catch (err) {
            const [status, response] = axiosErrorResponse(err)
            console.warn(`GET ${url} failed: ${response}`)
            return new TrialResponse(status, null, response)
        }
    }
}
