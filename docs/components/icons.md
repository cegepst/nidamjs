---
icon: file
---

# Icons

Icons are the primary interactive elements on the desktop surface. They represent applications, files, shortcuts, or
system actions. NidamJS provides a grid-based icon system with support for drag-and-drop, selection, and execution.

## Defining Icons

You can define the initial set of desktop icons during initialization or add them dynamically later.

### Initialization

Pass an array of icon objects to the `icons` configuration property.

```javascript
const desktop = new Nidam({
  icons: [
    {
      label: "My PC",
      icon: "/assets/icons/computer.png",
      action: () => openMyPC(),
    },
    {
      label: "Recycle Bin",
      icon: "/assets/icons/trash.png",
      action: () => openTrash(),
    },
  ],
});
```

### Dynamic Addition

You can add icons at runtime using the `icons` manager.

```javascript
desktop.icons.add({
  id: "new-folder",
  label: "New Folder",
  icon: "/assets/icons/folder.png",
  x: 0,
  y: 0,
});
```

## Icon Properties

Each icon object defines its appearance and behavior.

| Property      | Type       | Description                                   |
| :------------ | :--------- | :-------------------------------------------- |
| `id`          | `string`   | Unique identifier. Auto-generated if omitted. |
| `label`       | `string`   | Text displayed below the icon.                |
| `icon`        | `string`   | URL to the image file.                        |
| `action`      | `function` | Callback function executed on double-click.   |
| `x`           | `number`   | Grid column index (optional).                 |
| `y`           | `number`   | Grid row index (optional).                    |
| `contextMenu` | `array`    | Custom context menu items for this icon.      |

## Layout and Grid

Icons are automatically snapped to a grid to keep the desktop organized.

### Auto-Arrangement

By default, icons are arranged vertically starting from the top-left corner. When an icon is moved, it snaps to the
nearest available grid cell.

### Grid Configuration

You can customize the grid size in the main configuration.

```javascript
{
    icons: {
        gridSize: 96, // Size of each cell in pixels
        layout: 'vertical', // 'vertical' or 'horizontal'
        spacing: 10
    }
}
```

## Interaction

### Selection

- **Single Click**: Selects the icon.
- **Ctrl/Cmd + Click**: Toggles selection of multiple icons.
- **Drag Selection**: Click and drag on the desktop to select multiple icons with a selection box.

### Drag and Drop

Icons can be dragged around the desktop.

- If dropped on an empty space, they move to that grid position.
- If dropped on another icon (like a folder), a custom event is emitted which you can handle.

### Execution

Double-clicking an icon triggers its `action`.

```javascript
{
    label: 'GitHub',
    icon: 'github.png',
    action: () => window.open('https://github.com', '_blank')
}
```

## Styling

Icons are rendered as HTML elements and can be styled using CSS.

```css
/* Container for the icon and label */
.nidam-icon {
  width: 80px;
  height: 80px;
  display: flex;
  flex-direction: column;
  align-items: center;
}

/* The image element */
.nidam-icon img {
  width: 48px;
  height: 48px;
}

/* The text label */
.nidam-icon span {
  color: white;
  text-shadow: 1px 1px 2px black;
  margin-top: 5px;
}

/* Selected state */
.nidam-icon.selected {
  background-color: rgba(255, 255, 255, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.4);
  border-radius: 4px;
}
```
