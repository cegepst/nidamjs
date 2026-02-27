import BaseManager from "../../core/BaseManager.js";
import WindowState from "../../utils/window/WindowState.js";
import nidamConfig from "../../nidam.config.js";
import WindowLifecycle from "../../utils/window/WindowLifecycle.js";
import WindowDrag from "../../utils/window/WindowDrag.js";
import WindowTiling from "../../utils/window/WindowTiling.js";
import WindowLoader from "../../utils/window/WindowLoader.js";

export default class WindowManager extends BaseManager {
  _config = { ...nidamConfig.windowManager };
  _windows = new Map();
  _zIndexCounter = this._config.zIndexBase;
  _getModules = null;
  _fetchWindowContent = null;
  _initializeContent = null;
  _resolveEndpoint = null;
  _static = false;
  _lastOpenTimestamps = new Map();
  _pendingRequests = new Map();
  _snapIndicator = null;
  _dragState = { active: false };

  constructor(container, delegator, options = {}) {
    super(container, delegator);
    const {
      getModules = null,
      config = null,
      fetchWindowContent = null,
      initializeContent = null,
      resolveEndpoint = null,
      static: staticRendering = false,
    } = options || {};

    this._getModules = getModules;
    this._initializeContent = initializeContent || (() => {});
    this._resolveEndpoint = resolveEndpoint;
    this._static = Boolean(staticRendering);
    this._fetchWindowContent =
      fetchWindowContent ||
      ((endpoint, opts) => {
        return WindowLoader.load(endpoint, opts, {
          isStatic: this._static,
          resolveEndpoint: this._resolveEndpoint,
        });
      });

    if (config && typeof config === "object") {
      this._config = { ...this._config, ...config };
    }
    this._zIndexCounter = this._config.zIndexBase;

    this._initSnapIndicator();
    this._hydrateExistingWindows();
  }

  _hydrateExistingWindows() {
    const existingWins = this._root.querySelectorAll(".window");
    existingWins.forEach((rawWin) => {
      const win = /** @type {HTMLElement} */ (rawWin);
      const endpoint = win.dataset.endpoint || win.dataset.modal;
      if (endpoint && !this._windows.has(endpoint)) {
        if (!win.dataset.endpoint) {
          win.dataset.endpoint = endpoint;
        }
        this._windows.set(endpoint, win);
        this._initializeModalContent(win);

        const z = parseInt(win.style.zIndex || "0", 10);
        if (z > this._zIndexCounter) {
          this._zIndexCounter = z;
        }
      }
    });
  }

  _initSnapIndicator() {
    this._snapIndicator = document.createElement("div");
    this._snapIndicator.className = "snap-indicator";
    document.body.appendChild(this._snapIndicator);
  }

  _bindEvents() {
    this._delegator.on("click", "[data-modal]", (e, target) => {
      if (target.hasAttribute("nd-taskbar-icon")) {
        return;
      }
      e.preventDefault();
      this.open(target.dataset.modal).catch((err) => {
        if (err?.message !== "MAX_WINDOWS_REACHED") {
          console.error("Modal trigger failed:", err);
        }
      });
    });

    this._delegator.on("click", "[data-maximize]", (e, target) => {
      e.preventDefault();
      const winElement = target.closest(".window");
      if (winElement) {
        this.toggleMaximize(winElement);
      }
    });

    this._delegator.on("click", "[data-close]", (e, target) => {
      e.preventDefault();
      const winElement = target.closest(".window");
      if (winElement) {
        this.close(winElement);
      }
    });

    this._delegator.on("mousedown", ".window", (e, target) => {
      if (
        e.target.closest("[data-close]") ||
        e.target.closest("[data-modal]")
      ) {
        return;
      }
      const winElement = target.closest(".window");
      if (winElement) {
        this.focus(winElement);
      }
    });

    this._delegator.on("mousedown", "[data-bar]", (e, target) => {
      if (
        e.target.closest("[data-close]") ||
        e.target.closest("[data-maximize]")
      ) {
        return;
      }
      e.preventDefault();
      const winElement = target.closest(".window");
      if (winElement) {
        this.focus(winElement);
        this.drag(e, winElement);
      }
    });

    this._delegator.on("keydown", null, (e) => {
      if (e.key === "Escape" && !e.repeat) {
        this.closeTopmost();
      }
    });

    let resizeTimer;
    window.addEventListener("resize", () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        WindowTiling.handleResize(this._windows, this._config, {
          repositionFromRatios: (win, vw, vh) =>
            WindowState.repositionWindowFromRatios(win, vw, vh),
        });
      }, this._config.resizeDebounceMs);
    });
  }

  _getLifecycleContext() {
    return {
      root: this._root,
      windows: this._windows,
      config: this._config,
      zIndexCounter: this._zIndexCounter,
      pendingRequests: this._pendingRequests,
      lastOpenTimestamps: this._lastOpenTimestamps,
      fetchWindowContent: this._fetchWindowContent,
      callbacks: {
        initializeContent: (root) => this._initializeModalContent(root),
        saveWindowState: (el, key, opts) => WindowState.save(el, key, opts),
        readWindowState: (el, key) => WindowState.read(el, key),
        applyWindowState: (el, state, opts) =>
          WindowState.apply(el, state, opts),
      },
    };
  }

  async open(endpoint, force = false, focusSelector = null, activate = true) {
    const isAlreadyOpen = this._windows.has(endpoint);
    const win = await WindowLifecycle.open(
      endpoint,
      { force, focusSelector, activate },
      this._getLifecycleContext(),
    );

    if (!isAlreadyOpen) {
      this._root.dispatchEvent(
        new CustomEvent("window:opened", {
          detail: { endpoint },
          bubbles: true,
        }),
      );
    } else if (activate) {
      this._root.dispatchEvent(
        new CustomEvent("window:focused", {
          detail: { endpoint },
          bubbles: true,
        }),
      );
    }

    return win;
  }

  close(winElement) {
    const endpoint = winElement.dataset.endpoint;
    const result = WindowLifecycle.close(winElement, this._windows);

    this._root.dispatchEvent(
      new CustomEvent("window:closed", {
        detail: { endpoint },
        bubbles: true,
      }),
    );

    return result;
  }

  closeTopmost() {
    let topWin = null;
    let maxZ = -1;
    this._windows.forEach((winElement) => {
      if (winElement.classList.contains("animate-disappearance")) {
        return;
      }
      const z = parseInt(winElement.style.zIndex || 0, 10);
      if (z > maxZ) {
        maxZ = z;
        topWin = winElement;
      }
    });
    if (topWin) {
      return this.close(topWin);
    }
    return null;
  }

  getWindows() {
    return Array.from(this._windows.entries());
  }

  focus(winElement) {
    const ctx = this._getLifecycleContext();
    const endpoint = winElement.dataset.endpoint;
    WindowLifecycle.focusWindow(winElement, ctx);
    this._zIndexCounter = ctx.zIndexCounter;

    this._root.dispatchEvent(
      new CustomEvent("window:focused", {
        detail: { endpoint },
        bubbles: true,
      }),
    );
  }

  drag(e, winElement) {
    const callbacks = {
      onRestore: (win, ratio) =>
        WindowTiling.restoreWindowInternal(win, ratio, this._config, {
          onUpdateMaximizeIcon: (w, isMax) =>
            WindowLifecycle.updateMaximizeIcon(w, isMax),
          onSavePositionRatios: (w) => WindowState.savePositionRatios(w),
        }),
      onUpdateMaximizeIcon: (win, isMax) =>
        WindowLifecycle.updateMaximizeIcon(win, isMax),
      detectSnapZone: (x, y, view) =>
        WindowTiling.detectSnapZone(this._config, x, y, view),
      updateSnapIndicator: (snap, view) =>
        this._updateSnapIndicator(snap, view),
      onMaximize: (win) => this.toggleMaximize(win),
      onSnap: (win, snap, view) =>
        WindowTiling.snapWindow(win, snap, this._config, view),
      onSaveState: (win) => WindowState.savePositionRatios(win),
    };

    return WindowDrag.drag(
      e,
      winElement,
      this._config,
      this._dragState,
      callbacks,
    );
  }

  _updateSnapIndicator(type, view) {
    if (!this._snapIndicator) {
      return;
    }
    if (!type) {
      this._snapIndicator.classList.remove("visible");
      return;
    }

    let layout;
    if (type === "maximize") {
      layout = {
        top: "0px",
        left: "0px",
        width: `${view.w}px`,
        height: `${view.h}px`,
      };
    } else {
      layout = WindowTiling.getSnapLayout(type, this._config, view.w, view.h);
    }

    Object.assign(this._snapIndicator.style, layout);
    this._snapIndicator.classList.add("visible");
  }

  toggleMaximize(winElement) {
    return WindowLifecycle.toggleMaximize(
      winElement,
      this._getLifecycleContext(),
    );
  }

  _initializeModalContent(root) {
    const modules = this._getModules ? this._getModules() : null;
    this._initializeContent(root, {
      delegator: this._delegator,
      modules,
      manager: this,
    });
  }
}
