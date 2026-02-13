---
icon: code
order: 20
---

# Code Snippets

Here are some common patterns and useful snippets to help you build your desktop environment.

## Hello World Window

A simple window with text content.

```javascript
desktop.windows.create({
  title: "Hello World",
  width: 300,
  height: 200,
  content: `
        <div style="display: flex; justify-content: center; align-items: center; height: 100%;">
            <h2>👋 Hello!</h2>
        </div>
    `,
  center: true,
});
```

## Notepad App

A basic text editor window.

```javascript
const notepad = desktop.windows.create({
  title: "Notepad",
  width: 500,
  height: 400,
  icon: "/icons/notepad.png",
});

// Create textarea
const textarea = document.createElement("textarea");
textarea.style.width = "100%";
textarea.style.height = "100%";
textarea.style.border = "none";
textarea.style.resize = "none";
textarea.style.outline = "none";
textarea.style.padding = "10px";

// Append to window body
notepad.bodyElement.appendChild(textarea);
```

## Clock Widget

Add a live clock to the desktop background (not a window).

```javascript
const clockEl = document.createElement("div");
clockEl.style.position = "absolute";
clockEl.style.top = "20px";
clockEl.style.right = "20px";
clockEl.style.color = "white";
clockEl.style.fontSize = "48px";
clockEl.style.textShadow = "0 2px 4px rgba(0,0,0,0.5)";
clockEl.style.zIndex = "0"; // Behind windows

desktop.root.appendChild(clockEl);

setInterval(() => {
  const now = new Date();
  clockEl.textContent = now.toLocaleTimeString();
}, 1000);
```

## Fetch Data Window

Load data from an API and display it in a window.

```javascript
const userWin = desktop.windows.create({
  title: "User List",
  width: 400,
  height: 500,
});

userWin.bodyElement.innerHTML = "<p>Loading...</p>";

fetch("https://jsonplaceholder.typicode.com/users")
  .then((res) => res.json())
  .then((users) => {
    const list = document.createElement("ul");
    users.forEach((user) => {
      const li = document.createElement("li");
      li.textContent = user.name;
      list.appendChild(li);
    });
    userWin.bodyElement.innerHTML = "";
    userWin.bodyElement.appendChild(list);
  })
  .catch((err) => {
    userWin.bodyElement.innerHTML = `<p style="color:red">Error loading users.</p>`;
  });
```

## Custom Context Menu

Override the default right-click menu on the desktop.

```javascript
desktop.on("contextmenu", (e) => {
  e.preventDefault(); // Stop browser menu

  const menu = desktop.createContextMenu({
    x: e.clientX,
    y: e.clientY,
    items: [
      { label: "Refresh", action: () => location.reload() },
      { type: "separator" },
      { label: "New Folder", action: () => createNewFolder() },
      { label: "Properties", action: () => showProperties() },
    ],
  });
});
```

## Theme Switcher

Toggle between light and dark themes programmatically.

```javascript
let isDark = true;

function toggleTheme() {
  isDark = !isDark;
  desktop.setTheme(isDark ? "dark" : "light");

  // Optional: Change wallpaper based on theme
  desktop.setBackground(
    isDark ? "/wallpapers/night.jpg" : "/wallpapers/day.jpg",
  );
}

// Add a button to the taskbar tray
desktop.taskbar.addItem({
  id: "theme-toggle",
  icon: "/icons/theme.png",
  onClick: toggleTheme,
});
```
