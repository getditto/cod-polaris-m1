// Protocol / API Definitions

export const supported_versions = [0]

// ISO timestamp with timezone
export class Timestamp {
    dateStr: string

    constructor(date: Date | null = null) {
        if (date == null) {
            date = new Date()
        }
        this.dateStr = date.toISOString()
    }

    public toString(): string {
        return this.dateStr
    }

    public static fromString(s: string): Timestamp {
        const date = new Date(s)
        return new Timestamp(date)
    }
}

// GeoJSON geometry object of type point or polygon
export class Geometry {
    type: string = ''
    // lat-long decimal degrees in WGS84 coordinate system
    // TODO point: https://datatracker.ietf.org/doc/html/rfc7946#appendix-A.1
    //  or polygon object https://datatracker.ietf.org/doc/html/rfc7946#appendix-A.3
    coordinates: Array<number> = []
}

export class TrialId {
    id_tuple: [number, number, number] = [0, 0, 0]

    public static fromString(s: string): TrialId {
        // Expects string "int.int.int"
        const ints = s.split('.')
        if (ints.length != 3 || !ints.every((i) => i.match(/^\d+$/))) {
            throw new Error('Invalid TrialId string ' + s)
        }
        const tid = new TrialId()
        tid.id_tuple = [parseInt(ints[0]), parseInt(ints[1]), parseInt(ints[2])]
        return tid
    }

    toString(): string {
        return this.id_tuple.join('.')
    }
}

export class v0TrialStart {
    version: number = 0
    name: string = 'Trial Start'
    timestamp: Timestamp
    trial_id: TrialId
    num_targets: number
    coordinates: Geometry

    constructor(
        ts: Timestamp,
        trial_id: TrialId,
        num_targets: number,
        coordinates: Geometry
    ) {
        this.timestamp = ts
        this.trial_id = trial_id
        this.num_targets = num_targets
        this.coordinates = coordinates
    }

    // control serialization
    private toObject(): Record<string, string | number | Geometry> {
        return {
            version: this.version,
            name: this.name,
            timestamp: this.timestamp.toString(),
            trial_id: this.trial_id.toString(),
            num_targets: this.num_targets,
            coordinates: this.coordinates, // TODO check serialization (JSON)
        }
    }

    serialize(): string {
        return JSON.stringify(this.toObject())
    }

    public static fromString(s: string): v0TrialStart {
        const parsed = JSON.parse(s, (key, value) => {
            if (key == 'timestamp') {
                return Timestamp.fromString(value)
            } else if (key == 'trial_id') {
                return TrialId.fromString(value)
            } else {
                return value
            }
        })
        const start = new v0TrialStart(
            parsed.timestamp,
            parsed.trial_id,
            parsed.num_targets,
            parsed.coordinates
        )
        return start
    }
}

export class v0TrialEnd {
    version: number = 0
    name: string = 'Trial End'
    timestamp: Timestamp
    trial_id: TrialId
    constructor(ts: Timestamp, id: TrialId) {
        this.timestamp = ts
        this.trial_id = id
    }
    // control serialization
    private toObject(): Record<string, string | number> {
        return {
            version: this.version,
            name: this.name,
            timestamp: this.timestamp.toString(),
            trial_id: this.trial_id.toString(),
        }
    }

    serialize(): string {
        return JSON.stringify(this.toObject())
    }

    public static fromString(s: string): v0TrialEnd {
        const parsed = JSON.parse(s, (key, value) => {
            if (key == 'timestamp') {
                return Timestamp.fromString(value)
            } else if (key == 'trial_id') {
                return TrialId.fromString(value)
            } else {
                return value
            }
        })
        const end = new v0TrialEnd(parsed.timestamp, parsed.trial_id)
        return end
    }
}

export class v0TrialWait {
    version = 0
    name = 'Wait'
    timestamp = new Timestamp()

    private toObject(): Record<string, string | number> {
        return {
            version: this.version,
            name: this.name,
            timestamp: this.timestamp.toString(),
        }
    }
    serialize(): string {
        return JSON.stringify(this.toObject())
    }

    public static fromString(s: string): v0TrialWait {
        const parsed = JSON.parse(s, (key, value) => {
            if (key == 'timestamp') {
                return Timestamp.fromString(value)
            } else {
                return value
            }
        })
        const init = new v0TrialWait()
        init.version = parsed.version
        init.name = parsed.name
        init.timestamp = parsed.timestamp
        return init
    }
}
