# cod-polaris-m1

Ditto Common Operational Database (COD) Prototypes

__See also: [COD Overview](docs/README.md) for specific project deliverables.__

## Prototype Apps


*autov-cod*

This is a HTTP to Ditto proxy which is intended to run as a separate process on
an autonomous vehicle ("autov"), providing an easy way to integrate multiple other
processes with a single common operational database (COD) based on the Ditto SDK.

*base-cod*
This is the base-facing side of `autov-cod`.

*Producer/Consumer*

`src/prod_cons/index.ts` a simple producer/consumer app including metadata and
sensor (camera) communication and a simple HTTP UI which provides a "webcams
over Ditto" demo.

*Peer-to-peer Autonomous Vehicle and AI Object Recognition*

Work-in-progress test and prototyping support for autonomous vehicle
integration experiments.

## Setup

Once you have this repo cloned:

1) Create a `./config.json` file with the appropriate BigPeer (or offline dev
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

2) Install dependencies

```
npm install
```

3) Compile the Typescript

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
