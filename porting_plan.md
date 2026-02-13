# Nidam.js Porting Plan (from Code Arena)

## Goal

Build `nidamjs` as a reusable JavaScript windowing library, extracted from the strongest generic parts of Code Arena.

Primary objective:

- keep desktop-like window behavior (open/focus/close/drag/snap/maximize/refresh)
- remove Code Arena business coupling
- expose a stable package-level API

Non-objective:

- reproduce Code Arena as an app framework

## Scope Decision

The port targets a portable core, not an application clone. That means architecture choices prioritize:

- framework agnosticism
- low integration assumptions
- runtime injection over hard-coded imports

This is why some Code Arena internals were intentionally rewritten instead of copied 1:1.

## What Was Ported

Core library modules:

- `src/core/EventDelegator.js`
- `src/core/BaseManager.js`
- `src/core/ContentInitializer.js`
- `src/features/window/WindowManager.js`
- `src/features/window/WindowRefresher.js`
- `src/features/desktop/DesktopIconManager.js`
- `src/utils/dom.js`
- `src/utils/eventUtils.js`
- `src/bootstrap/NidamApp.js`
- `src/index.js`

## What Was Not Ported

Excluded Code Arena modules and concerns:

- app registry coupling (`features/registry.js` pattern)
- app-specific managers (`account`, `algo`, `combat`, `trash`, `tournament`, etc.)
- app-level toast/session/terminal state glue
- auth/theme/storage conventions tied to Code Arena UI model
- endpoint conventions hard-bound to Code Arena routes

Reason: these are domain concerns, not reusable window engine concerns.

## Code Arena vs Nidam.js (Deep Comparison)

| Area                       | Code Arena                        | Nidam.js                                           | Why This Change                                 |
| -------------------------- | --------------------------------- | -------------------------------------------------- | ----------------------------------------------- |
| Feature initialization     | Fixed app registry import         | Runtime `registry` injection                       | Avoid hard dependency on one app graph          |
| Notifications              | App toast integration             | `notify(level, message)` adapter                   | Library should not choose UX channel            |
| Window content loading     | App-convention fetch flow         | `fetchWindowContent` adapter + default             | Integrators can use any backend/transport       |
| Endpoint resolution        | App route assumptions             | `resolveEndpoint` adapter + default                | Compatible with non-CA routing conventions      |
| Refresh mapping            | App globals                       | config + fallback (`window.window_refresh_map`)    | Keep compatibility without hard global lock-in  |
| Desktop layout persistence | App account namespace assumptions | `storageKey` and `storageNamespace` options        | Prevent persistence collisions across consumers |
| Public imports             | Internal paths common in app code | package root API (`import { ... } from "nidamjs"`) | Versionable, stable API boundary                |

## Key Adaptations and Tradeoffs

### 1. WindowManager as an engine with adapters

`WindowManager` now accepts optional integration adapters:

- `notify(level, message)`
- `fetchWindowContent(endpoint, context)`
- `initializeContent(root, context)`
- `resolveEndpoint(endpoint)`
- `config` overrides

Impact:

- positive: reusable in different apps/frameworks
- cost: integrator must provide behavior if defaults are insufficient

### 2. ContentInitializer made generic

`ContentInitializer` receives a runtime `registry` and no longer imports a fixed application registry.

Impact:

- positive: keeps dependency graph one-directional (app -> library)
- cost: consuming app must manage module registration lifecycle explicitly

### 3. WindowRefresher made configurable

`WindowRefresher` accepts:

- `refreshMap`
- `refreshTimeout`

It still supports `window.window_refresh_map` as fallback for compatibility with legacy integration styles.

Impact:

- positive: event refresh behavior can match multiple backend styles
- cost: refresh mapping quality depends on consumer-defined patterns

### 4. DesktopIconManager persistence decoupled

`DesktopIconManager` supports:

- `storageKey`
- `storageNamespace`

Impact:

- positive: no hidden dependency on app identity/account schema
- cost: consumer must choose a consistent namespace strategy

## Runtime Contracts

### DOM contract

Expected selectors/attributes in modal HTML:

- `.window`
- `[data-modal]`
- `[data-close]`
- `[data-maximize]`
- `[data-bar]`
- `.window-content-scrollable` (recommended for scroll restore quality)

If `.window` is missing in fetched HTML, open operations are ignored by design.

### CSS contract

Consumer styles should define at least:

- `.window`
- `.window-toggling`
- `.window.maximized`
- `.window.tiled`
- `.snap-indicator`
- appearance/disappearance animation classes

Without this contract, behavior remains functional but UX quality degrades (maximize/snap visuals, transitions, affordances).

### Fetch contract

Default fetch behavior:

- URL: `/${endpoint}`
- Header: `X-Modal-Request: 1`
- Response must contain `.window` HTML

Any of this can be replaced through `fetchWindowContent` / `resolveEndpoint`.

## Public API Boundary

Official path:

- `import { ... } from "nidamjs"`

Policy:

- `src/*` internals are implementation details
- consumers should not rely on internal file layout

This protects semver stability during internal refactors.

## Integration API

Use `NidamApp` or `createNidamApp` as entrypoint.

Typical config surface:

- `modalContainer`
- optional `registry`
- optional `windowManager` adapters/config
- optional `refreshMap`
- optional `refreshTimeout`

## Testing and Quality Tooling

Current tooling:

- tests: `Vitest` + `jsdom`
- coverage: `@vitest/coverage-v8`
- type linting: `TypeScript` in `checkJs`
- formatting: `Prettier`

Current Bun commands:

- `bun run check:imports`
- `bun run test`
- `bun run test:watch`
- `bun run lint`
- `bun run format`
- `bun run quality`

Coverage output:

- HTML: `coverage/index.html`
- LCOV: `coverage/lcov.info`

## Behavioral Differences You Should Expect vs Code Arena

- No built-in app feature modules are auto-wired.
- No built-in app toast/terminal messaging strategy.
- No built-in app auth/session fetch protections.
- Refresh behavior depends on provided mapping quality.
- Desktop persistence is generic, not account-schema aware.

These are intentional differences to keep the package reusable outside Code Arena.

## Migration Strategy (Recommended)

1. Integrate `EventDelegator + WindowManager` first.
2. Wire app-specific content init through `registry`.
3. Add `WindowRefresher` once backend emit patterns are stable.
4. Add `DesktopIconManager` only if desktop drag/drop persistence is needed.
5. Enforce package-root imports in consuming code.

## Risks and Notes

- Missing DOM/CSS contract causes degraded UX.
- Overly broad refresh patterns can refresh too many windows.
- Heavy side effects in registry initializers can create race conditions.
- Internal imports from consumers increase break risk during upgrades.

## Summary

The port keeps Code Arena's strongest reusable part (window engine) and removes app coupling that would block reuse.

`nidamjs` is positioned as a portable core library with explicit integration seams, not a pre-coupled application shell.
