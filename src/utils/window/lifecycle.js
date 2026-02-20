import State from './state.js';
import Tiling from './tiling.js';

export default class Lifecycle {
  static async open(manager, endpoint, force = false, focusSelector = null, activate = true) {
    if (manager._windows.size >= manager._config.maxWindows && !manager._windows.has(endpoint)) {
      const msg = document.body.dataset.errorMaxWindows || `Maximum of ${manager._config.maxWindows} windows allowed.`;
      manager._notify("error", msg.replace("%s", String(manager._config.maxWindows)));
      return Promise.reject(new Error("Max windows reached"));
    }

    if (manager._windows.has(endpoint) && !force) {
      const winElement = manager._windows.get(endpoint);
      if (activate) Lifecycle._focusWindow(manager, winElement);
      return Promise.resolve(winElement);
    }

    if (manager._pendingRequests.has(endpoint)) {
      return manager._pendingRequests.get(endpoint);
    }

    const now = Date.now();
    if (!force && now - (manager._lastOpenTimestamps.get(endpoint) || 0) < manager._config.cooldownMs) {
      return Promise.resolve();
    }
    manager._lastOpenTimestamps.set(endpoint, now);

    const openPromise = (async () => {
      try {
        const html = await manager._fetchWindowContent(endpoint, {
          force,
          focusSelector,
          activate,
          manager,
        });
        if (typeof html !== "string") {
          throw new TypeError("fetchWindowContent must return an HTML string");
        }

        if (manager._windows.has(endpoint) && force) {
          const existingWin = manager._windows.get(endpoint);
          if (!activate && Lifecycle._isWindowBusy(manager, existingWin)) {
            return existingWin;
          }
          Lifecycle._refreshWindowContent(manager, existingWin, html);
          if (activate) Lifecycle._focusWindow(manager, existingWin);
          if (focusSelector) Lifecycle._handleFocusSelector(manager, existingWin, focusSelector);
          return existingWin;
        }

        const winElement = Lifecycle._createWindowElement(manager, html, endpoint);
        if (!winElement) {
          console.warn(`No .window element found for ${endpoint}`);
          return;
        }

        Lifecycle._setupNewWindow(manager, winElement, endpoint, focusSelector, activate);
        return winElement;
      } catch (error) {
        console.error("Error opening window:", error);
        const msg = document.body.dataset.errorOpenFailed || "Failed to open window.";
        manager._notify("error", msg);
        throw error;
      } finally {
        manager._pendingRequests.delete(endpoint);
      }
    })();

    manager._pendingRequests.set(endpoint, openPromise);
    return openPromise;
  }

  static close(manager, winElement) {
    const endpoint = winElement.dataset.endpoint;
    if (manager._windows.get(endpoint) === winElement) {
      manager._windows.delete(endpoint);
    }
    winElement.classList.add("animate-disappearance");
    winElement.classList.remove("animate-appearance");
    winElement.addEventListener("animationend", () => {
      if (winElement.isConnected) winElement.remove();
    }, { once: true });
  }

  static _focusWindow(manager, winElement) {
    manager._zIndexCounter++;
    winElement.style.zIndex = manager._zIndexCounter;
    winElement.classList.add("focused");
    manager._windows.forEach((w) => {
      if (w !== winElement) w.classList.remove("focused");
    });
  }

  static _isWindowBusy(manager, winElement) {
    if (winElement.dataset.isBusy === "true") return true;
    return winElement.querySelector('[data-is-busy="true"]') !== null;
  }

  static _refreshWindowContent(manager, winElement, html) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");
    const newContent = doc.querySelector(".window");
    if (!newContent) return;

    const snapType = winElement.dataset.snapType;
    const prevState = winElement.dataset.prevState;
    const xRatio = winElement.dataset.xRatio;
    const yRatio = winElement.dataset.yRatio;
    const isFocused = winElement.classList.contains("focused");
    const isMaximized = winElement.classList.contains("maximized");
    const isTiled = winElement.classList.contains("tiled");

    const scrollState = State._captureScrollState(manager, winElement);

    winElement.innerHTML = newContent.innerHTML;
    winElement.className = newContent.className;

    if (snapType) winElement.dataset.snapType = snapType;
    if (prevState) winElement.dataset.prevState = prevState;
    if (xRatio) winElement.dataset.xRatio = xRatio;
    if (yRatio) winElement.dataset.yRatio = yRatio;
    if (isFocused) winElement.classList.add("focused");
    if (isTiled) winElement.classList.add("tiled");
    if (isMaximized) {
      winElement.classList.add("maximized");
      Lifecycle._updateMaximizeIcon(manager, winElement, true);
    }

    if (!isTiled && !isMaximized) {
      if (newContent.style.width) winElement.style.width = newContent.style.width;
      if (newContent.style.height) winElement.style.height = newContent.style.height;
    }

    winElement.style.margin = "0";
    winElement.style.transform = "none";

    State._restoreScrollState(manager, winElement, scrollState);
    manager._initializeModalContent(winElement);
  }

  static _updateMaximizeIcon(manager, winElement, isMaximized) {
    const icon = winElement.querySelector("[data-maximize] i");
    if (icon) {
      icon.classList.toggle("fa-expand", !isMaximized);
      icon.classList.toggle("fa-compress", isMaximized);
    }
  }

  static _createWindowElement(manager, html, endpoint) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");
    const winElement = doc.querySelector(".window");
    if (winElement) {
      winElement.dataset.endpoint = endpoint;
    }
    return winElement;
  }

  static _setupNewWindow(manager, winElement, endpoint, focusSelector, activate = true) {
    Object.assign(winElement.style, {
      position: "absolute",
      pointerEvents: "auto",
      margin: "0",
      transform: "none",
      visibility: "hidden",
    });

    manager._root.appendChild(winElement);

    const cascadeIndex = manager._windows.size;
    const defaultSnap = winElement.dataset.defaultSnap;
    if (defaultSnap) {
      const vw = window.innerWidth;
      const vh = window.innerHeight - manager._config.taskbarHeight;
      Tiling._snapWindow(manager, winElement, defaultSnap, vw, vh);
    } else {
      State._positionWindow(manager, winElement, cascadeIndex);
    }

    manager._windows.set(endpoint, winElement);
    manager._initializeModalContent(winElement);
    if (activate) Lifecycle._focusWindow(manager, winElement);

    winElement.style.visibility = "";
    if (!defaultSnap) {
      State._stabilizeInitialPlacement(manager, winElement, cascadeIndex);
    }

    if (focusSelector) {
      Lifecycle._handleFocusSelector(manager, winElement, focusSelector);
    }
  }

  static _handleFocusSelector(manager, winElement, selector) {
    const element = winElement.querySelector(selector);
    if (element) {
      if (element.type === "radio" || element.type === "checkbox") {
        element.checked = true;
      }
      element.focus();
    }
  }

  static _closeTopmostWindow(manager) {
    let topWin = null;
    let maxZ = 0;
    manager._windows.forEach((winElement) => {
      if (winElement.classList.contains("animate-disappearance")) return;
      const z = parseInt(winElement.style.zIndex || 0, 10);
      if (z > maxZ) {
        maxZ = z;
        topWin = winElement;
      }
    });
    if (topWin) Lifecycle.close(manager, topWin);
  }
}
