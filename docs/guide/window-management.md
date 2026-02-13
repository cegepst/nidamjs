---
icon: browser
order: 20
---

# Window Management

Windows are the fundamental building blocks of the NidamJS desktop environment. They encapsulate content, provide standard controls (minimize, maximize, close), and can be moved or resized by the user.

## Creating a Window

To create a new window, use the `create()` method on the `windows` manager of your desktop instance.

```javascript
const myWindow = desktop.windows.create({
    title: "My Application",
    width: 800,
    height: 600,
    content: "<h1>Hello World</h1>"
});
```

### Configuration Options

When creating a window, you can pass a configuration object to customize its behavior and appearance.

| Option | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `id` | `string` | `uuid()` | Unique identifier for the window. |
| `title` | `string` | `"Untitled"` | The text displayed in the title bar. |
| `icon` | `string` | `null` | URL to an icon image displayed in the title bar and taskbar. |
| `content` | `string` \| `HTMLElement` | `""` | The HTML content or DOM element to render inside the window body. |
| `width` | `number` | `600` | Initial width in pixels. |
| `height` | `number` | `400` | Initial height in pixels. |
| `x` | `number` | `auto` | Initial X position. If omitted, cascades automatically. |
| `y` | `number` | `auto` | Initial Y position. If omitted, cascades automatically. |
| `center` | `boolean` | `false` | If `true`, ignores x/y and centers the window on screen. |
| `resizable` | `boolean` | `true` | Whether the user can resize the window. |
| `movable` | `boolean` | `true` | Whether the user can drag the window. |
| `minimizable` | `boolean` | `true` | Show minimize button. |
| `maximizable` | `boolean` | `true` | Show maximize button. |
| `closable` | `boolean` | `true` | Show close button. |

## Window Lifecycle

You can programmatically control the state of a window using its instance methods.

### Opening and Closing

```javascript
// Open (create) is usually handled by the factory
const win = desktop.windows.create({ id: 'settings' });

// Close the window
win.close();
```

### State Management

```javascript
// Minimize to taskbar
win.minimize();

// Maximize to fill the desktop area
win.maximize();

// Restore to previous size/position (from minimized or maximized state)
win.restore();
```

### Focus and Z-Index

NidamJS automatically handles z-index management. When a user clicks a window, it is brought to the front. You can force this programmatically:

```javascript
win.focus();
```

## Window Content

The `content` property is flexible. It can be a simple HTML string, a DOM node, or even a mount point for a frontend framework.

### Using HTML Strings

```javascript
desktop.windows.create({
    title: "About",
    content: `
        <div class="p-4">
            <h2>NidamJS v1.0</h2>
            <p>A web desktop framework.</p>
        </div>
    `
});
```

### Using DOM Elements

```javascript
const form = document.createElement('form');
form.innerHTML = '<input type="text" placeholder="Name" />';

desktop.windows.create({
    title: "Input Form",
    content: form
});
```

### Using Frameworks (React Example)

You can mount a React component into the window body after creation.

```javascript
import React from 'react';
import { createRoot } from 'react-dom/client';
import MyComponent from './MyComponent';

const win = desktop.windows.create({
    title: "React App",
    width: 500,
    height: 500
});

// The window instance exposes its body element
const root = createRoot(win.bodyElement);
root.render(<MyComponent />);

// Cleanup when window closes
win.on('close', () => root.unmount());
```

## Events

Windows emit events that you can listen to for integrating custom logic.

```javascript
win.on('focus', () => {
    console.log('Window focused');
});

win.on('minimize', () => {
    console.log('Window minimized');
});

win.on('close', () => {
    console.log('Window closed');
    // Return false to prevent closing if needed
});
```
