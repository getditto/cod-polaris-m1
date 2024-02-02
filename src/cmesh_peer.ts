import { exit } from 'node:process'
import { PeerArgs, parseCLIArgs } from 'cmesh_peer/peerargs.js'
import { CmeshEvent, CmeshPeer } from 'cmesh_peer/cmpeer.js'
import { Config } from './config.js'

async function beginTest() {
    console.info('--> Begin test')
}

async function endTest() {
    console.info('--> End test')
}

async function shutdown() {
    console.info('--> Shutdown')
}

// main function
async function main() {
    const pargs: PeerArgs = parseCLIArgs()

    const config = new Config('./config.json')
    // CmeshPeer currently only supports OfflinePlayground auth.
    pargs.ditto_license = config.getStr('OFFLINE_TOKEN')
    pargs.ditto_app_id = config.getStr('APP_ID')
    const cmp = new CmeshPeer(pargs)
    await cmp.start(async (event: CmeshEvent) => {
        switch (event) {
            case CmeshEvent.BeginTest:
                await beginTest()
                break
            case CmeshEvent.EndTest:
                await endTest()
                break
            case CmeshEvent.Exiting:
                await shutdown()
                break
            default:
                // fail assertion in this case
                fail('Unexpected event')
        }
    })

    cmp.printReport()
}

main()
    .then(() => {
        console.debug('Done')
        exit(0)
    })
    .catch((e) => {
        console.error(e)
    })
