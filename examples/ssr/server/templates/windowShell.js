export function renderWindowShell({ title, content, defaultSnap = true }) {
    const snapAttr = defaultSnap ? "data-default-snap" : "";

    return `
  <div nd-window class="window" ${snapAttr}>
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
