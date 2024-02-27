import { Attachment, Document, DocumentID } from '@dittolive/ditto'
import {
    DEFAULT_DESCRIPTION,
    DEFAULT_NODE_ID,
    DEFAULT_STATE,
    DEFAULT_TITLE,
} from '../default.js'

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

// TODO probably not needed
export function deserPayload(doc: Document): Record<string, string> {
    const payload: Payload = defaultPayload
    const fields: Record<string, string> = {}
    Object.keys(payload).map((key) => {
        const val = doc.at(key)
        if (val != undefined && val != null) {
            fields[key] = val.value.toString()
        }
    })
    return fields
}
