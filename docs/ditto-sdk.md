
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
| trial\_id       | _id |
| name            | name |
| timestamp       | timestamp |
| *version*  | _Not present: this is the HTTP API version, which is different than the Ditto document schema `model_version`._ |
| num\_targets     | num\_targets |
| type     | type |
| coordinates     | coordinates |
| _not present_     | *model\_version*: version of the data model / schema, per [Version](#version) above.|

where `name` is one of `Trial Start` or `Trial End`. We currently do not store
a document with the `Wait` state (`name`), but the HTTP API returns a `Wait`
response when there is no document stored with the corresponding `trial_id`.

Currently, when a `Trial Start` document is updated to a `Trial End`, the
original field values that are no longer used for the `Trial End` HTTP API
responses are left intact. That is, we do not delete or modify `num_targets`,
`type` and `coordinates` on Start -> End. We do update `name` and `timestamp`,
though, to correspond with values received by the base-cod when it gets the
`Trial End` command.
