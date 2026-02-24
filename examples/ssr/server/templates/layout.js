export function renderHomePage() {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>NidamJS Demo</title>
    <link rel="stylesheet" href="/dist/nidam.css" />
    <link rel="stylesheet" href="/examples/shared/demo.css" />
    <script type="module" src="/dist/nidam.es.js"></script>
  </head>

  <body>
    <div nd-desktop class="demo-root">
      <div class="demo-bg"></div>

      <header class="demo-header">
        <h1 class="demo-title">NidamJS Minimal Demo</h1>
        <p class="demo-subtitle">
          Two live routes opened as windows from one page.
        </p>
      </header>

      <section class="demo-actions">
        <button class="toolbar-btn" data-modal="examples/shared/page-one.html">
          Open Page One
        </button>
        <button class="toolbar-btn" data-modal="examples/shared/page-two.html">
          Open Page Two
        </button>
      </section>

      <footer class="demo-footer">
        Tip: drag windows by the title bar and use close/maximize buttons.
      </footer>

      <div class="demo-target" data-pending-modal="" id="target"></div>

      <div nd-taskbar>
        <button tb-icon class="toolbar-btn" data-modal="examples/shared/page-one.html">Page One</button>
        <button tb-icon class="toolbar-btn" data-modal="examples/shared/page-two.html">Page Two</button>
        <button tb-icon class="toolbar-btn">Nothing</button>
      </div>
    </div>
  </body>
</html>`;
}
