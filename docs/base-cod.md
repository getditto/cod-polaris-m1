# Base COD Server

Design doc for a HTTP <-> Ditto proxy service which acts as the Base-side
interface to the common operational database (COD).

## Status
*API Version: 0*
Initial prototype design for integration testing and feedback.

## Base COD API
The `base-cod` process exposes the following REST API on the configured HTTP
port and bind address:

### B.I.1. Start / Stop Trial

`POST /api/trial_start/`
`POST /api/trial_end/`

The client sends a JSON document with the same format which is received on the
autonomous vehicle (autov) side, as specified in
[A.I.](autov-server.md#autov-cod-api), except:

- The client MAY omit the `version` field. If it is included, its value must be
  `0` (zero as integer) for this version of the specification.

- Only `"Trial Start"` and `"Wait"` messages are accepted by the
  `/api/trial_start/` endpoint. Sending a `Wait` message to `/api/trial_start/`
  will not be propagated in any way, but the `base-cod` server will respond
  with success (200 OK) if system health is good.

- Only `"Trial End"` messages are accepted by the `/api/trial_end/` endpoint.

### B.II. Telemetry

Version 0 of the telemetry reporting API mimics existing services; instead of
exposing a REST API endpoint to allow a client (i.e. the base) to query for new
telemetry reports, the Base COD service initiates connections to existing base
services and uses HTTP POST to update them.

`Base COD client -> POST <base-API-server>/api/telemetry'`

The requirements for telemetry message format and behavoir of these messages is
the same as specified in the [AutoV COD API section](aii-telemetry-reporting).
Essentially, in version 0 here, the COD acts as an intelligent proxy for
telemetry messages, receiving them via its HTTP API on the autov-cod service,
and sending them from its base-cod service to existing base services.
