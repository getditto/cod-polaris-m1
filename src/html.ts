import { DEFAULT_WEBUI_REFRESH_SEC } from './default.js'

function renderFields(fields: Record<string, string>): string {
    let html = ''
    for (const key in fields) {
        html += `<div>${key}: ${fields[key]}</div>`
    }
    return html
}

export function pageWithImage(
    imagePath: string | null,
    fields: Record<string, string>
): string {
    let html = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>cod-polaris-m1</title>
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta http-equiv="refresh" content="${DEFAULT_WEBUI_REFRESH_SEC}">
    <style>
    body {
      background-color: #000000;
      color: #ffffff;
      font-family: sans-serif;
    }
    img {
      width: 100%;
      height: auto;
    }
    </style>
  </head>
  <body>
`
    if (imagePath != null) {
        html += `<img src="${imagePath}" />
`
    } else {
        html += `<div>No image yet...</div>
`
    }
    html += renderFields(fields)
    html += `  </body>
</html>`

    return html
}
