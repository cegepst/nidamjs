import BaseManager from "../../core/BaseManager.js";
import WindowState from "../../utils/window/WindowState.js";
import { config as defaultConfig } from "../../utils/window/WindowConfig.js";
import WindowLifecycle from "../../utils/window/WindowLifecycle.js";
import WindowDrag from "../../utils/window/WindowDrag.js";
import WindowTiling from "../../utils/window/WindowTiling.js";
import WindowLoader from "../../utils/window/WindowLoader.js";

/**
 * WindowManager is the main orchestrator for the window system.
 * It manages the lifecycle, dragging, and tiling services.
 */
export default class WindowManager extends BaseManager {
  _config = { ...defaultConfig };
  _windows = new Map();
  _zIndexCounter = this._config.zIndexBase;
  _getModules = null;
  _notify = null;
  _fetchWindowContent = null;
  _initializeContent = null;
  _resolveEndpoint = null;
  _static = false;
  _lastOpenTimestamps = new Map();
  _pendingRequests = new Map();
  _snapIndicator = null;
  _dragState = { active: false };

  /**
   * @param {HTMLElement|string} container - Root element or selector.
   * @param {EventDelegator} delegator - Global event delegator.
   * @param {Object} options - Custom configuration and overrides.
   */
  constructor(container, delegator, options = {}) {
    super(container, delegator);
    const {
      getModules = null,
      config = null,
      notify = null,
      fetchWindowContent = null,
      initializeContent = null,
      resolveEndpoint = null,
      static: staticRendering = false,
    } = options || {};

    this._getModules = getModules;
    this._notify = notify || this._defaultNotify.bind(this);
    this._initializeContent = initializeContent || (() => {});
    this._resolveEndpoint = resolveEndpoint;
    this._static = Boolean(staticRendering);

    // If a custom fetcher is provided, use it; otherwise, wrap the WindowLoader.
    this._fetchWindowContent = fetchWindowContent || ((endpoint, opts) => {
      return WindowLoader.load(endpoint, opts, {
        isStatic: this._static,
        resolveEndpoint: this._resolveEndpoint
      });
    });

    if (config && typeof config === "object") {
      this._config = { ...this._config, ...config };
    }
    this._zIndexCounter = this._config.zIndexBase;

    this._initSnapIndicator();
  }

  /**
   * Initializes the visual indicator for window snapping.
   */
  _initSnapIndicator() {
    this._snapIndicator = document.createElement("div");
    this._snapIndicator.className = "snap-indicator";
    document.body.appendChild(this._snapIndicator);
  }

  /**
   * Binds global and scoped events using the delegator.
   */
  _bindEvents() {
    this._delegator.on("click", "[data-modal]", (e, target) => {
      e.preventDefault();
      this.open(target.dataset.modal);
    });

    this._delegator.on("click", "[data-maximize]", (e, target) => {
      e.preventDefault();
      const winElement = target.closest(".window");
      if (winElement) this.toggleMaximize(winElement);
    });

    this._delegator.on("click", "[data-close]", (e, target) => {
      e.preventDefault();
      const winElement = target.closest(".window");
      if (winElement) this.close(winElement);
    });

    this._delegator.on("mousedown", ".window", (e, target) => {
      if (e.target.closest("[data-close]") || e.target.closest("[data-modal]")) return;
      const winElement = target.closest(".window");
      if (winElement) this.focus(winElement);
    });

    this._delegator.on("mousedown", "[data-bar]", (e, target) => {
      if (e.target.closest("[data-close]") || e.target.closest("[data-maximize]")) return;
      e.preventDefault();
      const winElement = target.closest(".window");
      if (winElement) {
        this.focus(winElement);
        this.drag(e, winElement);
      }
    });

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && !e.repeat) {
        WindowLifecycle.closeTopmostWindow(this._windows);
      }
    });

    let resizeTimer;
    window.addEventListener("resize", () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        WindowTiling.handleResize(this._windows, this._config, {
          repositionFromRatios: (win, vw, vh) => WindowState.repositionWindowFromRatios(win, vw, vh)
        });
      }, this._config.resizeDebounceMs);
    });
  }

  /**
   * Builds the shared context object for Lifecycle operations.
   * @private
   */
  _getLifecycleContext() {
    return {
      root: this._root,
      windows: this._windows,
      config: this._config,
      zIndexCounter: this._zIndexCounter,
      pendingRequests: this._pendingRequests,
      lastOpenTimestamps: this._lastOpenTimestamps,
      notify: this._notify,
      fetchWindowContent: this._fetchWindowContent,
      callbacks: {
        initializeContent: (root) => this._initializeModalContent(root),
        saveWindowState: (el, key, opts) => WindowState.save(el, key, opts),
        readWindowState: (el, key) => WindowState.read(el, key),
        applyWindowState: (el, state, opts) => WindowState.apply(el, state, opts)
      }
    };
  }

  /**
   * Public API to open a window.
   */
  open(endpoint, force = false, focusSelector = null, activate = true) {
    return WindowLifecycle.open(endpoint, { force, focusSelector, activate }, this._getLifecycleContext());
  }

  /**
   * Public API to close a window.
   */
  close(winElement) {
    return WindowLifecycle.close(winElement, this._windows);
  }

  /**
   * Returns a list of current open windows.
   * @returns {Array<[string, HTMLElement]>}
   */
  getWindows() {
    return Array.from(this._windows.entries());
  }

  /**
   * Brings a window to the front.
   */
  focus(winElement) {
    const ctx = this._getLifecycleContext();
    WindowLifecycle.focusWindow(winElement, ctx);
    this._zIndexCounter = ctx.zIndexCounter;
  }
  
  /**
   * Starts a drag operation.
   */
  drag(e, winElement) {
    const callbacks = {
      onRestore: (win, ratio, isMaximized) => WindowTiling.restoreWindowInternal(win, ratio, this._config, {
        onUpdateMaximizeIcon: (w, isMax) => WindowLifecycle.updateMaximizeIcon(w, isMax),
        onSavePositionRatios: (w) => WindowState.savePositionRatios(w)
      }),
      onUpdateMaximizeIcon: (win, isMax) => WindowLifecycle.updateMaximizeIcon(win, isMax),
      detectSnapZone: (x, y, view) => WindowTiling.detectSnapZone(this._config, x, y, view),
      updateSnapIndicator: (snap, view) => this._updateSnapIndicator(snap, view),
      onMaximize: (win) => this.toggleMaximize(win),
      onSnap: (win, snap, view) => WindowTiling.snapWindow(win, snap, this._config, view),
      onSaveState: (win) => WindowState.savePositionRatios(win)
    };

    return WindowDrag.drag(e, winElement, this._config, this._dragState, callbacks);
  }

  /**
   * Visual update for the snap indicator element.
   * @private
   */
  _updateSnapIndicator(type, view) {
    if (!this._snapIndicator) return;
    if (!type) {
      this._snapIndicator.classList.remove("visible");
      return;
    }
    let layout;
    if (type === "maximize") {
      layout = { top: "0px", left: "0px", width: `${view.w}px`, height: `${view.h}px` };
    } else {
      layout = WindowTiling.getSnapLayout(type, this._config, view.w, view.h);
    }
    Object.assign(this._snapIndicator.style, layout);
    this._snapIndicator.classList.add("visible");
  }

  /**
   * Public API to maximize or restore a window.
   */
  toggleMaximize(winElement) {
    return WindowLifecycle.toggleMaximize(winElement, this._getLifecycleContext());
  }

  /**
   * Default notification handler.
   */
  _defaultNotify(level, message) {
    const logger = level === "error" ? console.error : console.log;
    logger(`[nidamjs:${level}]`, message);
  }

  /**
   * Initializes content within a window using modules and custom logic.
   */
  _initializeModalContent(root) {
    const modules = this._getModules ? this._getModules() : null;
    this._initializeContent(root, {
      delegator: this._delegator,
      modules: modules,
      manager: this,
    });
  }
}
