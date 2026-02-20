import BaseManager from "../../core/BaseManager.js";
import { applyWindowState, readWindowState, saveWindowState } from "../../utils/windowState.js";
import { config as defaultConfig } from "../../utils/window/config.js";
import Lifecycle from "../../utils/window/lifecycle.js";
import Drag from "../../utils/window/drag.js";
import Tiling from "../../utils/window/tiling.js";
import State from "../../utils/window/state.js";
import WindowEvents from "../../utils/window/windowEventsHandlers.js";

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
  _dragState = null;
  _dragHandlers = null;

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
    this._delegator.on("click", "[data-modal]", (e, target) => WindowEvents._handleModalTrigger(this, e, target));
    this._delegator.on("click", "[data-maximize]", (e, target) => WindowEvents._handleMaximizeTrigger(this, e, target));
    this._delegator.on("click", "[data-close]", (e, target) => WindowEvents._handleCloseTrigger(this, e, target));
    this._delegator.on("mousedown", ".window", (e, target) => WindowEvents._handleWindowFocus(this, e, target));
    this._delegator.on("mousedown", "[data-bar]", (e, target) => WindowEvents._handleWindowDragStart(this, e, target));
    document.addEventListener("keydown", (e) => WindowEvents._handleGlobalKeydown(this, e));

    let resizeTimer;
    window.addEventListener("resize", () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => Tiling._handleResize(this), this._config.resizeDebounceMs);
    });
  }

  open(endpoint, force = false, focusSelector = null, activate = true) {
    return Lifecycle.open(this, endpoint, force, focusSelector, activate);
  }

  close(winElement) {
    return Lifecycle.close(this, winElement);
  }
  
  drag(e, winElement) {
    return Drag.drag(this, e, winElement);
  }

  toggleMaximize(winElement) {
    const wasMaximized = winElement.classList.contains("maximized");
    const wasTiledAndSnapped =
      winElement.classList.contains("tiled") &&
      typeof winElement.dataset.snapType === "string" &&
      winElement.dataset.snapType.length > 0;
    winElement.classList.add("window-toggling");
    if (!wasMaximized && !winElement.classList.contains("tiled")) {
      saveWindowState(winElement, "prevState", { includePosition: false });
    }
    const isMaximized = winElement.classList.toggle("maximized");
    let shouldSaveRatiosAfterToggle = false;

    Lifecycle._updateMaximizeIcon(this, winElement, isMaximized);

    if (!isMaximized) {
      if (wasTiledAndSnapped) {
        const layout = Tiling._getSnapLayout(
          this,
          winElement.dataset.snapType,
          window.innerWidth,
          window.innerHeight - this._config.taskbarHeight,
        );
        Object.assign(winElement.style, layout);
      } else {
        const savedState = readWindowState(winElement);
        applyWindowState(winElement, savedState);

        const widthPx = State._parseCssPixelValue(this, savedState?.width) || State._parseCssPixelValue(this, winElement.style.width) || winElement.offsetWidth;
        const heightPx = State._parseCssPixelValue(this, savedState?.height) || State._parseCssPixelValue(this, winElement.style.height) || winElement.offsetHeight;

        State._repositionWindowFromRatios(this, winElement, window.innerWidth, window.innerHeight, { widthPx, heightPx });
        shouldSaveRatiosAfterToggle = true;
      }
    }

    setTimeout(() => {
      winElement.classList.remove("window-toggling");
      if (shouldSaveRatiosAfterToggle) State._savePositionRatios(this, winElement);
    }, this._config.animationDurationMs);
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
