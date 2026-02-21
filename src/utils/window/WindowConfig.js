/**
 * Default configuration for the Window System.
 * Defines base styling, timing, and behavior constraints.
 */
const config = {
  /** @type {number} Base z-index for the windowing system */
  zIndexBase: 40,
  
  /** @type {number} Duration in ms to wait for the layout to stabilize after rendering */
  layoutStabilizationMs: 450,
  
  /** @type {number} Offset in pixels for cascading new windows */
  cascadeOffset: 30,
  
  /** @type {number} Min time in ms between opening the same window endpoint */
  cooldownMs: 500,
  
  /** @type {number} Maximum number of concurrent open windows */
  maxWindows: 10,
  
  /** @type {number} Gap in pixels between tiled/snapped windows */
  snapGap: 6,
  
  /** @type {number} Height of the taskbar to exclude from window workspace */
  taskbarHeight: 64,
  
  /** @type {number} Edge distance in pixels to trigger a snap zone */
  snapThreshold: 30,
  
  /** @type {number} Mouse travel distance in pixels before considering a drag has started */
  dragThreshold: 10,
  
  /** @type {number} ms to debounce the window resize calculation */
  resizeDebounceMs: 6,
  
  /** @type {number} Duration of CSS animations in ms */
  animationDurationMs: 400,
  
  /** @type {number} Default width in pixels if not specified */
  defaultWidth: 800,
  
  /** @type {number} Default height in pixels if not specified */
  defaultHeight: 600,
  
  /** @type {number} Minimum margin between window and viewport edges */
  minMargin: 10,
  
  /** @type {number} Ratio of the viewport edges that detect side-snaps */
  edgeDetectionRatio: 0.4,
  
  /** @type {number} Max time in ms to wait for scroll restoration after content load */
  scrollRestoreTimeoutMs: 2000,
};

export { config };
export default config;
