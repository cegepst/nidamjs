import BaseManager from "../../core/BaseManager.js";

/**
 * TaskbarManager handles taskbar icons states including:
 * - Indicating which windows are open
 * - Focusing windows when icons are clicked
 */
export default class TaskbarManager extends BaseManager {
  _windowManager = null;

  constructor(container, delegator, options = {}) {
    super(container, delegator);
    this._windowManager = options.windowManager || null;
    this._syncWithWindowManager();
  }

  _syncWithWindowManager() {
    if (!this._windowManager || !this._windowManager._windows) return;
    this._windowManager._windows.forEach((win, endpoint) => {
      this._updateIconState(endpoint, true);
    });
  }

  _bindEvents() {
    this._on("click", "[nd-taskbar-icon]", this._handleIconClick.bind(this));

    // Listen for window events to update icon states
    document.addEventListener("window:opened", (e) => {
      const customEvent = /** @type {CustomEvent<{ endpoint: string }>} */ (e);
      this._updateIconState(customEvent.detail.endpoint, true);
    });

    document.addEventListener("window:closed", (e) => {
      const customEvent = /** @type {CustomEvent<{ endpoint: string }>} */ (e);
      this._updateIconState(customEvent.detail.endpoint, false);
    });
  }

  _handleIconClick(e, target) {
    const endpoint = target.dataset.modal;
    if (!endpoint) return;

    if (this._windowManager) {
      this._windowManager.open(endpoint).catch((err) => {
        if (err?.message !== "MAX_WINDOWS_REACHED") {
          console.error("Taskbar icon trigger failed:", err);
        }
      });
    }
  }

  /**
   * Update the visual state of a taskbar icon
   * @param {string} endpoint - The window endpoint
   * @param {boolean} isOpen - Whether the window is open
   */
  _updateIconState(endpoint, isOpen) {
    const icons = this._queryAll(`[nd-taskbar-icon][data-modal="${endpoint}"]`);
    icons.forEach((icon) => {
      if (isOpen) {
        icon.classList.add("is-open");
      } else {
        // Only remove if no other window with same endpoint is open
        // (Though usually there's only one window per endpoint)
        icon.classList.remove("is-open");
      }
    });
  }
}
