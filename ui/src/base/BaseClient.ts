import axios from 'axios'
import { TrialState, makeTrialEnd, makeTrialStart } from '../common/types'
import { axiosErrorResponse } from '../common/util'
import { BaseConfig } from './BaseConfig'

export class StartEndResponse {
    httpStatus: number
    state: TrialState
    response: string | null
    timestamp: string

    constructor(
        httpStatus: number,
        state: TrialState,
        response: string | null
    ) {
        this.httpStatus = httpStatus
        this.state = state
        this.timestamp = new Date().toISOString()
        this.response = response
    }

    getState(): TrialState {
        return this.state
    }
}

export class BaseClient {
    config: BaseConfig
    constructor(config: BaseConfig) {
        this.config = config
        axios.defaults.headers.common['Content-Type'] =
            'application/json; charset=utf-8'
    }

    async startTrial(id: string): Promise<StartEndResponse> {
        const url = `${this.config.urlBase}/api/trial_start`
        const msg = makeTrialStart(id)
        try {
            console.info(`POST ${url}`)
            const res = await axios.post(url, msg)
            if (res.status == 201) {
                return new StartEndResponse(201, TrialState.Start, null)
            } else {
                const responseBody = JSON.stringify(res.data)
                return new StartEndResponse(
                    res.status,
                    TrialState.Wait,
                    responseBody
                )
            }
        } catch (err) {
            const [status, response] = axiosErrorResponse(err)
            console.warn(`POST ${url} failed: ${response}`)
            return new StartEndResponse(status, TrialState.Wait, response)
        }
    }

    async endTrial(id: string): Promise<StartEndResponse> {
        const url = `${this.config.urlBase}/api/trial_end`
        const msg = makeTrialEnd(id)
        try {
            console.info(`POST ${url}`)
            const res = await axios.post(url, msg)
            if (res.status == 201 || res.status == 200) {
                return new StartEndResponse(res.status, TrialState.End, null)
            } else {
                const responseBody = JSON.stringify(res.data)
                return new StartEndResponse(
                    res.status,
                    TrialState.Wait,
                    responseBody
                )
            }
        } catch (err) {
            const [status, response] = axiosErrorResponse(err)
            console.warn(`POST ${url} failed: ${response}`)
            return new StartEndResponse(status, TrialState.Wait, response)
        }
    }
}
