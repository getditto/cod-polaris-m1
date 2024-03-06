__Go back to [COD Overview](./README.md)__

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

### A.I.2 Blocking Query

`GET /api/trial/<trial-id>/start`

`GET /api/trial/<trial-id>/end`

These blocking queries will not return a response until the corresponding
command was received for the given trial ID. The `start` and `end` endpoints
wait for receipt of `Trial Start` and `Trial End` commands, respectively. The
response formats will be identical to those specified above in section
[A.I.1](#ai1-non-blocking-query).

_Note:_

1. _These should blocking queries should probably be websocket-based callbacks
   instead. Otherwise, clients need to handle timeouts and retries gracefully._

2. _We could also omit the `/<trial-id>` as part of the path and either (a) only
   return information about latest trial, or (b) add `trial-id` as an optional
   query parameter._
