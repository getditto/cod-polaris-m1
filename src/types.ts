import { Attachment, DocumentID } from '@dittolive/ditto'
import {
    DEFAULT_DESCRIPTION,
    DEFAULT_NODE_ID,
    DEFAULT_STATE,
    DEFAULT_TITLE,
} from './default.js'

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

export const defaultPayload: Payload = {
    _id: new DocumentID('none'),
    title: DEFAULT_TITLE,
    description: DEFAULT_DESCRIPTION,
    timestamp: Date.now(),
    nodeId: DEFAULT_NODE_ID,
    state: DEFAULT_STATE,
    isRemoved: false,
    siteId: '',
}
