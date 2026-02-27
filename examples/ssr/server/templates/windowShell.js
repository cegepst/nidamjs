export function renderWindowShell({ title, content, defaultSnap = true }) {
    return `
  <div nd-window class="window">
    <div nd-window-header data-bar>
      <span>${title}</span>
      <button nd-window-button data-maximize title="Maximize">[ ]</button>
      <button nd-window-button data-close title="Close">X</button>
    </div>
    <div nd-window-content>
        ${content}
    </div>
  </div>`;
}
