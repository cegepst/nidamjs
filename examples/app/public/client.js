import { createNidamApp } from "/lib/index.js";

const app = createNidamApp({
  modalContainer: "#target",
  windowManager: {
    config: {
      maxWindows: 4,
      taskbarHeight: 0,
    },
    notify: (level, message) => {
      if (level === "error") console.error(message);
    },
  },
});

app.initialize();

window.__nidamDemo = app;
