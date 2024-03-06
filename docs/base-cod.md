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

`POST /api/trial/`

The client sends a JSON document with the same format which is received on the
autonomous vehicle (autov) side, as specified in
[A.I.](autov-server.md#autov-cod-api), except:

- The client MAY omit the `version` field. If it is included, its value must be
  `0` (zero as integer).
- Sending a `Wait` message will not be propagated in any way, but the
  `base-cod` server will respond with success (200 OK) if system health is
  good.
