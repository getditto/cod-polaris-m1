import { Attachment, Collection, Ditto, DocumentID } from '@dittolive/ditto'
import {
    DEFAULT_DESCRIPTION,
    DEFAULT_NODE_ID,
    DEFAULT_STATE,
    DEFAULT_TITLE,
} from './default.js'
import { Payload } from './types.js'
import { Camera, ImageConfig } from './camera.js'
import { rmSync } from 'fs'

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
    camera: Camera | null
    images: string[]

    constructor(
        ditto: Ditto,
        collName: string,
        docId: DocumentID,
        wantImages: boolean,
        imgConfig: ImageConfig | null
    ) {
        this.ditto = ditto
        this.collName = collName
        this.counter = 0
        this.docId = docId
        this.collection = null
        this.finished = false
        this.interval = null
        if (wantImages) {
            const iconfig = imgConfig || new ImageConfig()
            this.camera = new Camera(iconfig)
        } else {
            this.camera = null
        }
        this.images = []
    }

    async makePayload(): Promise<Payload> {
        let attach: Attachment | null = null
        if (this.camera != null) {
            const image = await this.camera.capture(
                false /* don't overwrite prev. */
            )
            attach = await this.collection!.newAttachment(image)
            this.images.push(image)
        }

        const p: Payload = {
            _id: this.docId,
            title: DEFAULT_TITLE,
            description: DEFAULT_DESCRIPTION,
            timestamp: Date.now(),
            nodeId: DEFAULT_NODE_ID,
            state: DEFAULT_STATE,
            isRemoved: false,
            siteId: this.ditto.siteID.toString(),
        }
        if (attach != null) {
            p.image = attach
        }
        return p
    }

    async start(msgInterval: number = 1000): Promise<void> {
        this.collection = this.ditto.store.collection(this.collName)
        // XXX TODO image capture fails if two overlap
        // don't schedule next timer until current image capture has finished
        setInterval(async () => {
            if (this.finished) {
                return
            }
            const payload = await this.makePayload()
            await this.collection!.upsert(payload)
            this.counter += 1
            console.debug(`--> upsert #${this.counter}`)
        }, msgInterval)
    }

    async cleanupImages(): Promise<void> {
        console.debug(`--> Cleaning up ${this.images.length} images..`)
        for (const img of this.images) {
            console.debug(`  rm ${img}`)
            rmSync(img)
        }
    }

    async stop(): Promise<ProducerStats> {
        if (!this.finished) {
            this.finished = true
            clearInterval(this.interval!)
            await this.cleanupImages()
        }
        return { records: this.counter }
    }
}
