import BaseManager from "../../core/BaseManager.js";
import { applyWindowState, readWindowState, saveWindowState } from "../../utils/windowState.js";
import { config as defaultConfig } from "../../utils/window/config.js";
import Lifecycle from "../../utils/window/lifecycle.js";
import Drag from "../../utils/window/drag.js";
import Tiling from "../../utils/window/tiling.js";
import State from "../../utils/window/state.js";

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
    this._fetchWindowContent = fetchWindowContent || this._defaultFetchWindowContent.bind(this);
    this._initializeContent = initializeContent || (() => {});
    this._resolveEndpoint = resolveEndpoint || this._defaultResolveEndpoint;
    this._static = Boolean(staticRendering);

    if (config && typeof config === "object") {
      this._config = { ...this._config, ...config };
    }
    this._zIndexCounter = this._config.zIndexBase;

    this._initSnapIndicator();
  }

  _initSnapIndicator() {
    this._snapIndicator = document.createElement("div");
    this._snapIndicator.className = "snap-indicator";
    document.body.appendChild(this._snapIndicator);
  }

  _cacheElements() {
    return {};
  }

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
        Lifecycle.closeTopmostWindow(this._windows);
      }
    });

    let resizeTimer;
    window.addEventListener("resize", () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        Tiling.handleResize(this._windows, this._config, {
          repositionFromRatios: (win, vw, vh) => State.repositionWindowFromRatios(win, vw, vh)
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
      notify: this._notify,
      fetchWindowContent: this._fetchWindowContent.bind(this),
      callbacks: {
        initializeContent: (root) => this._initializeModalContent(root),
        saveWindowState: saveWindowState,
        readWindowState: readWindowState,
        applyWindowState: applyWindowState
      }
    };
  }

  open(endpoint, force = false, focusSelector = null, activate = true) {
    return Lifecycle.open(endpoint, { force, focusSelector, activate }, this._getLifecycleContext());
  }

  close(winElement) {
    return Lifecycle.close(winElement, this._windows);
  }

  focus(winElement) {
    const ctx = this._getLifecycleContext();
    Lifecycle.focusWindow(winElement, ctx);
    this._zIndexCounter = ctx.zIndexCounter;
  }
  
  drag(e, winElement) {
    const callbacks = {
      onRestore: (win, ratio, isMaximized) => Tiling.restoreWindowInternal(win, ratio, this._config, {
        onUpdateMaximizeIcon: (w, isMax) => Lifecycle.updateMaximizeIcon(w, isMax),
        onSavePositionRatios: (w) => State.savePositionRatios(w)
      }),
      onUpdateMaximizeIcon: (win, isMax) => Lifecycle.updateMaximizeIcon(win, isMax),
      detectSnapZone: (x, y, view) => Tiling.detectSnapZone(this._config, x, y, view),
      updateSnapIndicator: (snap, view) => this._updateSnapIndicator(snap, view),
      onMaximize: (win) => this.toggleMaximize(win),
      onSnap: (win, snap, view) => Tiling.snapWindow(win, snap, this._config, view),
      onSaveState: (win) => State.savePositionRatios(win)
    };

    return Drag.drag(e, winElement, this._config, this._dragState, callbacks);
  }

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
      layout = Tiling.getSnapLayout(type, this._config, view.w, view.h);
    }
    Object.assign(this._snapIndicator.style, layout);
    this._snapIndicator.classList.add("visible");
  }

  toggleMaximize(winElement) {
    return Lifecycle.toggleMaximize(winElement, this._getLifecycleContext());
  }

  async _defaultFetchWindowContent(endpoint) {
    if (this._static) {
      const templateContent = this._getStaticTemplateContent(endpoint);
      if (templateContent !== null) {
        return templateContent;
      }
      throw new Error(`Static route not found: ${String(endpoint || "")}`);
    }
    const response = await fetch(this._resolveEndpoint(endpoint), {
      headers: { "X-Modal-Request": "1" },
      cache: "no-cache",
    });
    return response.text();
  }

  _normalizeEndpoint(endpoint) {
    return String(endpoint || "").trim().replace(/^\/+/, "");
  }

  _buildStaticRouteCandidates(endpoint) {
    const normalized = this._normalizeEndpoint(endpoint);
    const candidates = [];
    const addCandidate = (value) => {
      const item = String(value || "").trim();
      if (!item || candidates.includes(item)) {
        return;
      }
      candidates.push(item);
    };
    addCandidate(normalized);
    const lastSegment = normalized.split("/").pop();
    addCandidate(lastSegment);
    if (normalized.endsWith(".html")) {
      addCandidate(normalized.slice(0, -5));
    }
    if (lastSegment && lastSegment.endsWith(".html")) {
      addCandidate(lastSegment.slice(0, -5));
    }
    return candidates;
  }

  _getStaticTemplateContent(endpoint) {
    const templates = document.querySelectorAll("template[data-route]");
    if (!templates.length) return null;
    const routes = new Map();
    templates.forEach((template) => {
      const route = template.getAttribute("data-route");
      if (!route) return;
      routes.set(route.trim(), template.innerHTML);
    });
    const candidates = this._buildStaticRouteCandidates(endpoint);
    for (const candidate of candidates) {
      if (routes.has(candidate)) {
        return routes.get(candidate);
      }
    }
    return null;
  }

  _defaultResolveEndpoint(endpoint) {
    const normalized = String(endpoint || "").replace(/^\/+/, "");
    return `/${normalized}`;
  }

  _defaultNotify(level, message) {
    const logger = level === "error" ? console.error : console.log;
    logger(`[nidamjs:${level}]`, message);
  }

  _initializeModalContent(root) {
    const modules = this._getModules ? this._getModules() : null;
    this._initializeContent(root, {
      delegator: this._delegator,
      modules: modules,
      manager: this,
    });
  }
}
