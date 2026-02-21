/**
 * WindowState utility for managing window geometry, persistence, and scroll states.
 * This class combines runtime geometric calculations with dataset-based persistence.
 * It is static and stateless, using an internal WeakMap for performance caching.
 */
export default class WindowState {
  /**
   * Cache parsed JSON states by element to avoid repeated JSON.parse calls.
   * @private
   */
  static #parseCache = new WeakMap();

  // --- PERSISTENCE (Geometry & Dataset) ---

  /**
   * Captures the current geometry of a window element.
   * 
   * @param {HTMLElement} winElement - The window element to measure.
   * @param {Object} [options={}] - Options like { includePosition: boolean }.
   * @returns {Object} Geometry object { width, height, left, top }.
   */
  static capture(winElement, options = {}) {
    const includePosition = options.includePosition === true;
    let computed = null;
    
    const getComputed = () => {
      if (!computed) computed = window.getComputedStyle(winElement);
      return computed;
    };

    const width = (winElement.offsetWidth > 0 ? WindowState.#toPx(winElement.offsetWidth) : "") ||
                 WindowState.#normalizeCss(winElement.style.width) ||
                 WindowState.#normalizeCss(getComputed().width);

    const height = (winElement.offsetHeight > 0 ? WindowState.#toPx(winElement.offsetHeight) : "") ||
                  WindowState.#normalizeCss(winElement.style.height) ||
                  WindowState.#normalizeCss(getComputed().height);

    let left = "";
    let top = "";
    
    if (includePosition) {
      left = WindowState.#toPx(winElement.offsetLeft) ||
             WindowState.#normalizeCss(winElement.style.left) ||
             WindowState.#normalizeCss(getComputed().left);
      top = WindowState.#toPx(winElement.offsetTop) ||
            WindowState.#normalizeCss(winElement.style.top) ||
            WindowState.#normalizeCss(getComputed().top);
    }

    return { width: width || "", height: height || "", left, top };
  }

  /**
   * Saves the current window geometry to a dataset attribute.
   * 
   * @param {HTMLElement} winElement - The window element.
   * @param {string} [key="prevState"] - The dataset key to use.
   * @param {Object} [options={}] - Capture options.
   * @returns {Object} The saved geometry.
   */
  static save(winElement, key = "prevState", options = {}) {
    const state = WindowState.capture(winElement, options);
    const raw = JSON.stringify(state);
    
    winElement.dataset[key] = raw;
    WindowState.#getCache(winElement).set(key, { raw, parsed: state });
    
    return state;
  }

  /**
   * Reads a saved window geometry from a dataset attribute.
   * 
   * @param {HTMLElement} winElement - The window element.
   * @param {string} [key="prevState"] - The dataset key to read.
   * @returns {Object|null} The parsed geometry or null.
   */
  static read(winElement, key = "prevState") {
    const raw = winElement.dataset[key];
    if (!raw) return null;

    const cached = WindowState.#getCache(winElement).get(key);
    if (cached && cached.raw === raw) {
      return cached.parsed;
    }

    try {
      const parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== "object") return null;

      const state = {
        width: WindowState.#normalizeCss(parsed.width),
        height: WindowState.#normalizeCss(parsed.height),
        left: WindowState.#normalizeCss(parsed.left),
        top: WindowState.#normalizeCss(parsed.top),
      };

      WindowState.#getCache(winElement).set(key, { raw, parsed: state });
      return state;
    } catch {
      return null;
    }
  }

  /**
   * Applies a geometry state back to a window element's styles.
   * 
   * @param {HTMLElement} winElement - The window element.
   * @param {Object} state - The geometry state to apply.
   * @param {Object} [options={}] - Options like { includePosition: boolean }.
   * @returns {boolean} True if state was applied.
   */
  static apply(winElement, state, options = {}) {
    if (!state || typeof state !== "object") return false;

    if (state.width && winElement.style.width !== state.width) {
      winElement.style.width = state.width;
    }
    if (state.height && winElement.style.height !== state.height) {
      winElement.style.height = state.height;
    }

    if (options.includePosition) {
      if (state.left && winElement.style.left !== state.left) {
        winElement.style.left = state.left;
      }
      if (state.top && winElement.style.top !== state.top) {
        winElement.style.top = state.top;
      }
    }

    return true;
  }

  /**
   * Ensures that a restoration state exists for the window.
   */
  static ensureRestoreState(winElement) {
    const savedState = WindowState.read(winElement);
    if (savedState?.width && savedState?.height) return savedState;
    return WindowState.save(winElement, "prevState", { includePosition: false });
  }

  // --- GEOMETRY (Layout & Ratios) ---

  /**
   * Positions a window using a cascade effect relative to the number of existing windows.
   */
  static positionWindow(winElement, windowsCount, config) {
    const width = winElement.offsetWidth || parseInt(winElement.style.width) || config.defaultWidth;
    const height = winElement.offsetHeight || parseInt(winElement.style.height) || config.defaultHeight;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    
    const cascadeIndex = windowsCount;
    const cascadeX = cascadeIndex * config.cascadeOffset;
    const cascadeY = cascadeIndex * config.cascadeOffset;
    
    let left = (vw - width) / 2 + cascadeX;
    let top = (vh - height) / 2 + cascadeY;
    const margin = config.minMargin;
    
    if (left + width > vw) left = Math.max(margin, vw - width - margin);
    if (top + height > vh) top = Math.max(margin, vh - height - margin);
    
    winElement.style.left = `${Math.round(left)}px`;
    winElement.style.top = `${Math.round(top)}px`;
    
    WindowState.savePositionRatios(winElement);
  }

  /**
   * Stabilizes a window's placement after initial rendering to account for dynamic content sizing.
   */
  static stabilizeInitialPlacement(winElement, windowsCount, config) {
    if (!winElement?.isConnected) return;
    
    const settleMs = Number.isFinite(config.layoutStabilizationMs) && config.layoutStabilizationMs > 0 
      ? config.layoutStabilizationMs 
      : 450;
    
    const now = typeof performance !== "undefined" ? () => performance.now() : () => Date.now();
    const startedAt = now();
    let active = true;
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
      if (winElement.classList.contains("tiled") || winElement.classList.contains("maximized")) {
        return;
      }
      const w = winElement.offsetWidth;
      const h = winElement.offsetHeight;
      if (w !== lastW || h !== lastH) {
        lastW = w;
        lastH = h;
        WindowState.positionWindow(winElement, windowsCount, config);
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

  /**
   * Calculates and saves the window's center position as ratios relative to the viewport.
   */
  static savePositionRatios(winElement) {
    if (winElement.classList.contains("tiled") || winElement.classList.contains("maximized")) return;
    const centerX = winElement.offsetLeft + winElement.offsetWidth / 2;
    const centerY = winElement.offsetTop + winElement.offsetHeight / 2;
    winElement.dataset.xRatio = String(centerX / window.innerWidth);
    winElement.dataset.yRatio = String(centerY / window.innerHeight);
  }

  /**
   * Repositions a window based on previously saved coordinate ratios.
   */
  static repositionWindowFromRatios(winElement, vw, vh, size = null) {
    const xRatio = parseFloat(winElement.dataset.xRatio);
    const yRatio = parseFloat(winElement.dataset.yRatio);
    if (isNaN(xRatio) || isNaN(yRatio)) return false;

    const width = (size && size.widthPx > 0 ? size.widthPx : null) || winElement.offsetWidth;
    const height = (size && size.heightPx > 0 ? size.heightPx : null) || winElement.offsetHeight;
    const centerX = xRatio * vw;
    const centerY = yRatio * vh;

    winElement.style.left = `${Math.round(centerX - width / 2)}px`;
    winElement.style.top = `${Math.round(centerY - height / 2)}px`;
    return true;
  }

  // --- SCROLL STATE ---

  /**
   * Captures the current scroll position of the window root and all scrollable descendants.
   */
  static captureScrollState(winElement) {
    const state = new Map();
    if (winElement.scrollTop > 0 || winElement.scrollLeft > 0) {
      state.set("root", { top: winElement.scrollTop, left: winElement.scrollLeft });
    }
    winElement.querySelectorAll("*").forEach((el) => {
      if (el.scrollTop > 0 || el.scrollLeft > 0) {
        state.set(WindowState.getElementPath(winElement, el), { top: el.scrollTop, left: el.scrollLeft });
      }
    });
    return state;
  }

  /**
   * Restores scroll positions from a captured state Map.
   */
  static restoreScrollState(winElement, state, config) {
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
    
    const content = winElement.querySelector(".window-content-scrollable > div") || winElement;
    const observer = new ResizeObserver(() => apply());
    observer.observe(content);
    
    setTimeout(() => observer.disconnect(), config.scrollRestoreTimeoutMs);
  }

  // --- HELPERS ---

  /**
   * Helper to parse CSS pixel values.
   */
  static parseCssPixelValue(value) {
    if (!value) return null;
    const px = parseFloat(value);
    return Number.isFinite(px) ? px : null;
  }

  /**
   * Generates a unique selector path for a child element.
   */
  static getElementPath(winElement, element) {
    let path = [];
    let current = element;
    while (current && current !== winElement) {
      let index = Array.prototype.indexOf.call(current.parentNode.children, current);
      path.unshift(`${current.tagName}:nth-child(${index + 1})`);
      current = current.parentNode;
    }
    return path.join(" > ");
  }

  /**
   * Internal helper to normalize CSS values.
   * @private
   */
  static #normalizeCss(value) {
    if (!value || value === "auto" || value === "normal") return "";
    return value;
  }

  /**
   * Internal helper to convert numbers to pixel strings.
   * @private
   */
  static #toPx(value) {
    if (!Number.isFinite(value)) return "";
    return `${Math.round(value)}px`;
  }

  /**
   * Internal helper to retrieve or initialize the cache for an element.
   * @private
   */
  static #getCache(winElement) {
    let byKey = WindowState.#parseCache.get(winElement);
    if (!byKey) {
      byKey = new Map();
      WindowState.#parseCache.set(winElement, byKey);
    }
    return byKey;
  }
}
