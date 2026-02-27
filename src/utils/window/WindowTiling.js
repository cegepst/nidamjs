import WindowState from './WindowState.js';

/**
 * WindowTiling utility for window snapping and layout management.
 * Responsible for edge detection and calculating grid-based positions.
 */
export default class WindowTiling {
  /**
   * Detects the snap zone based on current mouse coordinates.
   * 
   * @param {Object} config - Configuration object (snapThreshold, edgeDetectionRatio).
   * @param {number} x - Mouse X coordinate.
   * @param {number} y - Mouse Y coordinate.
   * @param {Object} view - Viewport dimensions.
   * @returns {string|null} The snap zone identifier (tl, tr, bl, br, left, right, maximize) or null.
   */
  static detectSnapZone(config, x, y, view) {
    const threshold = config.snapThreshold;
    const zoneW = view.w * config.edgeDetectionRatio;
    const zoneH = view.h * config.edgeDetectionRatio;
    let snap = null;

    if (y < threshold) {
      if (x < zoneW) snap = "tl";
      else if (x > view.w - zoneW) snap = "tr";
      else snap = "maximize";
    } else if (x < threshold) {
      if (y < zoneH) snap = "tl";
      else if (y > view.h - zoneH) snap = "bl";
      else snap = "left";
    } else if (x > view.w - threshold) {
      if (y < zoneH) snap = "tr";
      else if (y > view.h - zoneH) snap = "br";
      else snap = "right";
    } else if (y > view.h - threshold) {
      snap = x < view.w / 2 ? "bl" : "br";
    }

    return snap;
  }

  /**
   * Snaps a window to a specific zone and saves the previous state for restoration.
   * 
   * @param {HTMLElement} winElement - The window element.
   * @param {string} type - The snap zone type.
   * @param {Object} config - Configuration object.
   * @param {Object} view - Viewport dimensions.
   */
  static snapWindow(winElement, type, config, view) {
    if (!winElement.classList.contains("tiled")) {
      WindowState.ensureRestoreState(winElement);
    }
    winElement.classList.add("window-toggling", "tiled");
    winElement.dataset.snapType = type;
    const layout = WindowTiling.getSnapLayout(type, config, view.w, view.h);
    Object.assign(winElement.style, layout);
    setTimeout(() => winElement.classList.remove("window-toggling"), config.animationDurationMs);
  }

  /**
   * Calculates the CSS layout properties for a specific snap zone.
   * 
   * @param {string} type - Snap zone type.
   * @param {Object} config - Configuration object.
   * @param {number} vw - Viewport width.
   * @param {number} vh - Viewport height.
   * @returns {Object} CSS properties (width, height, top, left).
   */
  static getSnapLayout(type, config, vw, vh) {
    const gap = config.snapGap;
    const halfW = (vw - gap * 3) / 2;
    const halfH = (vh - gap * 3) / 2;
    const fullH = vh - gap * 2;
    const leftX = gap;
    const rightX = halfW + gap * 2;
    const topY = gap;
    const bottomY = halfH + gap * 2;

    const layouts = {
      tl: { top: topY, left: leftX, width: halfW, height: halfH },
      tr: { top: topY, left: rightX, width: halfW, height: halfH },
      bl: { top: bottomY, left: leftX, width: halfW, height: halfH },
      br: { top: bottomY, left: rightX, width: halfW, height: halfH },
      left: { top: topY, left: leftX, width: halfW, height: fullH },
      right: { top: topY, left: rightX, width: halfW, height: fullH },
    };
    
    const layout = layouts[type];
    if (!layout) return {};

    return {
      width: `${layout.width}px`,
      height: `${layout.height}px`,
      top: `${layout.top}px`,
      left: `${layout.left}px`,
    };
  }

  /**
   * Adjusts all tiled windows to the new viewport size.
   * Called during window resize events.
   * 
   * @param {Map} windows - Map of all windows.
   * @param {Object} config - Configuration object.
   * @param {Object} callbacks - Hooks (repositionFromRatios).
   */
  static handleResize(windows, config, callbacks) {
    const vw = window.innerWidth;
    const vhFull = window.innerHeight;
    const vhTiled = vhFull - config.taskbarHeight;

    windows.forEach((winElement) => {
      if (winElement.classList.contains("tiled") && winElement.dataset.snapType) {
        const type = winElement.dataset.snapType;
        const layout = WindowTiling.getSnapLayout(type, config, vw, vhTiled);
        Object.assign(winElement.style, layout);
      } else if (!winElement.classList.contains("maximized")) {
        callbacks.repositionFromRatios(winElement, vw, vhFull);
      }
    });
  }

  /**
   * Restores a window to its free-floating state with original dimensions.
   * 
   * @param {HTMLElement} winElement - The window element.
   * @param {number|null} xRatio - Optional X ratio for centered restoration during drag.
   * @param {Object} config - Configuration object.
   * @param {Object} callbacks - Hooks (onUpdateMaximizeIcon, onSavePositionRatios).
   */
  static restoreWindowInternal(winElement, xRatio, config, callbacks) {
    let width, height;
    const savedState = WindowState.read(winElement);
    
    if (xRatio === null) {
      if (savedState) {
        width = savedState.width;
        height = savedState.height;
      }
    } else {
      width = savedState?.width || winElement.style.width;
      height = savedState?.height || winElement.style.height;
    }

    if (!width || width === "100%") width = config.defaultWidth + "px";
    if (!height || height === "100%") height = config.defaultHeight + "px";

    winElement.classList.remove("maximized", "tiled");
    callbacks.onUpdateMaximizeIcon(winElement, false);
    winElement.classList.add("window-toggling", "dragging-restore");
    
    WindowState.apply(winElement, { width, height });

    setTimeout(() => {
      winElement.classList.remove("window-toggling", "dragging-restore");
      callbacks.onSavePositionRatios(winElement);
    }, config.animationDurationMs);
  }
}
