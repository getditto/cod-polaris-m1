// Protocol / API Definitions

export const supported_versions = [0]

// ISO timestamp with timezone
export class Timestamp {
    dateStr: string

    constructor(date: Date | null = null) {
        if (date == null) {
            date = new Date()
        }
        this.dateStr = new Date().toISOString()
    }

    public toString(): string {
        return this.dateStr
    }
}

// GeoJSON geometry object
export class Geometry {
    type: string = ''
    // lat-long decimal degrees in WGS84 coordinate system
    coordinates: Array<number> = []
}

export class TrialId {
    id_tuple: [number, number, number] = [0, 0, 0]

    fromString(s: string): TrialId {
        // Expects string "int.int.int"
        const ints = s.split('.')
        if (ints.length != 3 || !ints.every((i) => i.match(/^\d+$/))) {
            throw new Error('Invalid TrialId string ' + s)
        }
        this.id_tuple = [
            parseInt(ints[0]),
            parseInt(ints[1]),
            parseInt(ints[2]),
        ]
        return this
    }

    toString(): string {
        return this.id_tuple.join('.')
    }
}

export class v0TrialStart {
    version: number = 0
    name: string = 'Trial Start'
    timestamp: Timestamp
    id: TrialId
    num_targets: number
    geometry: Geometry

    constructor(
        ts: Timestamp,
        id: TrialId,
        num_targets: number,
        geometry: Geometry
    ) {
        this.timestamp = ts
        this.id = id
        this.num_targets = num_targets
        this.geometry = geometry
    }

    // control serialization
    private toObject(): Record<string, string | number | Geometry> {
        return {
            name: this.name,
            timestamp: this.timestamp.toString(),
            id: this.id.toString(),
            num_targets: this.num_targets,
            geometry: this.geometry, // TODO check serialization (JSON)
        }
    }

    serialize(): string {
        return JSON.stringify(this.toObject())
    }
}

export class v0TrialEnd {
    version: number = 0
    name: string = 'Trial End'
    timestamp: Timestamp
    id: TrialId
    constructor(ts: Timestamp, id: TrialId) {
        this.timestamp = ts
        this.id = id
    }
    // control serialization
    private toObject(): Record<string, string> {
        return {
            name: this.name,
            timestamp: this.timestamp.toString(),
            id: this.id.toString(),
        }
    }

    serialize(): string {
        return JSON.stringify(this.toObject())
    }
}

export class v0TrialInit {
    version = 0
    name = 'Init'
    timestamp = new Timestamp()
    serialize(): string {
        return JSON.stringify(this)
    }
}
