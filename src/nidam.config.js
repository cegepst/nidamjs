/**
 * @typedef {Object} NidamConfig
 * @property {Document|HTMLElement} [root] - The root element to attach event delegation (default: document)
 * @property {string} [modalContainer] - Selection string for the modal container (default: "#target")
 * @property {string} [pendingModalDatasetKey] - Dataset key for pending modals (default: "pendingModal")
 * @property {Array<any>} [registry] - Content registry array (default: [])
 * @property {Record<string, string[]>|null} [refreshMap] - Map of refreshing rules (default: null)
 * @property {number} [refreshTimeout] - Timeout in ms for refreshing windows (default: 200)
 * @property {Function} [notify] - Custom notification logger (default: defaultNotify)
 * @property {Object} [windowManager] - Configuration for WindowManager (default: {})
 * @property {Object} [ui] - UI Configuration (default: { theme: "light", taskbar_size: "medium" })
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
    windowManager: {},
    ui: {
        theme: "light",
        taskbar_size: "medium",
    }
};
