export function renderWindowShell({
  title,
  content,
  widthClass = "w-[640px]",
  heightClass = "h-[360px]",
  defaultSnap = null,
}) {
  const snapAttr = defaultSnap ? `data-default-snap="${defaultSnap}"` : "";

  return `
  <div class="window animate-appearance ${widthClass} ${heightClass} max-w-[95vw] max-h-[88vh] border border-slate-600/70 bg-slate-900 shadow-2xl overflow-hidden rounded-2xl" ${snapAttr}>
    <div data-bar class="h-11 px-3 flex items-center justify-between bg-slate-800/90 text-slate-100 border-b border-slate-700/80">
      <strong class="font-semibold tracking-wide">${title}</strong>
      <div class="window-actions flex items-center gap-2">
        <button data-maximize class="mini-btn" title="Maximize"><i class="not-italic">[]</i></button>
        <button data-close class="mini-btn" title="Close"><i class="not-italic">x</i></button>
      </div>
    </div>
    <div class="window-content-scrollable h-[calc(100%-44px)] overflow-auto bg-slate-900/90 p-4">
      <div class="space-y-3 text-slate-100 text-sm leading-relaxed">${content}</div>
    </div>
  </div>`;
}
