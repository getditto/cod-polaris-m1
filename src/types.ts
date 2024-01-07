import { Attachment, DocumentID } from '@dittolive/ditto'

export interface Payload {
    _id: DocumentID
    title: string
    description: string
    timestamp: number
    nodeId: string
    state: string
    isRemoved: boolean
    siteId: string
    image?: Attachment
}
