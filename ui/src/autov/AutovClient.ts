import axios from 'axios'
import { TrialObj, TrialState } from '../common/types'
import { AutovConfig } from './Config'
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
    config: AutovConfig
    constructor(config: AutovConfig) {
        this.config = config
    }

    async getTrial(): Promise<TrialResponse> {
        const url = `${this.config.urlBase}/api/trial`
        try {
            console.info(`GET ${url}`)
            const res = await axios.get(url)
            if (res.status == 200) {
                let obj: TrialObj
                switch (res.data.name) {
                    case 'Wait':
                        obj = {
                            version: res.data.version,
                            name: res.data.name,
                            timestamp: res.data.timestamp,
                        }
                        break
                    case 'Trial Start':
                        obj = {
                            version: res.data.version,
                            name: res.data.name,
                            timestamp: res.data.timestamp,
                            trial_id: res.data.trial_id,
                            num_targets: res.data.num_targets,
                            type: res.data.type,
                            coordinates: res.data.coordinates,
                        }
                        break
                    case 'Trial End':
                        obj = {
                            version: res.data.version,
                            name: res.data.name,
                            timestamp: res.data.timestamp,
                            trial_id: res.data.trial_id,
                        }
                        break
                    default:
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
