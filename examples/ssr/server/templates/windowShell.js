export function renderWindowShell({ title, content, endpoint, defaultSnap = true }) {
  const snapAttr = defaultSnap ? "data-default-snap" : "";

  return `
  <div class="window window-shell animate-appearance" data-endpoint="${endpoint}" ${snapAttr}>
    <div data-bar class="window-bar">
      <strong class="window-title">${title}</strong>
      <div class="window-actions">
        <button data-maximize class="mini-btn" title="Maximize"><i class="not-italic">[]</i></button>
        <button data-close class="mini-btn" title="Close"><i class="not-italic">x</i></button>
      </div>
    </div>
    <div class="window-content-scrollable window-content-shell">
      <div class="window-content">${content}</div>
    </div>
  </div>`;
}
