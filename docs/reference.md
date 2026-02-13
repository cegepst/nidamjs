---
icon: code
order: -10
---

# API Reference

This section provides technical details for the NidamJS public API classes, methods, and properties.

## Core

### `new Nidam(config)`

The main class used to initialize the desktop environment.

**Parameters**

| Name | Type | Description |
| :--- | :--- | :--- |
| `config` | `Object` | Configuration options for the environment. See [Configuration](../guide/configuration.md). |

**Returns**

- `Desktop`: An instance of the desktop environment.

**Example**

```javascript
import { Nidam } from 'nidamjs';

const desktop = new Nidam({
    theme: 'dark'
});
```

---

### `createDesktop(config)`

A factory function alias for `new Nidam(config)`.

---

## Desktop Instance

The `Desktop` instance allows you to control the environment programmatically.

### Properties

| Property | Type | Description |
| :--- | :--- | :--- |
| `root` | `HTMLElement` | The DOM element containing the desktop. |
| `windows` | `WindowsManager` | Interface for managing windows. |
| `taskbar` | `TaskbarManager` | Interface for managing the taskbar. |
| `icons` | `IconsManager` | Interface for managing desktop icons. |

### Methods

#### `on(event, callback)`

Subscribe to global desktop events.

- `event` (string): Name of the event (e.g., `'ready'`, `'shutdown'`).
- `callback` (function): The function to execute.

#### `destroy()`

Completely removes the desktop environment from the DOM and cleans up event listeners.

---

## WindowsManager

Accessible via `desktop.windows`. Handles the creation and lifecycle of windows.

### Methods

#### `create(options)`

Creates and displays a new window.

**Parameters**

- `options` (Object): Configuration for the window.
    - `id` (string, optional): Unique ID.
    - `title` (string): Title bar text.
    - `content` (string|HTMLElement): Body content.
    - `width` (number): Initial width.
    - `height` (number): Initial height.

**Returns**

- `Window`: The created window instance.

#### `get(id)`

Retrieves a window instance by its ID.

- `id` (string): The window ID.
- **Returns**: `Window | undefined`

#### `getAll()`

Returns an array of all currently open window instances.

#### `closeAll()`

Closes all open windows.

---

## Window Instance

Represents an individual window. Returned by `desktop.windows.create()`.

### Properties

| Property | Type | Description |
| :--- | :--- | :--- |
| `id` | `string` | The unique identifier of the window. |
| `element` | `HTMLElement` | The main DOM element of the window. |
| `bodyElement` | `HTMLElement` | The content container element. |
| `isMinimized` | `boolean` | Current minimization state. |
| `isMaximized` | `boolean` | Current maximization state. |

### Methods

#### `close()`

Closes the window and removes it from the DOM. Emits the `close` event.

#### `minimize()`

Hides the window content and plays the minimize animation. Emits `minimize`.

#### `maximize()`

Expands the window to fill the available desktop area (excluding taskbar). Emits `maximize`.

#### `restore()`

Restores a minimized or maximized window to its previous dimensions and position. Emits `restore`.

#### `focus()`

Brings the window to the foreground (highest z-index) and sets it as the active window. Emits `focus`.

#### `center()`

Centers the window on the screen.

#### `on(event, callback)`

Listen to window-specific events.

- `event`: `'close'`, `'minimize'`, `'maximize'`, `'restore'`, `'focus'`, `'blur'`, `'resize'`, `'move'`.

---

## TaskbarManager

Accessible via `desktop.taskbar`.

### Methods

#### `show()`

Makes the taskbar visible.

#### `hide()`

Hides the taskbar.

#### `addItem(item)`

Adds a custom item to the system tray area.

- `item` (Object):
    - `id` (string): Unique ID.
    - `icon` (string): URL or HTML for the icon.
    - `tooltip` (string): Hover text.
    - `onClick` (function): Click handler.

---

## IconsManager

Accessible via `desktop.icons`.

### Methods

#### `add(iconConfig)`

Adds a new icon to the desktop grid.

- `iconConfig` (Object):
    - `label` (string): Icon text.
    - `icon` (string): Image URL.
    - `action` (function): Double-click handler.

#### `remove(id)`

Removes an icon by its ID.

#### `arrange()`

Forces a re-calculation of the icon grid positions (e.g., after resizing the browser).
