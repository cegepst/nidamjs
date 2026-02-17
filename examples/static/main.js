const app = window.Nidam.createNidamApp({
  modalContainer: "#target",
  windowManager: {
    static: true,
    config: {
      maxWindows: 4,
      taskbarHeight: 0,
      layoutStabilizationMs: 650,
    },
  },
});

app.initialize();
window.__nidamDemo = app;
