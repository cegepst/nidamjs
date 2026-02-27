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

      <div class="demo-target" data-pending-modal="" id="target"></div>

      <div nd-taskbar>
        <button nd-taskbar-icon class="toolbar-btn" data-modal="examples/shared/page-one.html">Page One</button>
        <button nd-taskbar-icon class="toolbar-btn" data-modal="examples/shared/page-two.html">Page Two</button>
      </div>
    </div>
  </body>
</html>`;
}
