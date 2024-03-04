# AV COD Server
Design doc for a HTTP <-> Ditto proxy which acts as an autonomous vehicle's
common operational database (AV COD).

## Status
*API Version: 0*
Initial prototype design for integration testing and feedback.


## AV COD API

The `av-cod-server` process exposes the following REST API on the configured
HTTP port, available only to localhost connections by default:

### Start / Stop Trial

This portion of the API is currently designed to mimic existing APIs, but may be
modified in future versions.

#### Non-blocking Query

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
the timestamp will simply be the time the server (AV COD) wrote the response to
the client.

### Blocking Query

`GET /api/trial/0/start`
`GET /api/trial/0/end`

These blocking queries will not return a response until the corresponding
command was received. The `start` and `end` endpoints wait for receipt of `Trial
Start` and `Trial End` commands, respectively. The response formats will be
identical to those specified above for `GET /api/trial/0/state`.