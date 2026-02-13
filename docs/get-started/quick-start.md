---
icon: rocket
---

# Quick Start

Get your first NidamJS desktop environment running in minutes.


## Basic Usage
### 1. Add the container

Create an HTML file and add a container element where the desktop environment will be rendered. Usually, this is the `<body>` tag, but you can restrict it to a specific `div`.

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>NidamJS Desktop</title>
    <!-- Optional: Include default styles if not using a bundler -->
    <link rel="stylesheet" href="node_modules/nidamjs/dist/style.css">
</head>
<body>
    <div id="desktop-root" style="width: 100vw; height: 100vh; overflow: hidden;"></div>
    <script type="module" src="/src/main.js"></script>
</body>
</html>
```

### 2. Initialize the Desktop

Import `createDesktop` from the library and initialize it pointing to your root element.

```javascript
import { createDesktop } from 'nidamjs';

// Initialize the main desktop environment
const desktop = createDesktop({
    root: document.getElementById('desktop-root'),
    theme: 'light', // or 'dark'
    backgroundImage: '/assets/wallpaper.jpg'
});
```

### 3. Open a Window

Now you can programmatically open windows.

```javascript
// Create a basic window
desktop.windows.create({
    id: 'welcome-window',
    title: 'Welcome',
    content: `
        <div style="padding: 20px;">
            <h1>Hello World!</h1>
            <p>This is my first NidamJS window.</p>
        </div>
    `,
    width: 400,
    height: 300,
    center: true
});
```

## CDN Usage

For quick prototyping without a build step, you can use the CDN version.

```html
<script src="https://unpkg.com/nidamjs@latest/dist/nidam.min.js"></script>
<script>
    const desktop = Nidam.createDesktop({ root: document.body });
</script>
```
