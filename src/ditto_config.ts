export class DittoConfig {
    useBle: boolean
    useLan: boolean
    bpUrl: string = ''
    appId: string
    sharedKey: string = ''
    appToken: string = ''
    offlineToken: string = ''
    persistDir: string
    cloudSync: boolean = false

    constructor(
        useBle: boolean,
        useLan: boolean,
        appId: string,
        persistDir: string = './ditto'
    ) {
        this.useBle = useBle
        this.useLan = useLan
        this.appId = appId
        this.persistDir = persistDir
    }
}
