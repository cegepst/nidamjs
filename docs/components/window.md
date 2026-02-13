---
icon: browser
---

# Window

The `Window` component is the primary container for application content within the NidamJS desktop environment. It mimics the behavior of a native operating system window, supporting dragging, resizing, minimizing, maximizing, and closing.

## Overview

A window consists of a title bar (with controls) and a content body. It floats above the desktop background and other windows, managed by a z-index stacking context.

### Features

- **Draggable**: Move the window around the desktop area.
- **Resizable**: Resize from any edge or corner.
- **Stateful**: Supports minimized, maximized, and restored states.
- **Focus Management**: Clicking a window brings it to the front.
- **Snapping**: Windows snap to screen edges and other windows.

## Usage

### Basic Creation

```javascript
desktop.windows.create({
    title: "My Window",
    content: "<div>Content goes here</div>"
});
```

### Advanced Configuration

```javascript
desktop.windows.create({
    id: "settings-panel",
    title: "Settings",
    icon: "/icons/gear.png",
    width: 400,
    height: 600,
    minWidth: 300,
    minHeight: 200,
    x: 100,
    y: 100,
    resizable: false,
    maximizable: false,
    content: document.getElementById('settings-template')
});
```

## Structure & Styling

NidamJS generates the following DOM structure for a window. You can target these classes for custom styling.

```html
<div class="nidam-window active">
    <div class="nidam-titlebar">
        <div class="nidam-titlebar-icon">
            <img src="..." />
        </div>
        <div class="nidam-titlebar-text">Window Title</div>
        <div class="nidam-titlebar-controls">
            <button class="nidam-btn-minimize"></button>
            <button class="nidam-btn-maximize"></button>
            <button class="nidam-btn-close"></button>
        </div>
    </div>
    <div class="nidam-window-body">
        <!-- Your Content Here -->
    </div>
    <!-- Resize Handles -->
    <div class="nidam-resize-handle n"></div>
    <div class="nidam-resize-handle e"></div>
    <!-- ... other handles ... -->
</div>
```

### CSS Variables

You can override default styles using CSS variables:

```css
:root {
    --nidam-window-bg: #ffffff;
    --nidam-titlebar-bg: #e0e0e0;
    --nidam-titlebar-height: 30px;
    --nidam-border-radius: 8px;
    --nidam-shadow: 0 4px 12px rgba(0,0,0,0.15);
}
```

## API Reference

### Properties

| Property | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `title` | `string` | `"Untitled"` | Text displayed in the title bar. |
| `icon` | `string` | `null` | URL for the window icon. |
| `width` | `number` | `600` | Width in pixels. |
| `height` | `number` | `400` | Height in pixels. |
| `minWidth` | `number` | `200` | Minimum width constraint. |
| `minHeight` | `number` | `100` | Minimum height constraint. |
| `resizable` | `boolean` | `true` | Enable/disable resizing. |
| `movable` | `boolean` | `true` | Enable/disable dragging. |

### Methods

| Method | Description |
| :--- | :--- |
| `close()` | Closes and removes the window. |
| `minimize()` | Hides the window to the taskbar. |
| `maximize()` | Expands the window to fill the desktop. |
| `restore()` | Restores the window to its previous size/position. |
| `focus()` | Brings the window to the front. |
| `center()` | Centers the window on the screen. |

### Events

| Event Name | Description |
| :--- | :--- |
| `focus` | Triggered when the window gains focus. |
| `blur` | Triggered when the window loses focus. |
| `move` | Triggered during drag operations. |
| `resize` | Triggered during resize operations. |
| `close` | Triggered just before the window closes. |
