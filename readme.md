# NidamJS

NidamJS is a framework-agnostic JavaScript library for desktop-like window components in web applications.

## Official API

Use only the package root export:

```js
import { createNidamApp, WindowManager, WindowRefresher } from "nidamjs";
```

Internal paths (`src/*`) are implementation details and not public API.

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
    notify: (level, message) => console.log(level, message),
  },
});

app.initialize();
```

## Scripts (Bun)

- `bun run imports`: verifies the public entrypoint can be imported.
- `bun run test`: runs Vitest with coverage enabled.
- `bun run test:watch`: watch mode with coverage enabled.
- `bun run lint`: type-lints JS with TypeScript (`checkJs`).
- `bun run format`: rewrites formatting with Prettier.
- `bun run quality`: aggregate quality command.

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
├── README.md
├── bun.lock
├── docs
│   ├── PORTING_PLAN.md
│   └── docs.md
├── examples
│   └── app
│       ├── README.md
│       ├── app.js
│       ├── public
│       │   ├── client.js
│       │   └── styles.css
│       └── server
│           ├── routes.js
│           └── templates
│               ├── layout.js
│               ├── windowShell.js
│               └── windows.js
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
│       ├── UTILS.MD
│       ├── dom.js
│       └── eventUtils.js
├── tests
│   ├── TEST.MD
│   └── unit
│       ├── content-initializer.test.js
│       ├── window-manager.test.js
│       └── window-refresher.test.js
├── tsconfig.json
└── vitest.config.js
```

## Tree Explanation

- `src/index.js`: single public entrypoint.
- `src/bootstrap/`: app bootstrap composition (`NidamApp`).
- `src/core/`: generic infrastructure primitives (base manager, event delegation, dynamic init).
- `src/features/window/`: core window system (open/close/focus/drag/snap/refresh).
- `src/features/desktop/`: desktop icon drag-and-drop behavior.
- `src/utils/`: shared utility helpers.
- `examples/app/`: minimal Tailwind demo app with 2 live window routes.
- `tests/unit/`: focused unit tests for core and window features.
- `docs/PORTING_PLAN.md`: migration decisions and boundaries.
- `tsconfig.json`: type-lint config for JS (`checkJs`).
- `vitest.config.js`: test runner config.

## Notes

Detailed migration strategy and design rationale are documented in `docs/PORTING_PLAN.md`.
