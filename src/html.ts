export function pageWithImage(imagePath: string | null): string {
    let html = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>cod-polaris-m1</title>
    <meta name="viewport" content="width=device-width, initial-scale=1" />
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
    html += `  </body>
</html>`

    return html
}
