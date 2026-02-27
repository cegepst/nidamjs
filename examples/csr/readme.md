# CSR Example (ES Module)

This demo uses the core ES bundle with explicit initialization.

## Run

```bash
bun run build
bun run csr
```

Open the URL printed by Vite (usually `http://localhost:5173`), then go to `/examples/csr/index.html`.

## Notes

- Uses `dist/nidam.es.js` (core bundle).
- Startup is explicit in `examples/csr/example.js` via `initNidamApp(...)`.
- The demo configures `notify` directly in `examples/shared/example.config.json`.
- Uses `dist/nidam.css` from the library and shared demo styles from `examples/shared/demo.css`.
- Modal routes point to shared HTML files in `examples/shared/`.
