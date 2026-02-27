export function renderWindowShell({ title, content, endpoint }) {
    return `
  <div nd-window class="window" data-endpoint="${endpoint}">
    <div nd-window-header data-bar>
      <span>${title}</span>
      <button nd-window-button="maximize" data-maximize title="Maximize">[ ]</button>
      <button nd-window-button="close" data-close title="Close">X</button>
    </div>
    <div nd-window-content>
        ${content}
    </div>
  </div>`;
}
