import {
    Attachment,
    AttachmentFetchEvent,
    Collection,
    Ditto,
    DocumentID,
    Subscription,
} from '@dittolive/ditto'

export interface ConsumerStats {
    uniqueRecords: number
    imagesFetched: number
}

export class Consumer {
    ditto: Ditto
    collName: string
    docId: DocumentID
    subs: Subscription | null
    coll: Collection | null
    lastTs: number | null
    uniqueCount: number
    imagesFetched: number

    constructor(ditto: Ditto, collName: string, docId: DocumentID) {
        this.ditto = ditto
        this.collName = collName
        this.docId = docId // XXX currently unused
        this.subs = null
        this.coll = null
        this.lastTs = null
        this.uniqueCount = 0
        this.imagesFetched = 0
    }

    async start(): Promise<void> {
        this.coll = this.ditto.store.collection(this.collName)
        const query = this.coll.findAll()
        this.subs = query.subscribe()
        query.observeLocal(async (docs) => {
            if (docs == null || docs.length == 0) {
                return
            }
            for (const doc of docs) {
                // XXX what is best way to create a Payload object from DocumentValue?
                const ts = doc.at('timestamp').value as number
                if (this.lastTs != ts) {
                    console.debug(`--> observed local doc w/ ts: ${ts}`)
                    this.uniqueCount += 1
                }

                const tok = doc.at('image').attachmentToken
                if (tok != null) {
                    console.debug('--> fetching attachment..')
                    const cb = (event: AttachmentFetchEvent) => {
                        console.debug(`--> fetch event: ${event.type}`)
                    }
                    const attach: Attachment | null =
                        await this.coll!.fetchAttachment(tok, cb)
                    if (attach == null) {
                        console.debug('--> fetch returned null')
                    } else {
                        const outfile = `/tmp/fetched-${this.uniqueCount}.jpg`
                        console.debug(`--> writing ${outfile}..`)
                        await attach!.copyToPath(outfile)
                    }
                }
            }
        })
    }

    async stop(): Promise<ConsumerStats> {
        this.subs!.cancel()
        return {
            uniqueRecords: this.uniqueCount,
            imagesFetched: this.imagesFetched,
        }
    }
}
