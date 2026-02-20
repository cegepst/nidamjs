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
    <div class="demo-root">
      <div class="demo-bg"></div>

      <header class="demo-header">
        <h1 class="demo-title">NidamJS Minimal Demo</h1>
        <p class="demo-subtitle">Two live routes opened as windows from one page.</p>
      </header>

      <section class="demo-actions">
        <button data-modal="page-one" class="toolbar-btn">Open Page One</button>
        <button data-modal="page-two" class="toolbar-btn">Open Page Two</button>
      </section>

      <section nd-icons>
        <div nd-icon="1:1">
          <img src="examples/shared/images/icons/algo-icon.png">
          <span>Page One</span>
        </div>

        <div nd-icon="3:2">
          <img src="examples/shared/images/icons/arena-icon.png">
          <span>Page Two</span>
        </div>

        <div nd-icon="2:3">
          <img src="examples/shared/images/icons/group-icon.png">
          <span>Mail</span>
        </div>
      </section>

      <footer class="demo-footer">
        Tip: drag windows by the title bar and use close/maximize buttons.
      </footer>

      <div id="target" data-pending-modal="" class="demo-target"></div>
    </div>
  </body>
</html>`;
}
