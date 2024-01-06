# cod-polaris-m1
Simple Ditto app - representing a COD node

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

After you setup the environment variables in `.env` and compile with `tsc`
(i.e. `npm run build`) you can run the service with:
```
npm start
```
