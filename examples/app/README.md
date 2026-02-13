# Example App (Minimal Tailwind + NidamJS)

This demo keeps only the essentials: one page + two live window routes.

## Run

```bash
bun examples/app/app.js
```

Open `http://localhost:8080`.

## Routes

- `GET /`: home page with two buttons
- `GET /page-one`: first window content
- `GET /page-two`: second window content

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
└── README.md
```

## Notes

- Server creation is directly in `app.js`.
- The demo uses `/lib/index.js` from local source for direct library usage.
