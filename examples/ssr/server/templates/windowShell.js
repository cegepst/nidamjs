export function renderWindowShell({ title, content }) {
  return `
  <div nd-window>
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
