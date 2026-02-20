export default class State {
  static _positionWindow(manager, winElement, cascadeIndexOverride = null) {
    const width = winElement.offsetWidth || parseInt(winElement.style.width) || manager._config.defaultWidth;
    const height = winElement.offsetHeight || parseInt(winElement.style.height) || manager._config.defaultHeight;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const cascadeIndex = Number.isFinite(cascadeIndexOverride) && cascadeIndexOverride >= 0 ? cascadeIndexOverride : manager._windows.size;
    const cascadeX = cascadeIndex * manager._config.cascadeOffset;
    const cascadeY = cascadeIndex * manager._config.cascadeOffset;
    let left = (vw - width) / 2 + cascadeX;
    let top = (vh - height) / 2 + cascadeY;
    const margin = manager._config.minMargin;
    if (left + width > vw) left = Math.max(margin, vw - width - margin);
    if (top + height > vh) top = Math.max(margin, vh - height - margin);
    winElement.style.left = `${Math.round(left)}px`;
    winElement.style.top = `${Math.round(top)}px`;
    State._savePositionRatios(manager, winElement);
  }

  static _stabilizeInitialPlacement(manager, winElement, cascadeIndex) {
    if (!winElement?.isConnected) return;
    const settleMs = Number.isFinite(manager._config.layoutStabilizationMs) && manager._config.layoutStabilizationMs > 0 ? manager._config.layoutStabilizationMs : 450;
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
        State._positionWindow(manager, winElement, cascadeIndex);
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

  static _savePositionRatios(manager, winElement) {
    if (winElement.classList.contains("tiled") || winElement.classList.contains("maximized")) return;
    const centerX = winElement.offsetLeft + winElement.offsetWidth / 2;
    const centerY = winElement.offsetTop + winElement.offsetHeight / 2;
    winElement.dataset.xRatio = String(centerX / window.innerWidth);
    winElement.dataset.yRatio = String(centerY / window.innerHeight);
  }

  static _parseCssPixelValue(manager, value) {
    if (!value) return null;
    const px = parseFloat(value);
    return Number.isFinite(px) ? px : null;
  }

  static _repositionWindowFromRatios(manager, winElement, vw, vh, size = null) {
    const xRatio = parseFloat(winElement.dataset.xRatio);
    const yRatio = parseFloat(winElement.dataset.yRatio);
    if (isNaN(xRatio) || isNaN(yRatio)) return false;
    const width = (size && Number.isFinite(size.widthPx) && size.widthPx > 0 ? size.widthPx : null) || winElement.offsetWidth;
    const height = (size && Number.isFinite(size.heightPx) && size.heightPx > 0 ? size.heightPx : null) || winElement.offsetHeight;
    const centerX = xRatio * vw;
    const centerY = yRatio * vh;
    winElement.style.left = `${Math.round(centerX - width / 2)}px`;
    winElement.style.top = `${Math.round(centerY - height / 2)}px`;
    return true;
  }

  static _captureScrollState(manager, winElement) {
    const state = new Map();
    if (winElement.scrollTop > 0 || winElement.scrollLeft > 0) {
      state.set("root", { top: winElement.scrollTop, left: winElement.scrollLeft });
    }
    winElement.querySelectorAll("*").forEach((el) => {
      if (el.scrollTop > 0 || el.scrollLeft > 0) {
        state.set(State._getElementPath(manager, winElement, el), { top: el.scrollTop, left: el.scrollLeft });
      }
    });
    return state;
  }

  static _restoreScrollState(manager, winElement, state) {
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
    setTimeout(() => observer.disconnect(), manager._config.scrollRestoreTimeoutMs);
  }

  static _getElementPath(manager, winElement, element) {
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
