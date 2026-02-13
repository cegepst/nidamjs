---
icon: light-bulb
order: 10
---

# Core Concepts

NidamJS is designed as a modular, event-driven system that overlays a desktop environment onto a standard web page. Understanding its core architecture will help you build robust applications.

## Architecture

At a high level, NidamJS consists of a central **Core** that manages state and communication, and several distinct **Modules** that handle specific UI features.

### The Core

The Core is the brain of NidamJS. It initializes the environment, manages global configuration, and serves as the central hub for:

- **State Management:** Tracking open windows, active tasks, and user preferences.
- **Event Bus:** facilitating communication between disparate components (e.g., clicking a taskbar item to minimize a window).
- **Z-Index Orchestration:** Ensuring the active window is always on top.

### Modules

Functionality is divided into logical modules:

1.  **Windows Manager**: Handles the lifecycle (creation, destruction) and physics (dragging, resizing) of windows.
2.  **Taskbar**: Manages the list of active applications, the start menu (if enabled), and system tray indicators.
3.  **Icons**: Renders desktop shortcuts and handles selection, dragging, and execution logic.
4.  **System**: Handles "OS-level" features like themes, background images, and context menus.

## State Management

NidamJS uses a reactive state model. When you open a window, the Core updates its internal registry. This change automatically triggers updates in:

- The **DOM**: The window element is created and appended.
- The **Taskbar**: A new task item appears.
- The **Focus Manager**: The new window gains focus.

This synchronization ensures that the UI is always consistent with the internal state.

## Event System

Interaction in NidamJS is heavily event-driven. Components emit events that you can listen to, allowing for loose coupling between your app logic and the desktop UI.

### Common Events

- `window:open`: Fired when a new window is created.
- `window:close`: Fired before a window is destroyed.
- `window:focus`: Fired when a window becomes active.
- `taskbar:click`: Fired when a taskbar item is clicked.
- `desktop:contextmenu`: Fired when right-clicking the desktop background.

```javascript
desktop.on('window:open', (win) => {
    console.log(`Opened window: ${win.title}`);
});
```

## Z-Index Management

One of the most complex aspects of a web desktop is managing the stacking order of elements. NidamJS handles this automatically using a dynamic z-index system.

- **Base Z-Index**: You define a starting point (e.g., 100).
- **Active Window**: The focused window is always assigned the highest z-index in the stack.
- **Taskbar**: Typically sits above all windows.
- **Context Menus**: Rendered at the very top level (e.g., z-index 9999).

When a user clicks a window, NidamJS recalculates the stack, pushing the clicked window to the front while maintaining the relative order of others.

## Frontend Injection

Unlike traditional desktop environments that run on an OS, NidamJS is "injected" into an existing DOM.

1.  **Root Element**: You specify a container (usually `document.body` or a specific `div`).
2.  **Overlay**: NidamJS creates a layer within this container for the desktop background and icons.
3.  **Window Layer**: An absolute-positioned layer where windows live.
4.  **UI Layer**: The top-most layer containing the taskbar and system menus.

This architecture allows NidamJS to coexist with other frontend frameworks. You can render a React app inside a NidamJS window, or have an Angular app managing the NidamJS instance.
