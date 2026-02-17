# Static Example (UMD + File Open)

This demo is designed to work from a direct file open (`file://`) without running a server.

## Run

```bash
bun run static
```

On Linux this runs `xdg-open`; on macOS it falls back to `open`.

## Notes

- Uses `dist/nidam.umd.js` (core UMD bundle, no auto-init).
- Initializes manually in `examples/static/index.html`.
- Enables `windowManager.static: true` in `examples/static/main.js`.
- Window content is served from in-page `<template data-route="...">` blocks to avoid HTTP `fetch` constraints in `file://`.
