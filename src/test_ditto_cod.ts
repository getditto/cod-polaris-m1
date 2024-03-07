// Semi-manually mock out DittoCOD class.

// Mocking out the Ditto SDK is a pain. jest / jasmine mocks are annoing and
// inflexible. This is what I came up with so far.

import {
    QueryResult,
    Ditto as OrigDitto,
    Store,
    Ditto,
    DQLQueryArguments,
} from '@dittolive/ditto'
import { DittoCOD } from './ditto_cod.js'
import { DittoConfig } from './ditto_config.js'

jest.mock('@dittolive/ditto', () => {
    const store = jest.fn().mockImplementation(() => {
        console.info('** mock store constructor **')
        return {
            execute: jest.fn().mockResolvedValue({} as QueryResult),
        }
    })
    const ditto = jest.fn().mockImplementation(() => {
        console.info('** mock ditto constructor **')
        return {
            start: jest.fn().mockResolvedValue(undefined),
            store: jest.fn().mockReturnValue(store),
            stopSync: jest.fn().mockReturnValue(undefined),
            close: jest.fn().mockReturnValue(undefined),
        }
    })
    return {
        Ditto: ditto,
        Store: store,
        DQLQueryArguments: jest.fn(),
        QueryResult: jest.fn(),
    }
})

export class TestStore extends Store {
    constructor(d: Ditto) {
        super(d)
        console.info('** Using stubbed-out Ditto.Store for unit testing **')
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    execute(
        _query: string,
        _args?: DQLQueryArguments | undefined
    ): Promise<QueryResult> {
        return Promise.resolve({} as QueryResult)
    }
}
export class TestDittoCOD extends DittoCOD {
    constructor(config: DittoConfig) {
        super(config) // required by typscript :(
        console.info('** Using stubbed-out DittoCOD for unit testing **')
    }
    async start() {
        this.ditto = new OrigDitto(this.identity, this.config.persistDir)
    }

    store(): Store {
        return new TestStore(this.ditto!)
    }

    isRunning() {
        return true
    }
}
