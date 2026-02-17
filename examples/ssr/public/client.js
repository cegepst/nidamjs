import { createNidamApp } from "/dist/nidam.es.js";

const app = createNidamApp({
  modalContainer: "#target",
  windowManager: {
    config: {
      maxWindows: 4,
      taskbarHeight: 0,
      layoutStabilizationMs: 650,
    },
  },
});

app.initialize();

window.__nidamDemo = app;
