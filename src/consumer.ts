import { Ditto, DocumentID, Subscription } from '@dittolive/ditto'

export interface ConsumerStats {
    uniqueRecords: number
}

export class Consumer {
    ditto: Ditto
    collName: string
    docId: DocumentID
    subs: Subscription | null
    lastTs: number | null
    uniqueCount: number

    constructor(ditto: Ditto, collName: string, docId: DocumentID) {
        this.ditto = ditto
        this.collName = collName
        this.docId = docId // XXX currently unused
        this.subs = null
        this.lastTs = null
        this.uniqueCount = 0
    }

    async start(): Promise<void> {
        const collection = this.ditto.store.collection(this.collName)
        const query = collection.findAll()
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
            }
        })
    }

    async stop(): Promise<ConsumerStats> {
        this.subs!.cancel()
        return { uniqueRecords: this.uniqueCount }
    }
}
