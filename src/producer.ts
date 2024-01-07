import { Collection, Ditto, DocumentID } from '@dittolive/ditto'
import { v4 as uuidv4 } from 'uuid'
import {
    DEFAULT_DESCRIPTION,
    DEFAULT_NODE_ID,
    DEFAULT_STATE,
    DEFAULT_TITLE,
} from './default'
import { Payload } from './types'

export interface ProducerStats {
    records: number
}

export class Producer {
    ditto: Ditto
    collName: string
    counter: number
    docId: DocumentID
    collection: Collection | null
    finished: boolean
    interval: NodeJS.Timeout | null

    constructor(ditto: Ditto, collName: string) {
        this.ditto = ditto
        this.collName = collName
        this.counter = 0
        this.docId = new DocumentID(uuidv4())
        this.collection = null
        this.finished = false
        this.interval = null
    }

    makePayload(): Payload {
        return {
            _id: this.docId,
            title: DEFAULT_TITLE,
            description: DEFAULT_DESCRIPTION,
            timestamp: Date.now(),
            nodeId: DEFAULT_NODE_ID,
            state: DEFAULT_STATE,
            isRemoved: false,
            siteId: this.ditto.siteID.toString(),
        }
    }

    async start(msgInterval: number = 1000): Promise<void> {
        const collection = this.ditto.store.collection(this.collName)
        setInterval(async () => {
            if (this.finished) {
                return
            }
            const payload = this.makePayload()
            await collection.upsert(payload)
            this.counter += 1
            console.debug(`--> upsert #${this.counter}`)
        }, msgInterval)
    }

    async stop(): Promise<ProducerStats> {
        if (!this.finished) {
            this.finished = true
            clearInterval(this.interval!)
        }
        return { records: this.counter }
    }
}
