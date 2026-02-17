# Example App (Minimal Tailwind + NidamJS)

This demo keeps only the essentials: one page + two live window routes.

## Run

```bash
bun examples/ssr/main.js
```

Open `http://localhost:8080`.

## Routes

- `GET /`: home page with two buttons
- `GET /page-one`: first window content
- `GET /page-two`: second window content

## WindowManager config used in demo

The demo sets `windowManager.config.layoutStabilizationMs` to stabilize first-window centering when CSS (for example
Tailwind CDN classes) finishes applying after initial DOM insertion.

Current demo value:

- `layoutStabilizationMs: 650`

## File structure

```text
examples/app/
├── app.js
├── public/
│   ├── client.js
│   └── styles.css
├── server/
│   ├── routes.js
│   └── templates/
│       ├── layout.js
│       ├── windowShell.js
│       └── windows.js
└── readme.md
```

## Notes

- Server creation is directly in `app.js`.
- The demo uses the built ES bundle `/dist/nidam.es.js`.
-
