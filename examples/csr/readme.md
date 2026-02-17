# CSR Example (ES Module)

This demo uses the core ES bundle with explicit initialization.

## Run

```bash
bun run build
bun run dev
```

Open the URL printed by Vite (usually `http://localhost:5173`), then go to `/examples/csr/index.html`.

## Notes

- Uses `dist/nidam.es.js` (core bundle).
- Startup is explicit in `examples/csr/main.js` via `createNidamApp(...).initialize()`.
- Modal routes point to static HTML files in `examples/csr/`.
