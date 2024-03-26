# cod-polaris-m1

Ditto Common Operational Database (COD) Prototypes

**See also: [COD Overview](docs/README.md) for specific project deliverables.**

## Prototype Apps

_autov-cod_

This is a HTTP to Ditto proxy which is intended to run as a separate process on
an autonomous vehicle ("autov"), providing an easy way to integrate multiple other
processes with a single common operational database (COD) based on the Ditto SDK.

_base-cod_
This is the base-facing side of `autov-cod`.

_Producer/Consumer_

`src/prod_cons/index.ts` a simple producer/consumer app including metadata and
sensor (camera) communication and a simple HTTP UI which provides a "webcams
over Ditto" demo.

_Peer-to-peer Autonomous Vehicle and AI Object Recognition_

Work-in-progress test and prototyping support for autonomous vehicle
integration experiments.

## Setup

Once you have this repo cloned:

1. Create a `./config.json` file with the appropriate BigPeer (or offline dev
   token) values. There is a template in this repo at `config.json.example`

```
{
  "ditto": {
    "app-id": "your-app-id-here",
    "app-token": "your-app-token-here",
    "shared-key": "",
    "offline-token": "",
    "use_cloud": true,
    "use_lan": true,
    "use_ble": true,
    "bpa-url": "portal"
  }
```

2. Install dependencies

```
npm install
```

3. Compile the Typescript

```
npm run build
```

## Running

See (./package.json) for the available `npm` scripts. For example, to run the Producer/Consumer demo:

After you setup the environment variables in `.env` and compile with `tsc`
(i.e. `npm run build`) you can run the service with:

```
npm run start-prod-cons
```

### As Containers

See the [container/README.md](container/README.md) for info on building and running COD nodes from Docker or Podman.

## Development

To run lint and formatting checks:

```
npm run lint
```

To fix any lint errors that can be resolved automatially:

```
npm run lint-fix
```

To reformat typescript files per .prettierrc settings:

```
npm run format
```
