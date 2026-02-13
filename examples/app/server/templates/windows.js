import { renderWindowShell } from "./windowShell.js";

export function renderPageOneWindow() {
  return renderWindowShell({
    title: "Page One",
    content: `
      <p>This window is served by <code class="text-cyan-300">GET /page-one</code>.</p>
      <p>
        Click a button with <code class="text-cyan-300">data-modal="page-one"</code> to open it.
      </p>
      <button data-modal="page-two" class="toolbar-btn">Open Page Two</button>
    `,
  });
}

export function renderPageTwoWindow() {
  return renderWindowShell({
    title: "Page Two",
    content: `
      <p>This second route proves the same app can open multiple independent window pages.</p>
      <button data-modal="page-one" class="toolbar-btn">Back To Page One</button>
    `,
  });
}
