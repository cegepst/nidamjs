# NidamJS

NidamJS is a framework-agnostic JavaScript library for desktop-like window components in web applications.

## Official API

Use the package root export for manual initialization:

```js
import { createNidamApp, WindowManager, WindowRefresher } from "nidamjs";
```

Internal paths (`src/*`) are implementation details and not public API.

## Bundle Strategy

- `nidamjs` (`dist/nidam.es.js`, `dist/nidam.umd.js`): core bundle.
- Initialization is explicit: call `createNidamApp(...).initialize()`.

## Installation

```bash
bun install
```

## Quick Start

```js
import { createNidamApp } from "nidamjs";

const app = createNidamApp({
  modalContainer: "#target",
  registry: [],
  windowManager: {
    config: {
      layoutStabilizationMs: 450,
    },
  },
});

app.initialize();
```

`layoutStabilizationMs` controls how long the first window can auto-recenter if late CSS changes its rendered size after
open.

## Toast Notifications

- App-level notifications use `toastNotify` by default.
- Supported positions: `top-right`, `top-left`, `bottom-right`, `bottom-left`.
- Styling is CSS-variable driven on `[nd-toast-stack]` and `.nd-toast`.

## Documentation

- Porting plan and Code Arena differences: [porting_plan.md](porting_plan.md)
- Additional docs index: [docs/readme.md](docs/readme.md)
- CSR example: [examples/csr/readme.md](examples/csr/readme.md)
- SSR example: [examples/ssr/readme.md](examples/ssr/readme.md)

## Naming Convention

- All documentation filenames use lowercase.
- Standard file name: `readme.md` (not `README.md`).

## Files

- Porting plan: [porting_plan.md](porting_plan.md)
- Project root documentation: [readme.md](readme.md)

## Scripts (Bun)

- `bun run imports`: verifies the public entrypoint can be imported.
- `bun run test`: runs Vitest with coverage enabled.
- `bun run test:watch`: watch mode with coverage enabled.
- `bun run lint`: type-lints JS with TypeScript (`checkJs`).
- `bun run format`: rewrites formatting with Prettier.
- `bun run quality`: aggregate quality command.
- `bun run csr`: builds bundles then opens the CSR demo.
- `bun run ssr`: builds bundles then starts the SSR demo server.

## Quality Stack

- Test framework: `Vitest` + `jsdom`
- Coverage: `@vitest/coverage-v8` (V8 provider)
- Type linter: `TypeScript` in `checkJs` mode
- Formatter: `Prettier`

## Coverage Report

- Run `bun run test`.
- Terminal summary is printed after tests.
- HTML report: `coverage/index.html`.
- LCOV report: `coverage/lcov.info`.

## Runtime DOM Contract

The window engine expects these selectors/attributes in your modal HTML:

- `.window`
- `[data-modal]`
- `[data-close]`
- `[data-maximize]`
- `[data-bar]`
- `.window-content-scrollable` (optional but recommended)

## Project Tree

```text
.
├── .gitignore
├── porting_plan.md
├── readme.md
├── bun.lock
├── docs
│   └── readme.md
├── examples
│   ├── csr
│   │   ├── index.html
│   │   ├── main.js
│   │   └── readme.md
│   ├── ssr
│   │   ├── main.js
│   │   ├── public
│   │   │   └── client.js
│   │   ├── readme.md
│   │   └── server
│   │       ├── routes.js
│   │       └── templates
│   │           └── layout.js
│   ├── shared
│       ├── demo.css
│       ├── page-one.html
│       └── page-two.html
├── package.json
├── src
│   ├── bootstrap
│   │   └── NidamApp.js
│   ├── core
│   │   ├── BaseManager.js
│   │   ├── ContentInitializer.js
│   │   └── EventDelegator.js
│   ├── features
│   │   ├── desktop
│   │   │   └── DesktopIconManager.js
│   │   └── window
│   │       ├── WindowManager.js
│   │       └── WindowRefresher.js
│   ├── index.js
│   └── utils
│       ├── dom.js
│       └── eventUtils.js
├── tests
│   ├── readme.md
│   └── unit
│       ├── contentInitializer.test.js
│       ├── windowManager.test.js
│       └── windowRefresher.test.js
├── tsconfig.json
└── vitest.config.js
```

## Tree Explanation

- `src/index.js`: side-effect-free public API entrypoint.
- `src/bootstrap/`: app bootstrap composition (`NidamApp`).
- `src/core/`: generic infrastructure primitives (base manager, event delegation, dynamic init).
- `src/features/window/`: core window system (open/close/focus/drag/snap/refresh).
- `src/features/desktop/`: desktop icon drag-and-drop behavior.
- `src/utils/`: shared utility helpers.
- `examples/csr/`: ES module client-side example.
- `examples/ssr/`: Express-based server-side rendering example.
- `examples/shared/`: shared pages and demo styling reused by CSR/SSR.
- `tests/unit/`: focused unit tests for core and window features.
- `docs/porting_plan.md`: migration decisions and boundaries.
- `tsconfig.json`: type-lint config for JS (`checkJs`).
- `vitest.config.js`: test runner config.

## Notes

Detailed migration strategy and design rationale are documented in [docs/porting_plan.md](porting_plan.md).
