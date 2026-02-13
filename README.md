# NidamJS

## Purpose

NidamJS is a framework-agnostic JavaScript library designed to inject desktop-like logic into web frontends. It enables windows, taskbar, icons, and related UI/UX features without requiring backend changes. The goal is to provide a reusable, modular system similar to htmx, but for desktop metaphors.

## Key Features

- **Windows:** Create, move, resize, minimize, maximize, and close windows in the frontend.
- **Taskbar:** Manage open windows, show status, and allow quick switching.
- **Icons:** Support for desktop and window icons, drag-and-drop, and context menus.
- **Event Handling:** Listen for and emit desktop-like events (window focus, taskbar click, etc).
- **Framework Agnostic:** Works with React, Vue, Angular, Svelte, or vanilla JS.
- **Frontend Only:** No backend logic or requirements; injects into existing frontend.

## Architecture Overview

```text
nidamjs/
├── src/
│   ├── components/
│   ├── utils/
│   ├── index.js
├── tests/
├── docs/
├── examples/
└── package.json

```

## Modules

- **Core:** Window/taskbar/icon state management, event bus, API surface.
- **Windows:** UI components, window lifecycle, z-index, drag/resize logic.
- **Taskbar:** Taskbar UI, window list, status indicators.
- **Icons:** Icon rendering, desktop placement, context menu.
- **Integrations:** Adapters for popular frameworks (optional).

## Example Usage

### 1. HTML Setup

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>My Desktop Web App</title>
  </head>
  <body>
    <button nd-open="/users">Open users page</button>

    <script type="module" src="nidam.js"></script>
  </body>
</html>
```

### 2. JavaScript Initialization

```javascript
import { createWindow, createTaskbar } from "nidamjs";

const win = createWindow({ title: "My App", icon: "app.png" });
createTaskbar({ windows: [win] });
```

### 3. Configuration Object

```json
{
  "zIndexBase": 40,
  "cascadeOffset": 30,
  "cooldownMs": 500,
  "maxWindows": 10,
  "snapGap": 8,
  "taskbarHeight": 64,
  "snapThreshold": 30,
  "dragThreshold": 10,
  "resizeDebounceMs": 6,
  "animationDurationMs": 400,
  "defaultWidth": 800,
  "defaultHeight": 600,
  "minMargin": 10,
  "edgeDetectionRatio": 0.4,
  "scrollRestoreTimeoutMs": 2000,
  "windowDefaults": {
    "title": "Untitled",
    "icon": "default.png",
    "resizable": true,
    "minimizable": true,
    "maximizable": true
  },
  "taskbar": {
    "showClock": true,
    "showNotifications": true
  },
  "icons": {
    "supportedFormats": ["ico", "png", "svg"]
  }
}
```

## Integration Strategy

- **Vanilla JS:** Direct API usage, inject into DOM.
- **React/Vue/Angular/Svelte:** Use as a service or custom element; no framework-specific dependencies.
- **Styling:** Provide default CSS, allow overrides.

## Dev

### Run the app exemple

```bash
bun examples/app/app.js
```

### Format the code

```bash
bun run prettier -w *
```
