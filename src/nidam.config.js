/**
 * @typedef {Object} WindowManagerConfig
 * @property {number} [zIndexBase] - Base z-index for the windowing system (default: 40)
 * @property {number} [layoutStabilizationMs] - Duration in ms to wait for the layout to stabilize after rendering (default: 450)
 * @property {number} [cascadeOffset] - Offset in pixels for cascading new windows (default: 30)
 * @property {number} [cooldownMs] - Min time in ms between opening the same window endpoint (default: 500)
 * @property {number} [maxWindows] - Maximum number of concurrent open windows (default: 10)
 * @property {number} [snapGap] - Gap in pixels between tiled/snapped windows (default: 6)
 * @property {number} [taskbarHeight] - Height of the taskbar to exclude from window workspace (default: 64)
 * @property {number} [snapThreshold] - Edge distance in pixels to trigger a snap zone (default: 30)
 * @property {number} [dragThreshold] - Mouse travel distance in pixels before considering a drag has started (default: 10)
 * @property {number} [resizeDebounceMs] - ms to debounce the window resize calculation (default: 6)
 * @property {number} [animationDurationMs] - Duration of CSS animations in ms (default: 400)
 * @property {number} [defaultWidth] - Default width in pixels if not specified (default: 800)
 * @property {number} [defaultHeight] - Default height in pixels if not specified (default: 600)
 * @property {number} [minMargin] - Minimum margin between window and viewport edges (default: 10)
 * @property {number} [edgeDetectionRatio] - Ratio of the viewport edges that detect side-snaps (default: 0.4)
 * @property {number} [scrollRestoreTimeoutMs] - Max time in ms to wait for scroll restoration after content load (default: 2000)
 */

/**
 * @typedef {Object} NidamConfig
 * @property {Document|HTMLElement} [root] - The root element to attach event delegation (default: document)
 * @property {string} [modalContainer] - Selection string for the modal container (default: "#target")
 * @property {string} [pendingModalDatasetKey] - Dataset key for pending modals (default: "pendingModal")
 * @property {Array<any>} [registry] - Content registry array (default: [])
 * @property {Record<string, string[]>|null} [refreshMap] - Map of refreshing rules (default: null)
 * @property {number} [refreshTimeout] - Timeout in ms for refreshing windows (default: 200)
 * @property {Function} [notify] - Custom notification logger (default: defaultNotify)
 * @property {WindowManagerConfig} [windowManager] - Configuration for WindowManager (default: {})
 */

export const defaultNotify = (level, message) => {
    const logger = level === "error" ? console.error : console.log;
    logger(`[nidamjs:${level}]`, message);
};

/** @type {NidamConfig} */
export default {
    root: typeof document !== "undefined" ? document : null,
    modalContainer: "#target",
    pendingModalDatasetKey: "pendingModal",
    registry: [],
    refreshMap: null,
    refreshTimeout: 200,
    notify: defaultNotify,
    windowManager: {
        zIndexBase: 40,
        layoutStabilizationMs: 450,
        cascadeOffset: 30,
        cooldownMs: 500,
        maxWindows: 10,
        snapGap: 6,
        taskbarHeight: 64,
        snapThreshold: 30,
        dragThreshold: 10,
        resizeDebounceMs: 6,
        animationDurationMs: 400,
        defaultWidth: 800,
        defaultHeight: 600,
        minMargin: 10,
        edgeDetectionRatio: 0.4,
        scrollRestoreTimeoutMs: 2000,
    }
};
