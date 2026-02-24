export function renderHomePage() {
    return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>NidamJS Demo</title>
    <link rel="stylesheet" href="/dist/nidam.css" />
    <link rel="stylesheet" href="/examples/shared/demo.css" />
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

      <section nd-icons="5:3">
        <div nd-icon="1:1" nd-id="page-one" data-modal="page-one">
          <img src="examples/shared/images/icons/algo-icon.png">
          <span>Page One</span>
        </div>

        <div nd-icon="6:2" nd-id="page-two" data-modal="page-two">
          <img src="examples/shared/images/icons/arena-icon.png">
          <span>Page Two</span>
        </div>

        <div nd-icon="2:3" nd-id="mail" data-modal="page-two">
          <img src="examples/shared/images/icons/group-icon.png">
          <span>Mail</span>
        </div>
      </section>

      <footer class="demo-footer">
        Tip: drag windows by the title bar and use close/maximize buttons.
      </footer>

      <div class="demo-target" data-pending-modal="" id="target"></div>

      <div nd-taskbar>
        <button nd-taskbar-icon class="toolbar-btn" data-modal="examples/shared/page-one.html">Page One</button>
        <button nd-taskbar-icon class="toolbar-btn" data-modal="examples/shared/page-two.html">Page Two</button>
        <button nd-taskbar-icon class="toolbar-btn">Nothing</button>
      </div>
    </div>

    <script type="module" src="/demo/client.js"></script>
  </body>
</html>`;
}
