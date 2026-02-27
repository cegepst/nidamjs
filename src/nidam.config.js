import { toastNotify } from "./utils/toast.js";

/**
 * @typedef {Object} NidamNotifyConfig
 * @property {number} [duration] - Auto-dismiss timeout in ms. Use <= 0 to disable.
 * @property {boolean} [closable] - Whether to render the close button.
 * @property {"top-right"|"top-left"|"bottom-right"|"bottom-left"} [position] - Toast stack position.
 */

/**
 * @typedef {Object} NidamConfig
 * @property {Document|HTMLElement} [root] - The root element to attach event delegation (default: document)
 * @property {string} [modalContainer] - Selection string for the modal container (default: "#target")
 * @property {string} [pendingModalDatasetKey] - Dataset key for pending modals (default: "pendingModal")
 * @property {Array<any>} [registry] - Content registry array (default: [])
 * @property {Record<string, string[]>|null} [refreshMap] - Map of refreshing rules (default: null)
 * @property {number} [refreshTimeout] - Timeout in ms for refreshing windows (default: 200)
 * @property {((level: string, message: unknown) => void) | NidamNotifyConfig} [notify] - Notification callback or toast options object (default: toastNotify)
 * @property {Object} [windowManager] - Configuration for WindowManager (default: {})
 */

/** @type {NidamConfig} */
export default {
  root: typeof document !== "undefined" ? document : null,
  modalContainer: "#target",
  pendingModalDatasetKey: "pendingModal",
  registry: [],
  refreshMap: null,
  refreshTimeout: 200,
  notify: toastNotify,
  windowManager: {},
};
