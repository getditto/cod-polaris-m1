# Common Operational Database (COD) Demo UI

This demo UI uses [Material UI
(MUI)](https://mui.com/material-ui/getting-started/) / React.
[Vite](https://vitejs.dev/) is used for the development server tooling. For
"production" deployments, see [their documentation](https://vitejs.dev/guide/)
on how to use Rollup to create optimized assets.

## Start Dev UI Server

First, configure the URLs for your COD services by editing
[ui/uiconfig.json](ui/uiconfig.json).

Next, start up a webserver which serves the UI:

```
npm run dev -- --host 0.0.0.0
```

And follow the URL shown in the output.

## UI Components

The [main UI](src/App.tsx) consists of two main components,
[AutovUi](src/autov/AutovUi.tsx), and [BaseUi](BaseUI). Follow those links to
dive deeper into the subcomponents and how they work together.

