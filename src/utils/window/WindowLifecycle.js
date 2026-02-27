import WindowState from './WindowState.js';
import WindowTiling from './WindowTiling.js';

/**
 * WindowLifecycle utility for window creation, destruction, focus, and content management.
 * Acts as the primary orchestrator for window state transitions.
 */
export default class WindowLifecycle {
  
  // --- PUBLIC API ---

  /**
   * Opens a window for a given endpoint.
   * Orchestrates validation, content fetching, and UI initialization.
   */
  static async open(endpoint, options, context) {
    const { pendingRequests } = context;

    // 1. Validate if we can proceed
    const validationError = WindowLifecycle._getValidationError(endpoint, options, context);
    if (validationError) {
      if (validationError === "ALREADY_OPEN") return context.windows.get(endpoint);
      if (validationError === "COOLDOWN") return Promise.resolve();
      throw new Error(validationError);
    }

    // 2. Prevent duplicate pending requests
    if (pendingRequests.has(endpoint)) {
      return pendingRequests.get(endpoint);
    }

    // 3. Execution Task
    const openTask = (async () => {
      try {
        const html = await context.fetchWindowContent(endpoint, options);
        if (typeof html !== "string") throw new TypeError("HTML content must be a string");

        const existingWin = context.windows.get(endpoint);
        
        return (existingWin && options.force)
          ? WindowLifecycle._refreshExisting(existingWin, html, context, options)
          : WindowLifecycle._createAndSetup(endpoint, html, context, options);
      } catch (error) {
        WindowLifecycle._handleError(error, context);
        throw error;
      } finally {
        pendingRequests.delete(endpoint);
      }
    })();

    pendingRequests.set(endpoint, openTask);
    return openTask;
  }

  /**
   * Closes a window with an animation.
   */
  static close(winElement, windows) {
    const endpoint = winElement.dataset.endpoint;
    if (windows.get(endpoint) === winElement) {
      windows.delete(endpoint);
    }
    
    winElement.classList.add("animate-disappearance");
    winElement.classList.remove("animate-appearance");
    
    winElement.addEventListener("animationend", () => {
      if (winElement.isConnected) winElement.remove();
    }, { once: true });
  }

  /**
   * Toggles the maximization state of a window.
   */
  static toggleMaximize(winElement, context) {
    const { config, callbacks } = context;
    const isMaximized = winElement.classList.contains("maximized");
    const isTiledAndSnapped = winElement.classList.contains("tiled") && winElement.dataset.snapType;
    
    winElement.classList.add("window-toggling");
    
    if (!isMaximized && !winElement.classList.contains("tiled")) {
      callbacks.saveWindowState(winElement, "prevState", { includePosition: false });
    }
    
    const nowMaximized = winElement.classList.toggle("maximized");
    let shouldSaveRatios = false;

    WindowLifecycle.updateMaximizeIcon(winElement, nowMaximized);

    if (!nowMaximized) {
      if (isTiledAndSnapped) {
        const layout = WindowTiling.getSnapLayout(winElement.dataset.snapType, config, window.innerWidth, window.innerHeight - config.taskbarHeight);
        Object.assign(winElement.style, layout);
      } else {
        const savedState = callbacks.readWindowState(winElement);
        callbacks.applyWindowState(winElement, savedState);
        
        const size = {
          widthPx: WindowState.parseCssPixelValue(savedState?.width) || winElement.offsetWidth,
          heightPx: WindowState.parseCssPixelValue(savedState?.height) || winElement.offsetHeight
        };

        WindowState.repositionWindowFromRatios(winElement, window.innerWidth, window.innerHeight, size);
        shouldSaveRatios = true;
      }
    }

    setTimeout(() => {
      winElement.classList.remove("window-toggling");
      if (shouldSaveRatios) WindowState.savePositionRatios(winElement);
    }, config.animationDurationMs);
  }

  /**
   * Focuses a window and brings it to the front.
   */
  static focusWindow(winElement, context) {
    context.zIndexCounter++;
    winElement.style.zIndex = context.zIndexCounter;
    winElement.classList.add("focused");
    context.windows.forEach((w) => {
      if (w !== winElement) w.classList.remove("focused");
    });
  }

  /**
   * Checks if a window is marked as busy.
   */
  static isWindowBusy(winElement) {
    return winElement.dataset.isBusy === "true" || winElement.querySelector('[data-is-busy="true"]') !== null;
  }

  /**
   * Toggles the maximize/compress icon.
   */
  static updateMaximizeIcon(winElement, isMaximized) {
    const icon = winElement.querySelector('[nd-window-button="maximize"] i');
    if (icon) {
      icon.classList.toggle("fa-expand", !isMaximized);
      icon.classList.toggle("fa-compress", isMaximized);
    }
  }

  /**
   * Finds and closes the focused/topmost window.
   */
  static closeTopmostWindow(windows) {
    let topWin = null;
    let maxZ = 0;
    windows.forEach((winElement) => {
      if (winElement.classList.contains("animate-disappearance")) return;
      const z = parseInt(winElement.style.zIndex || 0, 10);
      if (z > maxZ) {
        maxZ = z;
        topWin = winElement;
      }
    });
    if (topWin) WindowLifecycle.close(topWin, windows);
  }

  // --- PRIVATE HELPERS ---

  /**
   * Validates if a window can be opened.
   * @private
   */
  static _getValidationError(endpoint, options, context) {
    const { windows, config, lastOpenTimestamps } = context;

    if (windows.size >= config.maxWindows && !windows.has(endpoint)) {
      return "MAX_WINDOWS_REACHED";
    }

    if (windows.has(endpoint) && !options.force) {
      if (options.activate) WindowLifecycle.focusWindow(windows.get(endpoint), context);
      return "ALREADY_OPEN";
    }

    const now = Date.now();
    if (!options.force && now - (lastOpenTimestamps.get(endpoint) || 0) < config.cooldownMs) {
      return "COOLDOWN";
    }
    lastOpenTimestamps.set(endpoint, now);

    return null;
  }

  /**
   * Handles refreshing an existing window.
   * @private
   */
  static _refreshExisting(winElement, html, context, options) {
    if (!options.activate && WindowLifecycle.isWindowBusy(winElement)) return winElement;

    WindowLifecycle._applyNewContent(winElement, html, context);
    
    if (options.activate) WindowLifecycle.focusWindow(winElement, context);
    if (options.focusSelector) WindowLifecycle.handleFocusSelector(winElement, options.focusSelector);
    
    return winElement;
  }

  /**
   * Handles creating and initializing a new window.
   * @private
   */
  static _createAndSetup(endpoint, html, context, options) {
    const winElement = WindowLifecycle._parseHTML(html);
    if (!winElement) throw new Error(`No .window element found in content for ${endpoint}`);

    winElement.dataset.endpoint = endpoint;
    WindowLifecycle._initializeNewWindow(winElement, endpoint, options, context);
    
    return winElement;
  }

  /**
   * Parses HTML string into a DOM element.
   * @private
   */
  static _parseHTML(html) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");
    return doc.querySelector("[nd-window]");
  }

  /**
   * Applies new inner HTML to an existing window while preserving state.
   * @private
   */
  static _applyNewContent(winElement, html, context) {
    const newContent = WindowLifecycle._parseHTML(html);
    if (!newContent) return;

    const { config, callbacks } = context;
    const prevState = {
      snapType: winElement.dataset.snapType,
      xRatio: winElement.dataset.xRatio,
      yRatio: winElement.dataset.yRatio,
      isFocused: winElement.classList.contains("focused"),
      isMaximized: winElement.classList.contains("maximized"),
      isTiled: winElement.classList.contains("tiled"),
      scroll: WindowState.captureScrollState(winElement)
    };

    winElement.innerHTML = newContent.innerHTML;
    winElement.className = newContent.className;

    // Restore dataset and state classes
    if (prevState.snapType) winElement.dataset.snapType = prevState.snapType;
    if (prevState.xRatio) winElement.dataset.xRatio = prevState.xRatio;
    if (prevState.yRatio) winElement.dataset.yRatio = prevState.yRatio;
    if (prevState.isFocused) winElement.classList.add("focused");
    if (prevState.isTiled) winElement.classList.add("tiled");
    if (prevState.isMaximized) {
      winElement.classList.add("maximized");
      WindowLifecycle.updateMaximizeIcon(winElement, true);
    }

    if (!prevState.isTiled && !prevState.isMaximized) {
      if (newContent.style.width) winElement.style.width = newContent.style.width;
      if (newContent.style.height) winElement.style.height = newContent.style.height;
    }

    WindowState.restoreScrollState(winElement, prevState.scroll, config);
    callbacks.initializeContent(winElement);
  }

  /**
   * Initial setup for a fresh window element.
   * @private
   */
  static _initializeNewWindow(winElement, endpoint, options, context) {
    const { root, windows, config, callbacks } = context;

    Object.assign(winElement.style, {
      position: "absolute",
      pointerEvents: "auto",
      margin: "0",
      visibility: "hidden",
    });

    root.appendChild(winElement);

    const defaultSnap = winElement.dataset.defaultSnap;
    if (defaultSnap) {
      WindowTiling.snapWindow(winElement, defaultSnap, config, { w: window.innerWidth, h: window.innerHeight - config.taskbarHeight });
    } else {
      WindowState.positionWindow(winElement, windows.size, config);
    }

    windows.set(endpoint, winElement);
    callbacks.initializeContent(winElement);
    
    if (options.activate) WindowLifecycle.focusWindow(winElement, context);
    winElement.style.visibility = "";
    
    if (!defaultSnap) WindowState.stabilizeInitialPlacement(winElement, windows.size - 1, config);
    if (options.focusSelector) WindowLifecycle.handleFocusSelector(winElement, options.focusSelector);
  }

  /**
   * Focuses an element inside the window.
   */
  static handleFocusSelector(winElement, selector) {
    const element = winElement.querySelector(selector);
    if (element) {
      if (element.type === "radio" || element.type === "checkbox") element.checked = true;
      element.focus();
    }
  }

  /**
   * Global error handler for the lifecycle.
   * @private
   */
  static _handleError(error, context) {
    console.error("Window Lifecycle Error:", error);
    const msg = document.body.dataset.errorOpenFailed || "Failed to open window.";
    context.notify("error", msg);
  }
}
