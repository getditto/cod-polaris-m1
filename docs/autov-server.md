# AutoV COD Server
Design doc for a HTTP <-> Ditto proxy which acts as an autonomous vehicle's
common operational database (AutoV COD).

## Status
*API Version: 0*
Initial prototype design for integration testing and feedback.

### Conventions
Some sections are labeled with a number for easy cross-referencing. For example, the section number:

```
A.I.1
```

Specifies a feature on the Autonomy (A) side, which is feature `I.1` within
that spec. One the base side of the system, an API feature could be numbered

```
B.IV.3.b
```
for example, where `B.` signifies a feature exposed on `base` side of
operations, and the feature is numbered `IV.3.b` within that section.

Features that are not Autonomy (A) or Base (B)-specific can use other letter
prefixes such as `C.`, etc.

## AutoV COD API

The `autov-cod` process exposes the following REST API on the configured
HTTP port, available only to localhost connections by default:

### A.I. Start / Stop Trial

This portion of the API is currently designed to mimic existing APIs, but may be
modified in future versions.

#### A.I.1 Non-blocking Query

`GET /api/trial/`

Non-blocking query for the current state of most-recent trial. Returns a json
document that at least contains the fields `"name"` and `"timestamp"`.
`"id"` MUST also be supplied, unless there is no current trial in the system.
`"version"` MUST be supplied, in the future, if its value is non-zero. This
version of the specification ONLY supports version `0`, and thus this field is
optional.

The schema of the response MUST match one of the following messages:

##### Start
```
{
    "version": 0,
    “name”: “Trial Start”,
    “timestamp”: <ISO format timestamp with time zone>,
    “trial_id”: <string of format int.int.int>,
    “num_targets”: <integer>,
    "type": "Polygon" | "Point",
    "coordinates": <array of coordinates>
}
```

where `type` and `coordinates` fields represent one of a
[Polygon](https://datatracker.ietf.org/doc/html/rfc7946#appendix-A.3) or
[Point](https://datatracker.ietf.org/doc/html/rfc7946#appendix-A.1) in GeoJSON
format:

```
        "type": "Polygon",
        "coordinates": [
            [ [<Lon_1, degrees WGS84 >, <Lat_1, degrees WGS84 >],
            [<Lon_2, degrees WGS84 >, <Lat_2, degrees WGS84 >],
            ...,
            [<Lon_n, degrees WGS84 >, <Lat_n, degrees WGS84 >],
            [<Lon_1, degrees WGS84 >, <Lat_1, degrees WGS84 >] ]
        ]
```

Note that the polygon must be closed; the first and last coordinates must be
the same.

An example of the Point format is:

```
     "type": "Point",
     "coordinates": [100.0, 0.0]
 ```


##### End

```
{
    "version": 0,
    “name”: “Trial End”,
    “timestamp”: <ISO format timestamp with time zone>,
    “trial_id”: <string of format int.int.int>
}
```

##### Wait
```
{
    "version": 0,
    “name”: “Wait”,
    “timestamp”: <ISO format timestamp with time zone>,
}
```

Where `Wait` means we are waiting to receive the trial start command, `Trial
Start` means it was received already, and `Trial End` means the most recent
command received was to end the trial.

In version 0 of the API, additional fields MAY be present in the response
documents, but they will be igored. For `Trial Start` and `Trial End`, the
`timestamp` will be the time the corresponding command originated. For `Wait`,
the timestamp will simply be the time the server (AutoV COD) wrote the response
to the client.

#### A.I.2 Blocking Query

`GET /api/trial/start`

`GET /api/trial/end`

These blocking queries will not return a response until the command was received
for the most recent trial ID. The `start` and `end` endpoints
wait for receipt of `Trial Start` and `Trial End` commands, respectively. The
response formats will be identical to those specified above in section
[A.I.1](#ai1-non-blocking-query).

_Note:_

1. _These should blocking queries should probably be websocket-based callbacks
   instead. Otherwise, clients need to handle timeouts and retries gracefully._

2. _We could also add `/<trial-id>` as part of the path, i.e.
   `/api/trial/<trial-id>/start`, or as a query parameter, and block until that
   particular trial reaches the desired state._


### A.II. Telemetry Reporting

_This portion of the API is currently designed to mimic existing services, but may be
modified in future versions._

`POST /api/telemetry/`

Allows AV (autov) client to send latest telemetry to the Base.

```
[{
    "lon": <float>,
    "lat": <float>,
    "alt": <float>,
    "timestamp": <string>,
    "id": <string>,
    "heading": <float>,
    "behavior": <string>,
    "mission_phase": <string>,
    "phase_loc": <GeoJSON Polygon or Point geometry object>
}, ... ]
```

**Required fields:**

`lon` and `lat` are the longitude and latitude in degrees in the WGS84
coordinate system. `timestamp` is in ISO 8601 format with timezone. `id` is a
string which uniquely identifies the reporting vehicle/entity. `heading` is in
degrees clockwise from true North. `mission_phase` MUST be one of `"wait",
"find", "identify",` or `"close"`. `phase_loc` describes the location
corresponding to the phase, and is a GeoJSON Point or Polygon object. Polygons
shall have at most 10 vertices, including the final closing point which is
equal to the first. For example:

```
 [{
        "lon": -121.346005,
        "lat": 36.126203,
        "alt": 0.0,
        "timestamp": '2024-01-02T12:41:16.502237+00:00',
        "id": "uas_4",
        "heading": 137.51,
        "behavior": "loiter",
        "mission_phase": "wait",
        "phase_loc": {
            "type": "Polygon",
            "coordinates": [
                [
                    [-118.277965, 35.124454],
                    [-118.270326, 35.124513],
                    [-118.270393, 35.129934],
                    [-118.280830, 35.129652],
                    [-118.277962, 35.124462]
                ]
            ]
        }
}]
```

**Optional fields:**

`alt` is optional (omitted for surface vehicles), and is
height above ellipsoid (HAE) in meters. `behavior` is optional, but may be used
by autonomy systems for tracking things like "finding", "tracking", "RTB", etc..

### A.II.1 Telemetry Reporting Behavior

Entities/vehicles should call the above API to report real-time position and
status once every 10 seconds. In addition, upon receipt of a new Trial Start /
End event (via the APIs defined in [A.I.](#ai-start--stop-trial)), the entity
should report its current position and status immediately; this serves as an
acknowledgement of the new Trial status. When responding to a new `Trial Start`
event, the associated telemetry update SHALL contain one of the values `"find",
"identify",` or `"close"` for its `"mission_phase"` value.
