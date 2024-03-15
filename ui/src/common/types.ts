// TODO refactor projects with common dependency
// for now, copy-pasta

import { DEFAULT_COORD, DEFAULT_COORD_TYPE } from './Default'

export type PointV0 = Array<number>
export type PolygonV0 = Array<PointV0>
export type CoordValueV0 = PointV0 | PolygonV0
export type GeomTypeV0 = 'Point' | 'Polygon'
export type GeomRecordV0 = { [key: string]: GeomTypeV0 | CoordValueV0 }
export type TrialStart = {
    version: number
    name: string
    timestamp: string
    trial_id: string
    num_targets: number
    type: string
    coordinates: CoordValueV0
}
export type TrialEnd = {
    version: number
    name: string
    timestamp: string
    trial_id: string
}
export type TrialWait = { version: number; name: string; timestamp: string }

export type TrialObj = TrialStart | TrialEnd | TrialWait

export enum TrialState {
    Start = 'Trial Start',
    End = 'Trial End',
    Wait = 'Wait',
}

export type TelemRecord = {
    lon: number
    lat: number
    alt: number
    timestamp: string
    id: string
    heading: number
    behavior: string
    mission_phase: string
    phase_loc: GeomRecordV0
}

export type Telemetry = TelemRecord[]

export function makeTrialStart(
    id: string,
    type: string = DEFAULT_COORD_TYPE,
    coordinates: CoordValueV0 = DEFAULT_COORD
): TrialStart {
    return {
        version: 0,
        name: 'Trial Start',
        timestamp: new Date().toISOString(),
        trial_id: id,
        num_targets: 3,
        type: type,
        coordinates: coordinates,
    }
}
export function makeTrialEnd(id: string): TrialEnd {
    return {
        version: 0,
        name: 'Trial End',
        timestamp: new Date().toISOString(),
        trial_id: id,
    }
}
