import BaseManager from "../../core/BaseManager.js";
import {
  applyWindowState,
  readWindowState,
  saveWindowState,
} from "../../utils/windowState.js";
import { config as defaultConfig } from "../../utils/window/config.js";
import {
  open,
  close,
  _focusWindow,
  _isWindowBusy,
  _refreshWindowContent,
  _updateMaximizeIcon,
  _createWindowElement,
  _setupNewWindow,
  _handleFocusSelector,
  _closeTopmostWindow,
} from "../../utils/window/lifecycle.js";
import {
  drag,
  _dragLoop,
  _updateDragPosition,
  _detectSnapZone,
  _handleDragStop,
  _restoreWindowInternal,
  _updateSnapIndicator,
  _snapWindow,
  _getSnapLayout,
  _handleResize,
} from "../../utils/window/dragAndTiling.js";
import {
  _positionWindow,
  _stabilizeInitialPlacement,
  _savePositionRatios,
  _parseCssPixelValue,
  _repositionWindowFromRatios,
  _captureScrollState,
  _restoreScrollState,
  _getElementPath,
} from "../../utils/window/state.js";
import {
  _handleModalTrigger,
  _handleCloseTrigger,
  _handleWindowFocus,
  _handleMaximizeTrigger,
  _handleWindowDragStart,
  _handleGlobalKeydown,
} from "../../utils/window/windowEventsHandlers.js";

/**
 * WindowManager handles multi-window interface including:
 * - Opening, closing, and focusing windows
 * - Drag and drop functionality
 * - Maximizing and restoring states
 * - Tiling (snapping to screen quadrants and maximize)
 */
export default class WindowManager extends BaseManager {
  // Configuration
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

  // Tiling & Snapping properties
  _snapIndicator = null;

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
    this._fetchWindowContent =
      fetchWindowContent || this._defaultFetchWindowContent.bind(this);
    this._initializeContent = initializeContent || (() => {});
    this._resolveEndpoint = resolveEndpoint || this._defaultResolveEndpoint;
    this._static = Boolean(staticRendering);

    if (config && typeof config === "object") {
      this._config = { ...this._config, ...config };
    }
    this._zIndexCounter = this._config.zIndexBase;

    this._initSnapIndicator();

    // Bind utility functions to the instance
    this.open = open.bind(this);
    this.close = close.bind(this);
    this._focusWindow = _focusWindow.bind(this);
    this._isWindowBusy = _isWindowBusy.bind(this);
    this._refreshWindowContent = _refreshWindowContent.bind(this);
    this._updateMaximizeIcon = _updateMaximizeIcon.bind(this);
    this._createWindowElement = _createWindowElement.bind(this);
    this._setupNewWindow = _setupNewWindow.bind(this);
    this._handleFocusSelector = _handleFocusSelector.bind(this);
    this._closeTopmostWindow = _closeTopmostWindow.bind(this);

    this.drag = drag.bind(this);
    this._dragLoop = _dragLoop.bind(this);
    this._updateDragPosition = _updateDragPosition.bind(this);
    this._detectSnapZone = _detectSnapZone.bind(this);
    this._handleDragStop = _handleDragStop.bind(this);
    this._restoreWindowInternal = _restoreWindowInternal.bind(this);
    this._updateSnapIndicator = _updateSnapIndicator.bind(this);
    this._snapWindow = _snapWindow.bind(this);
    this._getSnapLayout = _getSnapLayout.bind(this);

    this._positionWindow = _positionWindow.bind(this);
    this._stabilizeInitialPlacement = _stabilizeInitialPlacement.bind(this);
    this._savePositionRatios = _savePositionRatios.bind(this);
    this._parseCssPixelValue = _parseCssPixelValue.bind(this);
    this._repositionWindowFromRatios = _repositionWindowFromRatios.bind(this);
    this._captureScrollState = _captureScrollState.bind(this);
    this._restoreScrollState = _restoreScrollState.bind(this);
    this._getElementPath = _getElementPath.bind(this);

    // Event handlers are now bound in _bindEvents
  }

  // Create the visual indicator for window snapping
  _initSnapIndicator() {
    this._snapIndicator = document.createElement("div");
    this._snapIndicator.className = "snap-indicator";
    document.body.appendChild(this._snapIndicator);
  }

  _cacheElements() {
    return {};
  }

  _bindEvents() {
    this._delegator.on("click", "[data-modal]", (e, target) =>
      _handleModalTrigger.call(this, e, target),
    );
    this._delegator.on("click", "[data-maximize]", (e, target) =>
      _handleMaximizeTrigger.call(this, e, target),
    );
    this._delegator.on("click", "[data-close]", (e, target) =>
      _handleCloseTrigger.call(this, e, target),
    );
    this._delegator.on("mousedown", ".window", (e, target) =>
      _handleWindowFocus.call(this, e, target),
    );
    this._delegator.on("mousedown", "[data-bar]", (e, target) =>
      _handleWindowDragStart.call(this, e, target),
    );

    document.addEventListener("keydown", (e) =>
      _handleGlobalKeydown.call(this, e),
    );

    let resizeTimer;
    window.addEventListener("resize", () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(
        () => _handleResize.call(this),
        this._config.resizeDebounceMs,
      );
    });
  }

  // Public Methods

  // Toggle between maximized and normal state
  toggleMaximize(winElement) {
    const wasMaximized = winElement.classList.contains("maximized");
    const wasTiledAndSnapped =
      winElement.classList.contains("tiled") &&
      typeof winElement.dataset.snapType === "string" &&
      winElement.dataset.snapType.length > 0;
    winElement.classList.add("window-toggling");
    // Preserve original free-window geometry when maximizing from tiled state.
    // Tiling already captured prevState, so re-capturing here would overwrite it.
    if (!wasMaximized && !winElement.classList.contains("tiled")) {
      saveWindowState(winElement, "prevState", { includePosition: false });
    }
    const isMaximized = winElement.classList.toggle("maximized");
    let shouldSaveRatiosAfterToggle = false;

    this._updateMaximizeIcon(winElement, isMaximized);

    if (!isMaximized) {
      if (wasTiledAndSnapped) {
        const layout = this._getSnapLayout(
          winElement.dataset.snapType,
          window.innerWidth,
          window.innerHeight - this._config.taskbarHeight,
        );
        Object.assign(winElement.style, layout);
      } else {
        const savedState = readWindowState(winElement);
        applyWindowState(winElement, savedState);

        const widthPx =
          this._parseCssPixelValue(savedState?.width) ||
          this._parseCssPixelValue(winElement.style.width) ||
          winElement.offsetWidth;
        const heightPx =
          this._parseCssPixelValue(savedState?.height) ||
          this._parseCssPixelValue(winElement.style.height) ||
          winElement.offsetHeight;

        this._repositionWindowFromRatios(
          winElement,
          window.innerWidth,
          window.innerHeight,
          {
            widthPx,
            heightPx,
          },
        );
        shouldSaveRatiosAfterToggle = true;
      }
    }

    setTimeout(() => {
      winElement.classList.remove("window-toggling");
      if (shouldSaveRatiosAfterToggle) this._savePositionRatios(winElement);
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
    return String(endpoint || "")
      .trim()
      .replace(/^\/+/, "");
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
    if (!templates.length) {
      return null;
    }

    const routes = new Map();
    templates.forEach((template) => {
      const route = template.getAttribute("data-route");
      if (!route) {
        return;
      }
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
