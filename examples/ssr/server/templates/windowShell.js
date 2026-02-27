export function renderWindowShell({ title, content, endpoint }) {
    return `
  <div nd-window data-endpoint="${endpoint}">
    <div nd-window-header>
      <span>${title}</span>
      <button nd-window-button="maximize" title="Maximize">[ ]</button>
      <button nd-window-button="close" title="Close">X</button>
    </div>
    <div nd-window-content>
        ${content}
    </div>
  </div>`;
}
