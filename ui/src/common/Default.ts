import { CoordValueV0, TelemRecord, Telemetry } from './types'

export const DEFAULT_COORD_TYPE = 'Polygon'
export const DEFAULT_COORD: CoordValueV0 = [
    [-118.8857791, 39.5277639],
    [-118.88577910818, 39.5277639091],
    [-118.88077910818, 39.5277639091],
    [-118.88077910818, 39.5317639091],
    [-118.88576818351, 39.5317649091],
    [-118.8857791, 39.5277639],
]

export const DEFAULT_TELEM_OBJ: TelemRecord = {
    lon: -118.8857788,
    lat: 39.527633,
    alt: 0,
    timestamp: '2024-03-12T22:26:23.718Z',
    id: 'uav_1',
    heading: 183.3,
    behavior: 'loiter',
    mission_phase: 'find',
    phase_loc: {
        type: DEFAULT_COORD_TYPE,
        coordinates: DEFAULT_COORD,
    },
}

export const DEFAULT_TELEMETRY: Telemetry = []
