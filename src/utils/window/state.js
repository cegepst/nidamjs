/**
 * State utility for managing window positions, ratios, and scroll states.
 * This class is stateless and dependency-free, operating on raw DOM elements and configuration objects.
 */
export default class State {
  /**
   * Positions a window using a cascade effect relative to the number of existing windows.
   * 
   * @param {HTMLElement} winElement - The window element to position.
   * @param {number} windowsCount - Current number of open windows for cascade calculation.
   * @param {Object} config - Configuration object containing cascadeOffset and minMargin.
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
    
    State.savePositionRatios(winElement);
  }

  /**
   * Stabilizes a window's placement after initial rendering to account for dynamic content sizing.
   * Uses a ResizeObserver and an animation loop for a short period.
   * 
   * @param {HTMLElement} winElement - The window element to stabilize.
   * @param {number} windowsCount - Current number of open windows for repositioning.
   * @param {Object} config - Configuration object containing layoutStabilizationMs.
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
        State.positionWindow(winElement, windowsCount, config);
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
   * This allows the window to maintain its relative position during browser resizing.
   * 
   * @param {HTMLElement} winElement - The window element.
   */
  static savePositionRatios(winElement) {
    if (winElement.classList.contains("tiled") || winElement.classList.contains("maximized")) return;
    const centerX = winElement.offsetLeft + winElement.offsetWidth / 2;
    const centerY = winElement.offsetTop + winElement.offsetHeight / 2;
    winElement.dataset.xRatio = String(centerX / window.innerWidth);
    winElement.dataset.yRatio = String(centerY / window.innerHeight);
  }

  /**
   * Safely parses a CSS pixel value into a number.
   * 
   * @param {string} value - The CSS value (e.g., "100px").
   * @returns {number|null} The parsed number or null if invalid.
   */
  static parseCssPixelValue(value) {
    if (!value) return null;
    const px = parseFloat(value);
    return Number.isFinite(px) ? px : null;
  }

  /**
   * Repositions a window based on previously saved coordinate ratios.
   * 
   * @param {HTMLElement} winElement - The window element.
   * @param {number} vw - Viewport width.
   * @param {number} vh - Viewport height.
   * @param {Object} [size=null] - Optional size override (widthPx, heightPx).
   * @returns {boolean} True if repositioning was successful.
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

  /**
   * Captures the current scroll position of the window root and all its scrollable descendants.
   * Used before refreshing window content to maintain user scroll position.
   * 
   * @param {HTMLElement} winElement - The window element.
   * @returns {Map<string, Object>} A map of element paths to their scroll positions.
   */
  static captureScrollState(winElement) {
    const state = new Map();
    if (winElement.scrollTop > 0 || winElement.scrollLeft > 0) {
      state.set("root", { top: winElement.scrollTop, left: winElement.scrollLeft });
    }
    winElement.querySelectorAll("*").forEach((el) => {
      if (el.scrollTop > 0 || el.scrollLeft > 0) {
        state.set(State.getElementPath(winElement, el), { top: el.scrollTop, left: el.scrollLeft });
      }
    });
    return state;
  }

  /**
   * Restores scroll positions from a captured state Map.
   * Uses a ResizeObserver to re-apply scroll if content takes time to render.
   * 
   * @param {HTMLElement} winElement - The window element.
   * @param {Map} state - The captured scroll state.
   * @param {Object} config - Configuration object containing scrollRestoreTimeoutMs.
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

  /**
   * Generates a unique CSS-like path for a child element relative to the window root.
   * 
   * @param {HTMLElement} winElement - The window root element.
   * @param {HTMLElement} element - The target child element.
   * @returns {string} The unique selector path.
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
}
