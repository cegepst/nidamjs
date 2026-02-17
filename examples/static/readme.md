# Static Example (UMD + File Open)

This demo is designed to work from a direct file open (`file://`) without running a server.

## Run

```bash
bun run static
```

The command opens the demo automatically:

- Linux: `xdg-open` (fallback `open`)
- macOS: `open`
- Windows: `cmd /c start`

## Notes

- Uses `dist/nidam.umd.js` (core UMD bundle, no auto-init).
- Uses `dist/nidam.css` from the library and shared demo styles from `examples/shared/demo.css`.
- Initializes manually in `examples/static/index.html`.
- Enables `windowManager.static: true` in `examples/static/main.js`.
- Routes use the same keys as CSR/SSR (`examples/shared/page-one.html`, `examples/shared/page-two.html`).
- Window content is served from in-page `<template data-route="...">` blocks to avoid HTTP `fetch` constraints in
  `file://`.
