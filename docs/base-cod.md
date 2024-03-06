__Go back to [COD Overview](./README.md)__

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
