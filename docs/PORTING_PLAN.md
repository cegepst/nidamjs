# Nidam.js Porting Plan (from Code Arena)

## Goal

Build `Nidam.js` as a reusable JavaScript library for desktop-like window components in web applications.

The target is a **portable core** (window lifecycle + desktop icons + event delegation), not a full copy of Code Arena business features.

## What We Ported

These modules are now the core of `nidamjs`:

- `src/core/EventDelegator.js`
- `src/core/BaseManager.js`
- `src/core/ContentInitializer.js` (decoupled from app registry)
- `src/features/window/WindowManager.js`
- `src/features/window/WindowRefresher.js`
- `src/features/desktop/DesktopIconManager.js`
- `src/utils/dom.js`
- `src/utils/eventUtils.js`
- `src/bootstrap/NidamApp.js`
- `src/index.js`

## Public API Policy

`Nidam.js` now exposes a single official import path:

- `import { ... } from "nidamjs"`

Legacy `src/components/*` compatibility shims were removed on purpose.

## Testing and Type Linting

The project is configured with:

- `Vitest` + `jsdom` for unit testing
- `TypeScript` (`checkJs`) for type-linting JavaScript sources

Scripts:

- `npm run test`
- `npm run typecheck`
- `npm run verify`

## What We Explicitly Did Not Port

To keep the library framework-agnostic and app-agnostic, we excluded Code Arena business/UI modules:

- `features/registry.js` from Code Arena (global app feature list)
- App-specific managers (`account`, `algo`, `combat`, `trash`, `tournament`, etc.)
- Code Arena `toast` + terminal-state coupling
- Code Arena `Application` fetch-guard/session behavior
- Code Arena storage/theme/auth glue

## Why This Split Is Correct

`WindowManager` in Code Arena is strong, but it is coupled to:

- app-level content initialization
- app-level notification implementation
- app-level endpoint conventions

In `Nidam.js`, this was converted to dependency injection so the core stays reusable.

## Key Adaptations Done

### 1. `WindowManager` dependency injection

`WindowManager` now accepts optional adapters in its constructor:

- `notify(level, message)`
- `fetchWindowContent(endpoint, context)`
- `initializeContent(root, context)`
- `resolveEndpoint(endpoint)`
- `config` overrides

This removes hard dependencies on Code Arena `ContentInitializer` and `toast`.

### 2. Generic `ContentInitializer`

`ContentInitializer` no longer imports a fixed registry.
It receives a `registry` array at runtime.

### 3. Configurable `WindowRefresher`

`WindowRefresher` now accepts:

- `refreshMap`
- `refreshTimeout`

It still supports `window.window_refresh_map` fallback for compatibility.

### 4. Configurable desktop icon persistence

`DesktopIconManager` now accepts:

- `storageKey`
- `storageNamespace`

This removes direct coupling to Code Arena account dataset conventions.

## Runtime Contracts (Required by the Core)

### DOM contract

The core expects these selectors/attributes in rendered modal content:

- `.window`
- `[data-modal]`
- `[data-close]`
- `[data-maximize]`
- `[data-bar]`
- `.window-content-scrollable` (optional, for scroll restore quality)

### CSS contract

Consumers should provide styles for:

- `.window`
- `.window-toggling`
- `.window.maximized`
- `.window.tiled`
- `.snap-indicator`
- appearance/disappearance animation classes

### Fetch contract

Default behavior:

- request URL: `/${endpoint}`
- request header: `X-Modal-Request: 1`
- response body contains HTML including `.window`

Can be fully overridden via `fetchWindowContent`.

## New Bootstrap API

Use `NidamApp` (or `createNidamApp`) as integration entrypoint.

You provide:

- `modalContainer`
- optional feature `registry`
- optional `windowManager` adapters/config
- optional `refreshMap`

## Migration Phases (Recommended)

1. Integrate only `EventDelegator + WindowManager`.
2. Add `WindowRefresher` once backend emit mapping is available.
3. Add `DesktopIconManager` if desktop drag/drop is needed.
4. Register app-specific modules through runtime registry, not inside the library.

## Risks and Notes

- If consumer HTML does not contain `.window`, open requests will be ignored.
- Without CSS contract, behavior works but UX will degrade.
- Feature registries should avoid heavy side effects in initializers.

## Summary

This port keeps the strongest part of Code Arena (windowing engine) while removing platform coupling. `Nidam.js` is now positioned as a reusable core library instead of an application clone.
