import configData from '../../uiconfig.json'

export class UiConfig {
    baseUrl: string = ''
    baseName: string = ''
    autovUrl: string = ''
    avName: string = ''
    bearerToken: string = ''
    constructor() {
        this.baseUrl = configData.baseUrl
        this.baseName = configData.baseName
        this.autovUrl = configData.autovUrl
        this.avName = configData.avName
        this.bearerToken = configData.bearerToken

        // assert all fields are set
        for (const key in this) {
            const val = this[key]
            if (val === undefined || val === '') {
                throw new Error(`UiConfig: ${key} is undefined`)
            }
        }
    }
}
