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

## Documentation

- Porting plan and Code Arena differences: [porting_plan.md](porting_plan.md)
- Additional docs index: [docs/readme.md](docs/readme.md)
- Example app guide: [examples/app/readme.md](examples/app/readme.md)

## Naming Convention

- All documentation filenames use lowercase.
- Standard file name: `readme.md` (not `README.md`).

## Files

- Porting plan: [porting_plan.md](porting_plan.md)
- Project root documentation: [readme.md](readme.md)

## Scripts (Bun)

- `bun run check:imports`: verifies the public entrypoint can be imported.
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
├── porting_plan.md
├── readme.md
├── bun.lock
├── docs
│   └── readme.md
├── examples
│   └── app
│       ├── readme.md
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
│       ├── dom.js
│       └── eventUtils.js
├── tests
│   ├── readme.md
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
- `docs/porting_plan.md`: migration decisions and boundaries.
- `tsconfig.json`: type-lint config for JS (`checkJs`).
- `vitest.config.js`: test runner config.

## Notes

Detailed migration strategy and design rationale are documented in [docs/porting_plan.md](porting_plan.md).
