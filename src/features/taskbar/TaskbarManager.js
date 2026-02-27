import BaseManager from "../../core/BaseManager.js";

/**
 * TaskbarManager handles taskbar icons states including:
 * - Indicating which windows are open
 * - Focusing windows when icons are clicked
 */
export default class TaskbarManager extends BaseManager {
  _windowManager = null;
  _toastOffsetCssVars = {
    top: "--nd-toast-top-offset",
    right: "--nd-toast-right-offset",
    bottom: "--nd-toast-bottom-offset",
    left: "--nd-toast-left-offset",
  };
  _toastOffsetObserver = null;
  _windowResizeHandler = null;

  constructor(container, delegator, options = {}) {
    super(container, delegator);
    this._windowManager = options.windowManager || null;
    this._syncWithWindowManager();
    this._syncToastViewportOffsets();
    this._observeToastViewportOffsets();
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

  _observeToastViewportOffsets() {
    this._windowResizeHandler = () => this._syncToastViewportOffsets();
    window.addEventListener("resize", this._windowResizeHandler);

    if (typeof ResizeObserver === "undefined") return;

    this._toastOffsetObserver = new ResizeObserver(() =>
      this._syncToastViewportOffsets(),
    );
    this._toastOffsetObserver.observe(this._root);
  }

  _setToastViewportOffsets(offsets) {
    const style = document?.documentElement?.style;
    if (!style) return;

    style.setProperty(this._toastOffsetCssVars.top, `${offsets.top}px`);
    style.setProperty(this._toastOffsetCssVars.right, `${offsets.right}px`);
    style.setProperty(this._toastOffsetCssVars.bottom, `${offsets.bottom}px`);
    style.setProperty(this._toastOffsetCssVars.left, `${offsets.left}px`);
  }

  _syncToastViewportOffsets() {
    const offsets = {
      top: 0,
      right: 0,
      bottom: 0,
      left: 0,
    };

    const rect = this._root.getBoundingClientRect();
    if (!rect) {
      this._setToastViewportOffsets(offsets);
      return;
    }

    const isExtendedTaskbar =
      this._root.getAttribute("nd-taskbar") === "extend";
    const position = this._root.getAttribute("nd-taskbar-position") || "bottom";
    const viewportWidth =
      window.innerWidth || document.documentElement.clientWidth;
    const edgeTolerance = 2;

    if (isExtendedTaskbar || position === "bottom") {
      offsets.bottom = Math.ceil(rect.height || 0);
    } else if (position === "left" && rect.left <= edgeTolerance) {
      offsets.left = Math.ceil(rect.width || 0);
    } else if (
      position === "right" &&
      rect.right >= viewportWidth - edgeTolerance
    ) {
      offsets.right = Math.ceil(rect.width || 0);
    }

    this._setToastViewportOffsets(offsets);
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
