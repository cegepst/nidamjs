import State from './state.js';
import Tiling from './tiling.js';

export default class Lifecycle {
  /**
   * Ouvre une fenêtre
   */
  static async open(endpoint, options, context) {
    const { windows, config, pendingRequests, lastOpenTimestamps, notify, fetchWindowContent } = context;

    if (windows.size >= config.maxWindows && !windows.has(endpoint)) {
      const msg = document.body.dataset.errorMaxWindows || `Maximum of ${config.maxWindows} windows allowed.`;
      notify("error", msg.replace("%s", String(config.maxWindows)));
      return Promise.reject(new Error("Max windows reached"));
    }

    if (windows.has(endpoint) && !options.force) {
      const winElement = windows.get(endpoint);
      if (options.activate) Lifecycle.focusWindow(winElement, context);
      return Promise.resolve(winElement);
    }

    if (pendingRequests.has(endpoint)) {
      return pendingRequests.get(endpoint);
    }

    const now = Date.now();
    if (!options.force && now - (lastOpenTimestamps.get(endpoint) || 0) < config.cooldownMs) {
      return Promise.resolve();
    }
    lastOpenTimestamps.set(endpoint, now);

    const openPromise = (async () => {
      try {
        const html = await fetchWindowContent(endpoint, options);
        if (typeof html !== "string") {
          throw new TypeError("fetchWindowContent must return an HTML string");
        }

        if (windows.has(endpoint) && options.force) {
          const existingWin = windows.get(endpoint);
          if (!options.activate && Lifecycle.isWindowBusy(existingWin)) {
            return existingWin;
          }
          Lifecycle.refreshWindowContent(existingWin, html, context);
          if (options.activate) Lifecycle.focusWindow(existingWin, context);
          if (options.focusSelector) Lifecycle.handleFocusSelector(existingWin, options.focusSelector);
          return existingWin;
        }

        const winElement = Lifecycle.createWindowElement(html, endpoint);
        if (!winElement) {
          console.warn(`No .window element found for ${endpoint}`);
          return;
        }

        Lifecycle.setupNewWindow(winElement, endpoint, options, context);
        return winElement;
      } catch (error) {
        console.error("Error opening window:", error);
        const msg = document.body.dataset.errorOpenFailed || "Failed to open window.";
        notify("error", msg);
        throw error;
      } finally {
        pendingRequests.delete(endpoint);
      }
    })();

    pendingRequests.set(endpoint, openPromise);
    return openPromise;
  }

  /**
   * Ferme une fenêtre
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
   * Alterne l'état maximisé d'une fenêtre
   */
  static toggleMaximize(winElement, context) {
    const { config, callbacks } = context;
    const wasMaximized = winElement.classList.contains("maximized");
    const wasTiledAndSnapped =
      winElement.classList.contains("tiled") &&
      typeof winElement.dataset.snapType === "string" &&
      winElement.dataset.snapType.length > 0;
    
    winElement.classList.add("window-toggling");
    
    if (!wasMaximized && !winElement.classList.contains("tiled")) {
      callbacks.saveWindowState(winElement, "prevState", { includePosition: false });
    }
    
    const isMaximized = winElement.classList.toggle("maximized");
    let shouldSaveRatiosAfterToggle = false;

    Lifecycle.updateMaximizeIcon(winElement, isMaximized);

    if (!isMaximized) {
      if (wasTiledAndSnapped) {
        const layout = Tiling.getSnapLayout(
          winElement.dataset.snapType,
          config,
          window.innerWidth,
          window.innerHeight - config.taskbarHeight,
        );
        Object.assign(winElement.style, layout);
      } else {
        const savedState = callbacks.readWindowState(winElement);
        callbacks.applyWindowState(winElement, savedState);

        const widthPx = State.parseCssPixelValue(savedState?.width) || State.parseCssPixelValue(winElement.style.width) || winElement.offsetWidth;
        const heightPx = State.parseCssPixelValue(savedState?.height) || State.parseCssPixelValue(winElement.style.height) || winElement.offsetHeight;

        State.repositionWindowFromRatios(winElement, window.innerWidth, window.innerHeight, { widthPx, heightPx });
        shouldSaveRatiosAfterToggle = true;
      }
    }

    setTimeout(() => {
      winElement.classList.remove("window-toggling");
      if (shouldSaveRatiosAfterToggle) State.savePositionRatios(winElement);
    }, config.animationDurationMs);
  }

  /**
   * Donne le focus à une fenêtre
   */
  static focusWindow(winElement, context) {
    const { windows } = context;
    context.zIndexCounter++;
    winElement.style.zIndex = context.zIndexCounter;
    winElement.classList.add("focused");
    windows.forEach((w) => {
      if (w !== winElement) w.classList.remove("focused");
    });
  }

  /**
   * Vérifie si la fenêtre est occupée (ex: chargement, formulaire en cours)
   */
  static isWindowBusy(winElement) {
    if (winElement.dataset.isBusy === "true") return true;
    return winElement.querySelector('[data-is-busy="true"]') !== null;
  }

  /**
   * Rafraîchit le contenu d'une fenêtre existante
   */
  static refreshWindowContent(winElement, html, context) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");
    const newContent = doc.querySelector(".window");
    if (!newContent) return;

    const { config, callbacks } = context;
    const snapType = winElement.dataset.snapType;
    const prevState = winElement.dataset.prevState;
    const xRatio = winElement.dataset.xRatio;
    const yRatio = winElement.dataset.yRatio;
    const isFocused = winElement.classList.contains("focused");
    const isMaximized = winElement.classList.contains("maximized");
    const isTiled = winElement.classList.contains("tiled");

    const scrollState = State.captureScrollState(winElement);

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
      Lifecycle.updateMaximizeIcon(winElement, true);
    }

    if (!isTiled && !isMaximized) {
      if (newContent.style.width) winElement.style.width = newContent.style.width;
      if (newContent.style.height) winElement.style.height = newContent.style.height;
    }

    winElement.style.margin = "0";
    winElement.style.transform = "none";

    State.restoreScrollState(winElement, scrollState, config);
    callbacks.initializeContent(winElement);
  }

  /**
   * Met à jour l'icône de maximisation
   */
  static updateMaximizeIcon(winElement, isMaximized) {
    const icon = winElement.querySelector("[data-maximize] i");
    if (icon) {
      icon.classList.toggle("fa-expand", !isMaximized);
      icon.classList.toggle("fa-compress", isMaximized);
    }
  }

  /**
   * Crée l'élément DOM de la fenêtre
   */
  static createWindowElement(html, endpoint) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");
    const winElement = doc.querySelector(".window");
    if (winElement) {
      winElement.dataset.endpoint = endpoint;
    }
    return winElement;
  }

  /**
   * Configure une nouvelle fenêtre
   */
  static setupNewWindow(winElement, endpoint, options, context) {
    const { root, windows, config, callbacks } = context;

    Object.assign(winElement.style, {
      position: "absolute",
      pointerEvents: "auto",
      margin: "0",
      transform: "none",
      visibility: "hidden",
    });

    root.appendChild(winElement);

    const cascadeIndex = windows.size;
    const defaultSnap = winElement.dataset.defaultSnap;
    
    if (defaultSnap) {
      const view = { w: window.innerWidth, h: window.innerHeight - config.taskbarHeight };
      Tiling.snapWindow(winElement, defaultSnap, config, view);
    } else {
      State.positionWindow(winElement, cascadeIndex, config);
    }

    windows.set(endpoint, winElement);
    callbacks.initializeContent(winElement);
    
    if (options.activate) Lifecycle.focusWindow(winElement, context);

    winElement.style.visibility = "";
    
    if (!defaultSnap) {
      State.stabilizeInitialPlacement(winElement, cascadeIndex, config);
    }

    if (options.focusSelector) {
      Lifecycle.handleFocusSelector(winElement, options.focusSelector);
    }
  }

  /**
   * Gère le focus automatique d'un élément dans la fenêtre
   */
  static handleFocusSelector(winElement, selector) {
    const element = winElement.querySelector(selector);
    if (element) {
      if (element.type === "radio" || element.type === "checkbox") {
        element.checked = true;
      }
      element.focus();
    }
  }

  /**
   * Ferme la fenêtre au premier plan
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
    if (topWin) Lifecycle.close(topWin, windows);
  }
}
