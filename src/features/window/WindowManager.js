import BaseManager from "../../core/BaseManager.js";
import {
  applyWindowState,
  readWindowState,
  saveWindowState,
} from "../../utils/windowState.js";

/**
 * WindowManager handles multi-window interface including:
 * - Opening, closing, and focusing windows
 * - Drag and drop functionality
 * - Maximizing and restoring states
 * - Tiling (snapping to screen quadrants and maximize)
 */
export default class WindowManager extends BaseManager {
  // Configuration
  _config = {
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
  };

  _windows = new Map();
  _zIndexCounter = this._config.zIndexBase;
  _getModules = null;
  _notify = null;
  _fetchWindowContent = null;
  _initializeContent = null;
  _resolveEndpoint = null;
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
    } = options || {};

    this._getModules = getModules;
    this._notify = notify || this._defaultNotify.bind(this);
    this._fetchWindowContent =
      fetchWindowContent || this._defaultFetchWindowContent.bind(this);
    this._initializeContent = initializeContent || (() => {});
    this._resolveEndpoint = resolveEndpoint || this._defaultResolveEndpoint;

    if (config && typeof config === "object") {
      this._config = { ...this._config, ...config };
    }
    this._zIndexCounter = this._config.zIndexBase;

    this._initSnapIndicator();
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
    this._delegator.on(
      "click",
      "[data-modal]",
      this._handleModalTrigger.bind(this),
    );
    this._delegator.on(
      "click",
      "[data-maximize]",
      this._handleMaximizeTrigger.bind(this),
    );
    this._delegator.on(
      "click",
      "[data-close]",
      this._handleCloseTrigger.bind(this),
    );
    this._delegator.on(
      "mousedown",
      ".window",
      this._handleWindowFocus.bind(this),
    );
    this._delegator.on(
      "mousedown",
      "[data-bar]",
      this._handleWindowDragStart.bind(this),
    );

    document.addEventListener("keydown", this._handleGlobalKeydown.bind(this));

    let resizeTimer;
    window.addEventListener("resize", () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(
        () => this._handleResize(),
        this._config.resizeDebounceMs,
      );
    });
  }

  // Event Handlers

  _handleModalTrigger(e, target) {
    e.preventDefault();
    this.open(target.dataset.modal).catch((err) => {
      console.debug("Modal trigger failed:", err);
    });
  }

  _handleCloseTrigger(e, target) {
    e.preventDefault();
    const winElement = target.closest(".window");
    if (winElement) this.close(winElement);
  }

  _handleWindowFocus(e, target) {
    if (e.target.closest("[data-close]") || e.target.closest("[data-modal]"))
      return;
    const winElement = target.closest(".window");
    if (winElement) this._focusWindow(winElement);
  }

  _handleMaximizeTrigger(e, target) {
    e.preventDefault();
    const winElement = target.closest(".window");
    if (winElement) this.toggleMaximize(winElement);
  }

  _handleWindowDragStart(e, target) {
    if (e.target.closest("[data-close]") || e.target.closest("[data-maximize]"))
      return;
    e.preventDefault();
    const winElement = target.closest(".window");

    if (winElement) {
      this._focusWindow(winElement);
      this.drag(e, winElement);
    }
  }

  _handleGlobalKeydown(e) {
    if (e.key === "Escape" && !e.repeat) {
      this._closeTopmostWindow();
    }
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

  // Open a window by its endpoint
  async open(endpoint, force = false, focusSelector = null, activate = true) {
    // 1. Check Limits
    if (
      this._windows.size >= this._config.maxWindows &&
      !this._windows.has(endpoint)
    ) {
      const msg =
        document.body.dataset.errorMaxWindows ||
        `Maximum of ${this._config.maxWindows} windows allowed.`;
      this._notify("error", msg.replace("%s", String(this._config.maxWindows)));
      return Promise.reject(new Error("Max windows reached"));
    }

    // 2. Handle Existing Window
    if (this._windows.has(endpoint) && !force) {
      const winElement = this._windows.get(endpoint);
      if (activate) this._focusWindow(winElement);
      return Promise.resolve(winElement);
    }

    // 3. Check Pending Requests
    if (this._pendingRequests.has(endpoint)) {
      return this._pendingRequests.get(endpoint);
    }

    // 4. Cooldown Check
    const now = Date.now();
    if (
      !force &&
      now - (this._lastOpenTimestamps.get(endpoint) || 0) <
        this._config.cooldownMs
    ) {
      return Promise.resolve();
    }
    this._lastOpenTimestamps.set(endpoint, now);

    // 5. Fetch and Create
    const openPromise = (async () => {
      try {
        const html = await this._fetchWindowContent(endpoint, {
          force,
          focusSelector,
          activate,
          manager: this,
        });
        if (typeof html !== "string") {
          throw new TypeError("fetchWindowContent must return an HTML string");
        }

        // Handle Refresh
        if (this._windows.has(endpoint) && force) {
          const existingWin = this._windows.get(endpoint);

          // Skip silent refreshes if the window is busy (e.g. animation in progress)
          if (!activate && this._isWindowBusy(existingWin)) {
            return existingWin;
          }

          this._refreshWindowContent(existingWin, html);
          if (activate) this._focusWindow(existingWin);
          if (focusSelector)
            this._handleFocusSelector(existingWin, focusSelector);
          return existingWin;
        }

        const winElement = this._createWindowElement(html, endpoint);
        if (!winElement) {
          console.warn(`No .window element found for ${endpoint}`);
          return;
        }

        this._setupNewWindow(winElement, endpoint, focusSelector, activate);
        return winElement;
      } catch (error) {
        console.error("Error opening window:", error);
        const msg =
          document.body.dataset.errorOpenFailed || "Failed to open window.";
        this._notify("error", msg);
        throw error;
      } finally {
        this._pendingRequests.delete(endpoint);
      }
    })();

    this._pendingRequests.set(endpoint, openPromise);
    return openPromise;
  }

  // Close a window
  close(winElement) {
    const endpoint = winElement.dataset.endpoint;

    if (this._windows.get(endpoint) === winElement) {
      this._windows.delete(endpoint);
    }

    winElement.classList.add("animate-disappearance");
    winElement.classList.remove("animate-appearance");

    winElement.addEventListener(
      "animationend",
      () => {
        if (winElement.isConnected) winElement.remove();
      },
      { once: true },
    );
  }

  // Internal Logic

  // Focus a window and bring it to top
  _focusWindow(winElement) {
    this._zIndexCounter++;
    winElement.style.zIndex = this._zIndexCounter;
    winElement.classList.add("focused");
    this._windows.forEach((w) => {
      if (w !== winElement) w.classList.remove("focused");
    });
  }

  _isWindowBusy(winElement) {
    if (winElement.dataset.isBusy === "true") return true;
    return winElement.querySelector('[data-is-busy="true"]') !== null;
  }

  _refreshWindowContent(winElement, html) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");
    const newContent = /** @type {HTMLElement|null} */ (
      doc.querySelector(".window")
    );

    if (!newContent) return;

    // Preserve state data before replacement
    const snapType = winElement.dataset.snapType;
    const prevState = winElement.dataset.prevState;
    const xRatio = winElement.dataset.xRatio;
    const yRatio = winElement.dataset.yRatio;
    const isFocused = winElement.classList.contains("focused");
    const isMaximized = winElement.classList.contains("maximized");
    const isTiled = winElement.classList.contains("tiled");

    // Preserve scroll state
    const scrollState = this._captureScrollState(winElement);

    winElement.innerHTML = newContent.innerHTML;
    winElement.className = newContent.className;

    // Re-apply states
    if (snapType) winElement.dataset.snapType = snapType;
    if (prevState) winElement.dataset.prevState = prevState;
    if (xRatio) winElement.dataset.xRatio = xRatio;
    if (yRatio) winElement.dataset.yRatio = yRatio;

    if (isFocused) winElement.classList.add("focused");
    if (isTiled) winElement.classList.add("tiled");
    if (isMaximized) {
      winElement.classList.add("maximized");
      this._updateMaximizeIcon(winElement, true);
    }

    // Sync Dimensions (Server provided style width/height)
    if (!isTiled && !isMaximized) {
      if (newContent.style.width)
        winElement.style.width = newContent.style.width;
      if (newContent.style.height)
        winElement.style.height = newContent.style.height;
    }

    // Re-assert positioning styles to prevent CSS jumps
    winElement.style.margin = "0";
    winElement.style.transform = "none";

    // Restore scroll state
    this._restoreScrollState(winElement, scrollState);

    // Re-initialize content modules
    this._initializeModalContent(winElement);
  }

  _updateMaximizeIcon(winElement, isMaximized) {
    const icon = winElement.querySelector("[data-maximize] i");
    if (icon) {
      icon.classList.toggle("fa-expand", !isMaximized);
      icon.classList.toggle("fa-compress", isMaximized);
    }
  }

  _createWindowElement(html, endpoint) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");
    const winElement = /** @type {HTMLElement|null} */ (
      doc.querySelector(".window")
    );

    if (winElement) {
      winElement.dataset.endpoint = endpoint;
    }
    return winElement;
  }

  _setupNewWindow(winElement, endpoint, focusSelector, activate = true) {
    // Style
    Object.assign(winElement.style, {
      position: "absolute",
      pointerEvents: "auto",
      margin: "0",
      transform: "none",
      visibility: "hidden",
    });

    this._root.appendChild(winElement);

    const cascadeIndex = this._windows.size;
    const defaultSnap = winElement.dataset.defaultSnap;
    if (defaultSnap) {
      const vw = window.innerWidth;
      const vh = window.innerHeight - this._config.taskbarHeight;
      this._snapWindow(winElement, defaultSnap, vw, vh);
    } else {
      this._positionWindow(winElement, cascadeIndex);
    }

    this._windows.set(endpoint, winElement);
    this._initializeModalContent(winElement);
    if (activate) this._focusWindow(winElement);

    winElement.style.visibility = "";
    if (!defaultSnap) {
      this._stabilizeInitialPlacement(winElement, cascadeIndex);
    }

    if (focusSelector) {
      this._handleFocusSelector(winElement, focusSelector);
    }
  }

  _positionWindow(winElement, cascadeIndexOverride = null) {
    const width =
      winElement.offsetWidth ||
      parseInt(winElement.style.width) ||
      this._config.defaultWidth;
    const height =
      winElement.offsetHeight ||
      parseInt(winElement.style.height) ||
      this._config.defaultHeight;

    const vw = window.innerWidth;
    const vh = window.innerHeight;

    const cascadeIndex =
      Number.isFinite(cascadeIndexOverride) && cascadeIndexOverride >= 0
        ? cascadeIndexOverride
        : this._windows.size;
    const cascadeX = cascadeIndex * this._config.cascadeOffset;
    const cascadeY = cascadeIndex * this._config.cascadeOffset;

    let left = (vw - width) / 2 + cascadeX;
    let top = (vh - height) / 2 + cascadeY;

    const margin = this._config.minMargin;
    if (left + width > vw) left = Math.max(margin, vw - width - margin);
    if (top + height > vh) top = Math.max(margin, vh - height - margin);

    winElement.style.left = `${Math.round(left)}px`;
    winElement.style.top = `${Math.round(top)}px`;
    this._savePositionRatios(winElement);
  }

  _stabilizeInitialPlacement(winElement, cascadeIndex) {
    if (!winElement?.isConnected) return;

    const settleMs =
      Number.isFinite(this._config.layoutStabilizationMs) &&
      this._config.layoutStabilizationMs > 0
        ? this._config.layoutStabilizationMs
        : 450;
    const now =
      typeof performance !== "undefined"
        ? () => performance.now()
        : () => Date.now();
    const startedAt = now();
    let active = true;
    /** @type {ResizeObserver|null} */
    let resizeObserver = null;
    let lastW = winElement.offsetWidth;
    let lastH = winElement.offsetHeight;

    const cleanup = () => {
      if (!active) return;
      active = false;
      if (resizeObserver) {
        resizeObserver.disconnect();
        resizeObserver = null;
      }
    };

    const maybeRecenter = () => {
      if (!active || !winElement.isConnected) {
        cleanup();
        return;
      }
      if (
        winElement.classList.contains("tiled") ||
        winElement.classList.contains("maximized")
      ) {
        return;
      }

      const w = winElement.offsetWidth;
      const h = winElement.offsetHeight;
      if (w !== lastW || h !== lastH) {
        lastW = w;
        lastH = h;
        this._positionWindow(winElement, cascadeIndex);
      }
    };

    const loop = () => {
      if (!active) return;
      maybeRecenter();
      if (now() - startedAt < settleMs) {
        requestAnimationFrame(loop);
        return;
      }
      cleanup();
    };
    requestAnimationFrame(loop);

    if (typeof ResizeObserver === "function") {
      resizeObserver = new ResizeObserver(() => maybeRecenter());
      resizeObserver.observe(winElement);
    }
    setTimeout(() => cleanup(), settleMs);
  }

  // Save relative position ratios (Center-based)
  _savePositionRatios(winElement) {
    if (
      winElement.classList.contains("tiled") ||
      winElement.classList.contains("maximized")
    )
      return;

    const centerX = winElement.offsetLeft + winElement.offsetWidth / 2;
    const centerY = winElement.offsetTop + winElement.offsetHeight / 2;

    winElement.dataset.xRatio = String(centerX / window.innerWidth);
    winElement.dataset.yRatio = String(centerY / window.innerHeight);
  }

  _parseCssPixelValue(value) {
    if (!value) return null;
    const px = parseFloat(value);
    return Number.isFinite(px) ? px : null;
  }

  _repositionWindowFromRatios(winElement, vw, vh, size = null) {
    const xRatio = parseFloat(winElement.dataset.xRatio);
    const yRatio = parseFloat(winElement.dataset.yRatio);

    if (isNaN(xRatio) || isNaN(yRatio)) return false;

    const width =
      (size && Number.isFinite(size.widthPx) && size.widthPx > 0
        ? size.widthPx
        : null) || winElement.offsetWidth;
    const height =
      (size && Number.isFinite(size.heightPx) && size.heightPx > 0
        ? size.heightPx
        : null) || winElement.offsetHeight;

    const centerX = xRatio * vw;
    const centerY = yRatio * vh;

    winElement.style.left = `${Math.round(centerX - width / 2)}px`;
    winElement.style.top = `${Math.round(centerY - height / 2)}px`;
    return true;
  }

  _handleFocusSelector(winElement, selector) {
    const element = winElement.querySelector(selector);
    if (element) {
      if (element.type === "radio" || element.type === "checkbox") {
        element.checked = true;
      }
      element.focus();
    }
  }

  _closeTopmostWindow() {
    let topWin = null;
    let maxZ = 0;

    this._windows.forEach((winElement) => {
      if (winElement.classList.contains("animate-disappearance")) return;
      const z = parseInt(winElement.style.zIndex || 0, 10);
      if (z > maxZ) {
        maxZ = z;
        topWin = winElement;
      }
    });

    if (topWin) this.close(topWin);
  }

  // Drag & Tiling Methods

  drag(e, winElement) {
    if (this._dragState?.active) return; // Prevent double drags

    // 1. Initialize Drag State
    this._dragState = {
      active: true,
      winElement: winElement,
      startX: e.clientX,
      startY: e.clientY,
      currentX: e.clientX,
      currentY: e.clientY,
      startWinLeft: winElement.offsetLeft,
      startWinTop: winElement.offsetTop,
      isRestored: false,
      restoreXRatio: null,
      initialState: {
        tiled: winElement.classList.contains("tiled"),
        maximized: winElement.classList.contains("maximized"),
      },
      view: {
        w: window.innerWidth,
        h: window.innerHeight - this._config.taskbarHeight,
      },
      snap: null,
      inhibitSnap: false,
      isDragging: false,
    };

    // 2. Bind Handlers (Cached to allow removal)
    this._dragHandlers = {
      move: (ev) => {
        this._dragState.currentX = ev.clientX;
        this._dragState.currentY = ev.clientY;
      },
      stop: () => this._handleDragStop(),
    };

    document.addEventListener("mousemove", this._dragHandlers.move, {
      passive: true,
    });
    document.addEventListener("mouseup", this._dragHandlers.stop);

    // 3. Start Animation Loop
    requestAnimationFrame(() => this._dragLoop());
  }

  _dragLoop() {
    if (!this._dragState?.active) return;
    this._updateDragPosition();
    requestAnimationFrame(() => this._dragLoop());
  }

  _updateDragPosition() {
    const state = this._dragState;
    const { winElement, currentX, currentY, startX, startY } = state;

    const deltaX = currentX - startX;
    const deltaY = currentY - startY;

    if (
      !state.isDragging &&
      (Math.abs(deltaX) > this._config.dragThreshold ||
        Math.abs(deltaY) > this._config.dragThreshold)
    ) {
      state.isDragging = true;
    }

    if (!state.isDragging) return;

    // 1. Smart Restoration Logic
    if (
      (state.initialState.tiled || state.initialState.maximized) &&
      !state.isRestored &&
      state.isDragging
    ) {
      if (state.initialState.maximized) {
        state.restoreXRatio = startX / window.innerWidth;
        this._restoreWindowInternal(winElement, state.restoreXRatio);
        state.startWinTop = 0;
      } else {
        state.restoreXRatio =
          (startX - winElement.offsetLeft) / winElement.offsetWidth;
        this._restoreWindowInternal(winElement, null); // Null ratio triggers tiled restore logic
        state.startWinTop = winElement.offsetTop;
      }

      // Reset anchors to current mouse position for smooth continuation
      state.startX = currentX;
      state.startY = currentY;
      state.isRestored = true;
    }

    // 2. Calculate New Position
    let newLeft, newTop;

    if (state.isRestored && state.restoreXRatio !== null) {
      // Dynamic anchoring during restore transition
      const currentWidth = winElement.offsetWidth;
      newLeft = currentX - state.restoreXRatio * currentWidth;
      newTop = Math.max(0, state.startWinTop + (currentY - startY));
    } else {
      // Standard drag
      newLeft =
        state.startWinLeft +
        (state.isRestored ? currentX - state.startX : deltaX);
      newTop = Math.max(
        0,
        state.startWinTop +
          (state.isRestored ? currentY - state.startY : deltaY),
      );
    }

    winElement.style.left = `${newLeft}px`;
    winElement.style.top = `${newTop}px`;

    // 3. Cleanup State Classes
    if (
      state.isRestored ||
      (!state.initialState.tiled && !state.initialState.maximized)
    ) {
      if (winElement.classList.contains("tiled"))
        winElement.classList.remove("tiled");
      if (winElement.classList.contains("maximized")) {
        winElement.classList.remove("maximized");
        this._updateMaximizeIcon(winElement, false);
      }
    }

    // 4. Snap Detection
    if (state.isDragging) {
      this._detectSnapZone(currentX, currentY);
    }
  }

  _detectSnapZone(x, y) {
    const { view } = this._dragState;
    const threshold = this._config.snapThreshold;
    const zoneW = view.w * this._config.edgeDetectionRatio;
    const zoneH = view.h * this._config.edgeDetectionRatio;

    let snap = null;

    if (y < threshold) {
      // Top
      if (x < zoneW) snap = "tl";
      else if (x > view.w - zoneW) snap = "tr";
      else snap = "maximize";
    } else if (x < threshold) {
      // Left
      if (y < zoneH) snap = "tl";
      else if (y > view.h - zoneH) snap = "bl";
      else snap = "left";
    } else if (x > view.w - threshold) {
      // Right
      if (y < zoneH) snap = "tr";
      else if (y > view.h - zoneH) snap = "br";
      else snap = "right";
    } else if (y > view.h - threshold) {
      // Bottom
      snap = x < view.w / 2 ? "bl" : "br";
    }

    if (this._dragState.snap !== snap) {
      this._dragState.snap = snap;
      this._updateSnapIndicator(snap, view.w, view.h);
    }
  }

  _handleDragStop() {
    if (!this._dragState?.active) return;

    const { winElement, snap, view } = this._dragState;

    document.removeEventListener("mousemove", this._dragHandlers.move);
    document.removeEventListener("mouseup", this._dragHandlers.stop);

    this._snapIndicator.classList.remove("visible");

    if (snap) {
      if (snap === "maximize") {
        this.toggleMaximize(winElement);
      } else {
        this._snapWindow(winElement, snap, view.w, view.h);
      }
    } else {
      this._savePositionRatios(winElement);
    }

    this._dragState.active = false;
    this._dragState = null;
    this._dragHandlers = null;
  }

  // Unified Restore Logic
  _restoreWindowInternal(winElement, xRatio) {
    // Determine target dimensions
    let width, height;
    const savedState = readWindowState(winElement);

    if (xRatio === null) {
      // Tiled Restore
      if (savedState) {
        width = savedState.width;
        height = savedState.height;
      }
    } else {
      // Maximized Restore
      width = savedState?.width || winElement.style.width;
      height = savedState?.height || winElement.style.height;
    }
    if (!width || width === "100%") width = this._config.defaultWidth + "px";
    if (!height || height === "100%")
      height = this._config.defaultHeight + "px";

    // Apply
    winElement.classList.remove("maximized", "tiled");
    this._updateMaximizeIcon(winElement, false);

    // Add restoration class for width/height transition only (no top/left transition)
    winElement.classList.add("window-toggling", "dragging-restore");

    applyWindowState(winElement, { width, height });

    // Cleanup
    setTimeout(() => {
      winElement.classList.remove("window-toggling", "dragging-restore");
      this._savePositionRatios(winElement);
    }, this._config.animationDurationMs);
  }

  // Update snap indicator visibility and position
  _updateSnapIndicator(type, vw, vh) {
    if (!type) {
      this._snapIndicator.classList.remove("visible");
      return;
    }

    let layout;
    if (type === "maximize") {
      layout = {
        top: "0px",
        left: "0px",
        width: `${vw}px`,
        height: `${vh}px`,
      };
    } else {
      layout = this._getSnapLayout(type, vw, vh);
    }

    Object.assign(this._snapIndicator.style, layout);
    this._snapIndicator.classList.add("visible");
  }

  // Snap window to a specific quadrant
  _snapWindow(winElement, type, vw, vh) {
    // Save current state before tiling for future restoration
    if (!winElement.classList.contains("tiled")) {
      saveWindowState(winElement, "prevState", { includePosition: false });
    }

    winElement.classList.add("window-toggling", "tiled");
    winElement.dataset.snapType = type;

    const layout = this._getSnapLayout(type, vw, vh);
    Object.assign(winElement.style, layout);

    setTimeout(
      () => winElement.classList.remove("window-toggling"),
      this._config.animationDurationMs,
    );
  }

  // Calculate dimensions and position for a snap quadrant
  _getSnapLayout(type, vw, vh) {
    const gap = this._config.snapGap;

    // Grid dimensions
    const halfW = (vw - gap * 3) / 2;
    const halfH = (vh - gap * 3) / 2;
    const fullH = vh - gap * 2;

    // Grid coordinates
    const leftX = gap;
    const rightX = halfW + gap * 2;
    const topY = gap;
    const bottomY = halfH + gap * 2;

    const layouts = {
      // Quadrants
      tl: { top: topY, left: leftX, width: halfW, height: halfH },
      tr: { top: topY, left: rightX, width: halfW, height: halfH },
      bl: { top: bottomY, left: leftX, width: halfW, height: halfH },
      br: { top: bottomY, left: rightX, width: halfW, height: halfH },

      // Vertical Splits
      left: { top: topY, left: leftX, width: halfW, height: fullH },
      right: { top: topY, left: rightX, width: halfW, height: fullH },
    };

    const layout = layouts[type];

    return {
      width: `${layout.width}px`,
      height: `${layout.height}px`,
      top: `${layout.top}px`,
      left: `${layout.left}px`,
    };
  }

  // Handle browser window resize to keep tiled windows in place
  _handleResize() {
    const vw = window.innerWidth;
    const vhFull = window.innerHeight;
    const vhTiled = vhFull - this._config.taskbarHeight;

    this._windows.forEach((winElement) => {
      if (
        winElement.classList.contains("tiled") &&
        winElement.dataset.snapType
      ) {
        const type = winElement.dataset.snapType;
        const layout = this._getSnapLayout(type, vw, vhTiled);
        Object.assign(winElement.style, layout);
      } else if (!winElement.classList.contains("maximized")) {
        this._repositionWindowFromRatios(winElement, vw, vhFull);
      }
    });
  }

  // Capture scroll positions of an element and its descendants
  _captureScrollState(winElement) {
    const state = new Map();
    if (winElement.scrollTop > 0 || winElement.scrollLeft > 0) {
      state.set("root", {
        top: winElement.scrollTop,
        left: winElement.scrollLeft,
      });
    }

    winElement.querySelectorAll("*").forEach((el) => {
      if (el.scrollTop > 0 || el.scrollLeft > 0) {
        state.set(this._getElementPath(winElement, el), {
          top: el.scrollTop,
          left: el.scrollLeft,
        });
      }
    });
    return state;
  }

  // Restore scroll positions and observe layout shifts for stabilization
  _restoreScrollState(winElement, state) {
    const apply = () => {
      state.forEach((pos, path) => {
        let el;
        if (path === "root") {
          el = winElement;
        } else {
          try {
            el = winElement.querySelector(`:scope > ${path}`);
          } catch (e) {
            el = winElement.querySelector(path);
          }
        }

        if (el) {
          el.scrollTop = pos.top;
          el.scrollLeft = pos.left;
        }
      });
    };

    apply();

    // Use ResizeObserver to handle layout shifts (images, etc.)
    const content =
      winElement.querySelector(".window-content-scrollable > div") ||
      winElement;
    const observer = new ResizeObserver(() => apply());
    observer.observe(content);
    setTimeout(
      () => observer.disconnect(),
      this._config.scrollRestoreTimeoutMs,
    );
  }

  // Generate unique CSS path for an element relative to window
  _getElementPath(winElement, element) {
    let path = [];
    let current = element;
    while (current && current !== winElement) {
      let index = Array.prototype.indexOf.call(
        current.parentNode.children,
        current,
      );
      path.unshift(`${current.tagName}:nth-child(${index + 1})`);
      current = current.parentNode;
    }
    return path.join(" > ");
  }

  async _defaultFetchWindowContent(endpoint) {
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
