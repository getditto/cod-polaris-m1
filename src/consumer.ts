import {
    Attachment,
    AttachmentFetchEvent,
    Collection,
    Ditto,
    DocumentID,
    Subscription,
} from '@dittolive/ditto'
import { DEFAULT_WEBUI_PORT } from './default'
import Fastify, { FastifyInstance } from 'fastify'
import { existsSync, mkdirSync } from 'fs'
import fastifyStatic from '@fastify/static'
import { pageWithImage } from './html'
import path from 'path'
import { deserPayload } from './util'

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
    webUi: boolean
    fastify: FastifyInstance | null
    imagePath: string
    lastImage: string | null
    lastFields: Record<string, string>

    constructor(
        ditto: Ditto,
        collName: string,
        docId: DocumentID,
        webUi: boolean
    ) {
        this.ditto = ditto
        this.collName = collName
        this.docId = docId // XXX currently unused
        this.subs = null
        this.coll = null
        this.lastTs = null
        this.uniqueCount = 0
        this.imagesFetched = 0
        this.webUi = webUi
        this.fastify = null
        this.lastImage = null
        this.lastFields = {}
        this.imagePath = '/tmp/images'
        // ensure dir exists
        if (!existsSync(this.imagePath)) {
            mkdirSync(this.imagePath)
        }
    }

    async start(): Promise<void> {
        await this.startConsumer()
        return this.startWebUI()
    }

    async startConsumer(): Promise<void> {
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
                if (this.lastTs == ts) {
                    continue
                }
                console.debug(`--> observed local doc w/ ts: ${ts}`)
                this.uniqueCount += 1

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
                        const outfile = `${this.imagePath}/fetched-${this.uniqueCount}.jpg`
                        console.debug(`--> writing ${outfile}..`)
                        await attach!.copyToPath(outfile)
                        this.lastImage = outfile
                        this.lastFields = deserPayload(doc)
                    }
                }
            }
        })
    }

    async startWebUI(): Promise<void> {
        console.info(`--> Starting web UI on port ${DEFAULT_WEBUI_PORT}`)
        this.fastify = Fastify({ logger: true })

        this.fastify!.register(fastifyStatic, {
            root: this.imagePath,
            prefix: '/img/',
        })

        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        this.fastify!.get('/', async (_req, rep) => {
            let webPath: string | null = null
            if (this.lastImage != null) {
                webPath = path.join('/img', path.basename(this.lastImage))
            }
            rep.type('text/html').send(pageWithImage(webPath, this.lastFields))
        })

        const start = async () => {
            try {
                await this.fastify!.listen({
                    host: '0.0.0.0',
                    port: DEFAULT_WEBUI_PORT,
                })
            } catch (err) {
                this.fastify!.log.error(err)
                process.exit(1)
            }
        }
        start()
    }

    async stop(): Promise<ConsumerStats> {
        if (this.webUi) {
            await this.stopWebUI()
        }
        return this.stopConsumer()
    }

    async stopConsumer(): Promise<ConsumerStats> {
        this.subs!.cancel()
        return {
            uniqueRecords: this.uniqueCount,
            imagesFetched: this.imagesFetched,
        }
    }

    async stopWebUI(): Promise<void> {
        console.info('--> Stopping web UI')
    }
}
