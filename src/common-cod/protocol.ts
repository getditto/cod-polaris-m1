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
// Note: parts of the rest API spec uses the fields of this object directly
// (flattened) instead of including the surrounding object in its JSON.
// Points are currently 2-d only (no elevation supported)
export type PointV0 = Array<number>
export type PolygonV0 = Array<PointV0>
export type CoordValueV0 = PointV0 | PolygonV0
export type GeomTypeV0 = 'Point' | 'Polygon'
export type GeomRecordV0 = { [key: string]: GeomTypeV0 | CoordValueV0 }

export class Geometry {
    type: GeomTypeV0 = 'Point'
    // lat-long decimal degrees in WGS84 coordinate system
    coordinates: CoordValueV0 = []

    public static point(longitude: number, latitude: number) {
        const geom = new Geometry()
        geom.type = 'Point'
        geom.coordinates = [longitude, latitude]
        return geom
    }

    public static polygon(coords: PolygonV0): Geometry {
        const geom = new Geometry()
        geom.type = 'Polygon'
        geom.coordinates = coords
        return geom
    }
    // Return null if given record is valid v0 geometry, else return
    // string describing the error.
    public static validationError(g: GeomRecordV0): string | null {
        if (g.type == 'Point') {
            if (g.coordinates.length != 2 || Array.isArray(g.coordinates[0])) {
                return 'Point geometry must contain 2 numbers'
            }
        } else if (g.type == 'Polygon') {
            // Minimum polygon points are a triangle + one closing point
            // repeating the first
            if (g.coordinates.length < 4) {
                return 'Polygon must have at least 4 points'
            }
            if (!Array.isArray(g.coordinates[0])) {
                return 'Polygon coordinates must be arrays'
            }
            for (const coord of g.coordinates) {
                // type coercion
                const arr = coord as Array<number>
                if (arr.length != 2) {
                    return 'Each point must be 2 numbers'
                }
            }
            const last = g.coordinates[g.coordinates.length - 1] as PointV0
            const first = g.coordinates[0] as PointV0
            if (first[0] != last[0] || first[1] != last[1]) {
                console.info('first: ', first, ' != last: ', last)
                return 'Polygon not closed: last point must equal first'
            }
        } else {
            return `Invalid geometry type ${g.type}`
        }
        return null
    }

    public static isValidRecord(g: GeomRecordV0): boolean {
        return Geometry.validationError(g) == null
    }

    // Runtime check that this is a valid type of geometry
    public isValid(): boolean {
        return Geometry.isValidRecord(this.toObject())
    }

    toObject(): GeomRecordV0 {
        return {
            type: this.type,
            coordinates: this.coordinates,
        }
    }

    public serialize(): string {
        return JSON.stringify(this.toObject())
    }

    public static fromString(s: string): Geometry {
        const parsed = JSON.parse(s, (key, value) => {
            if (key == 'type') {
                if (value != 'Point' && value != 'Polygon') {
                    throw new Error('Invalid geometry type ' + value)
                }
                return value
            } else if (key == 'coordinates') {
                if (!Array.isArray(value)) {
                    throw new Error('Invalid coordinate array value ' + value)
                }
                return value
            }
            return value
        })
        const geom = new Geometry()
        geom.type = parsed.type
        geom.coordinates = parsed.coordinates
        return geom
    }

    public static fromFields(type: string, coords: CoordValueV0): Geometry {
        const g = new Geometry()
        g.type = type as GeomTypeV0
        g.coordinates = coords
        return g
    }
}

export class TrialId {
    id_tuple: [number, number, number] = [0, 0, 0]

    public static fromString(s: string): TrialId {
        // Expects string "int.int.int"
        const ints = s.split('.')
        if (ints.length != 3 || !ints.every((i) => i.match(/^\d+$/))) {
            throw new Error('Invalid trial_id ' + s)
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
    type: GeomTypeV0
    coordinates: CoordValueV0

    constructor(
        ts: Timestamp,
        trial_id: TrialId,
        num_targets: number,
        type: GeomTypeV0,
        coordinates: CoordValueV0
    ) {
        this.timestamp = ts
        this.trial_id = trial_id
        this.num_targets = num_targets
        this.type = type
        this.coordinates = coordinates
    }

    // control serialization
    private toObject(): Record<string, string | number | CoordValueV0> {
        return {
            version: this.version,
            name: this.name,
            timestamp: this.timestamp.toString(),
            trial_id: this.trial_id.toString(),
            num_targets: this.num_targets,
            type: this.type,
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
            parsed.type,
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

export type v0TrialObj = v0TrialStart | v0TrialEnd | v0TrialWait

export type MissionPhaseV0 = 'wait' | 'find' | 'identify' | 'close'

export class v0Telemetry {
    version = 0
    lon: number = 0
    lat: number = 0
    alt: number | undefined
    timestamp: Timestamp = new Timestamp()
    id: string = ''
    heading: number = -1
    behavior: string | undefined
    mission_phase: MissionPhaseV0 = 'wait'
    phase_loc?: GeomRecordV0
    private toObject(): Record<
        string,
        string | number | GeomRecordV0 | undefined
    > {
        return {
            lon: this.lon,
            lat: this.lat,
            alt: this.alt,
            timestamp: this.timestamp.toString(),
            id: this.id,
            heading: this.heading,
            behavior: this.behavior,
            mission_phase: this.mission_phase,
            phase_loc: this.phase_loc,
        }
    }

    public serialize(): string {
        return JSON.stringify(this.toObject())
    }

    public static fromString(s: string): v0Telemetry {
        const parsed = JSON.parse(s, (key, value) => {
            if (key == 'timestamp') {
                return Timestamp.fromString(value)
            } else {
                return value
            }
        })
        const t = new v0Telemetry()
        t.lon = parsed.lon
        t.lat = parsed.lat
        t.alt = parsed.alt
        t.timestamp = parsed.timestamp
        t.id = parsed.id
        t.heading = parsed.heading
        t.behavior = parsed.behavior
        t.mission_phase = parsed.mission_phase
        t.phase_loc = parsed.phase_loc
        return t
    }

    // Return null if object is valid, else return string describing the error.
    validationError(): string | null {
        if (this.heading < 0 || this.heading > 360) {
            return 'Invalid heading ' + this.heading
        }
        if (this.id == '') {
            return 'Empty id.'
        }
        if (this.phase_loc) {
            return Geometry.validationError(this.phase_loc)
        }
        return null
    }
}
