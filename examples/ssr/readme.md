# SSR Example (Express + ES Build)

This demo serves an SSR home page and SSR window routes.

## Run

```bash
bun run ssr
```

Open `http://localhost:8080`.

## Routes

- `GET /`: home page with buttons
- `GET /page-one`: first window content (SSR template)
- `GET /page-two`: second window content (SSR template)

## Notes

- Uses the built ES bundle `/dist/nidam.es.js` in the browser.
- Initializes from shared JSON config in `examples/shared/example.config.json`.
- Uses the built library stylesheet `/dist/nidam.css`.
- Uses shared demo styles from `examples/shared/demo.css`.
- Window pages are rendered by SSR templates in `examples/ssr/server/templates/`.
