
# Ditto SDK Implementation of the Common Operational Database (COD)

_This is a summary of how this Common Operational Database (COD) is implemented on top of the Ditto SDK._

## Ditto Platform Basics

For a high-level overview of the Ditto Platform, see our [platform product
page](https://ditto.live/platform). The technical docs start at
[docs.ditto.live](https://docs.ditto.live).

Our initial COD implementation uses the Typescript/JS SDK, but SDKs are available
for many languages and platforms. Typescript SDK docs can currently be found at
[docs.ditto.live/js/installation](https://docs.ditto.live/js/installation).

The rest of this document assumes basic familiarity with the Ditto SDK API and
concepts.

## Ditto COD Implementation

### Version
We will increment this "data model version" in the future if we make changes
that affect compatibillty with other Ditto clients.

| Version         | Description           |
|-----------------|-----------------------|
| *0*             | Initial version. Trial Start / End and Telemetry |


### Initial Design: v0
We are taking an iterative approach with the design of the Ditto COD: Our
initial implementation aims to maximize compatibility with existing sytems and
protocols. We try to keep things simple but functional. In the future, we can
take fuller advantage of Ditto API capabilites
to reduce complexity, and improve flexibility and robustness in the field.

This document makes use of data types and formats specified, in JSON,
in the [autov-server.md](./autov-server.md) and [base-cod.md](./base-cod.md)
HTTP API specifications. Any deviations will be defined separately in this
document.

### Trial Start / End

Trial state is stored in the Ditto `trials` collection. Each `trial_id` exists
in at most one document within that collection. `trial_id` values are stored
under the name `_id` in ditto documents, which treats them as the primary key.


| HTTP API Field  | Ditto document field |
|-----------------|----------------------|
| *version*  | _Not present: this is the HTTP API version, which is different than the Ditto document schema `model_version`._ |
| _not present_     | **model\_version**: version of the data model / schema, per [Version](#version) above.|
| trial\_id       | _id |
| name            | name |
| timestamp       | timestamp |
| num\_targets     | num\_targets |
| type     | type |
| coordinates     | coordinates |

where `name` is one of `Trial Start` or `Trial End`. We currently do not store
a document with the `Wait` state (`name`), but the HTTP API returns a `Wait`
response when there is no document stored with the corresponding `trial_id`.

Currently, when a `Trial Start` document is updated to a `Trial End`, the
original field values that are no longer used for the `Trial End` HTTP API
responses are left intact. That is, we do not delete or modify `num_targets`,
`type` and `coordinates` on Start -> End. We do update `name` and `timestamp`,
though, to correspond with values received by the base-cod when it gets the
`Trial End` command.

### Telemetry

The Ditto COD stores telemetry in the `telemetry` collection. Each telemetry
record written by a node (entity / vehicle) is stored as a separate document in
the collection. Many of the HTTP API fields (defined in [Autov Server
A.II.](./autov-server.md#aii-telemetry-reporting)) are used directly in the
Ditto document (data model), with some key differences:

| HTTP API Field  | Ditto document field |
|-----------------|----------------------|
| *version*  | _Not present: this is the HTTP API version, which is different than the Ditto document schema `model_version`._ |
| _not present_   | **model\_version**: version of the data model / schema, per [Version](#version) above.
| lon             | lon |
| lat             | lat |
| alt             | alt |
| timestamp       | timestamp |
| id              | node\_id |
| heading         | heading |
| behavior        | behavior |
| mission\_phase  | mission\_phase |
| phase\_loc  | phase\_loc |
| _not present_   | consumed |
| _not present_   | **epoch** |

We give the HTTP API's `id` field a more descriptive name, `node_id`, to
clarify that it identifies the sending node (i.e. entity / vehicle).

We also add some additional fields to the Ditto documents to help implement
end-to-end reliability and limit storage requirements. The `consumed` field
MUST only be set to `true` by the base-cod service after it has reliably
delivered the corresponding record to the base destination.

The `epoch` field is added to allow us to separate telemetry data between
different missions or trials. `epoch` is a unsigned 64-bit integer value that
monotonically increases as new missions / trials begin and end. In v0, this
field is an _internal implementation detail_ as far as clients of
the COD HTTP APIs are concerned: we do not expose the `epoch` to HTTP API
clients. The autov-cod and base-cod services MAY use the `epoch` to manage
record lifetime and retention; it MAY derive telemetry epoch numbers from the
stream of `Trial Start` and `Trial End` messages, or use another method to
separate the histrorical stream of telemetry records into `epoch`s.
