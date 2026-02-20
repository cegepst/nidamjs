---
icon: gear
order: 90
---

# Configuration

NidamJS is highly configurable to suit different application needs. You can pass a configuration object when
initializing the library to customize behavior, appearance, and limits.

## Global Options

These options control the overall environment settings.

| Option                | Type                | Default         | Description                                                |
| :-------------------- | :------------------ | :-------------- | :--------------------------------------------------------- |
| `root`                | `HTMLElement`       | `document.body` | The DOM element where the desktop environment is rendered. |
| `theme`               | `'light' \| 'dark'` | `'light'`       | Sets the initial color theme.                              |
| `backgroundImage`     | `string`            | `null`          | URL for the desktop background wallpaper.                  |
| `zIndexBase`          | `number`            | `100`           | The starting z-index for windows.                          |
| `animationDurationMs` | `number`            | `300`           | Duration of open/close animations in milliseconds.         |

## Window Management

Control how windows behave and interact.

| Option          | Type     | Default    | Description                                      |
| :-------------- | :------- | :--------- | :----------------------------------------------- |
| `cascadeOffset` | `number` | `20`       | Pixel offset for new windows when cascading.     |
| `maxWindows`    | `number` | `Infinity` | Maximum number of open windows allowed.          |
| `snapGap`       | `number` | `10`       | Distance in pixels for window snapping to edges. |
| `dragThreshold` | `number` | `5`        | Minimum movement in pixels to trigger a drag.    |
| `defaultWidth`  | `number` | `600`      | Default width for new windows.                   |
| `defaultHeight` | `number` | `400`      | Default height for new windows.                  |

## Taskbar Settings

Customize the appearance and functionality of the taskbar.

```javascript
taskbar: {
    position: 'bottom', // 'top', 'bottom', 'left', 'right'
    height: 48,
    showClock: true,
    showStartButton: true,
    startMenu: {
        width: 300,
        height: 400
    }
}
```

## Icons Configuration

Settings related to desktop icons and file types.

```javascript
icons: {
    gridSize: 96, // Size of the invisible grid for icon alignment
    labelColor: '#ffffff',
    selectionColor: 'rgba(0, 120, 215, 0.5)'
}
```

## Complete Example

Here is a comprehensive configuration example:

```javascript
const config = {
  root: document.getElementById("app"),
  theme: "dark",
  zIndexBase: 1000,
  animationDurationMs: 250,

  // Windows
  cascadeOffset: 30,
  maxWindows: 15,
  snapGap: 15,
  defaultWidth: 800,
  defaultHeight: 500,

  // Taskbar
  taskbar: {
    position: "bottom",
    height: 50,
    showClock: true,
  },

  // Icons
  icons: {
    gridSize: 100,
  },
};

const desktop = new Nidam(config);
```
