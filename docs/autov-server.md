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

`/api/trial/<trial-id>` - API prefix for a given instance of a trial. Currently
`<trial-id>` MUST be `0` (zero as integer).

`GET /api/trial/0/state`

Non-blocking query for the current state of a trial. Returns a json document
that at least contains the fields `"name"`, `"timestamp"`, `"id"`, and
`"version"`.

Version MUST be "0", and the schema of the response MUST match one of the
following messages:

##### Start
```
{
    "version": 0,
    “name”: “Trial Start”,
    “timestamp”: <ISO format timestamp with time zone>
        “id”: <string of format int.int.int>
        “num_targets”: <integer>
        "geometry": {
            "type": "Polygon",
            "coordinates": [
                [ [<Lon_1, degrees WGS84 >, <Lat_1, degrees WGS84 >],
                [<Lon_2, degrees WGS84 >, <Lat_2, degrees WGS84 >],
                ...,
                [<Lon_n, degrees WGS84 >, <Lat_n, degrees WGS84 >],
                [<Lon_1, degrees WGS84 >, <Lat_1, degrees WGS84 >] ]
            ]
        }
}
```

##### End

```
{
    "version": 0,
    “name”: “Trial End”,
    “timestamp”: <ISO format timestamp with time zone>,
    “id”: <string of format int.int.int>
}
```

##### Init
```
{
    "version": 0,
    “name”: “Init”,
    “timestamp”: <ISO format timestamp with time zone>,
}
```

Where `Init` means we are waiting to receive the trial start command, `Trial
Start` means it was received already, and `Trial End` means the most recent
command received was to end the trial.

In version 0 of the API, additional fields MAY be present in the response
documents, but they will be igored. For `Trial Start` and `Trial End`, the
`timestamp` will be the time the corresponding command originated. For `Init`,
the timestamp will simply be the time the server (AutoV COD) wrote the response
to the client.

### A.I.2 Blocking Query

`GET /api/trial/0/start`
`GET /api/trial/0/end`

These blocking queries will not return a response until the corresponding
command was received. The `start` and `end` endpoints wait for receipt of `Trial
Start` and `Trial End` commands, respectively. The response formats will be
identical to those specified above for `GET /api/trial/0/state`.
