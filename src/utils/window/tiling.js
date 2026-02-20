import { applyWindowState, readWindowState, saveWindowState } from "../windowState.js";
import Lifecycle from './lifecycle.js';
import State from "./state.js";


export default class Tiling {
  static _detectSnapZone(manager, x, y) {
    if (!manager._dragState) return;
    const { view } = manager._dragState;
    const threshold = manager._config.snapThreshold;
    const zoneW = view.w * manager._config.edgeDetectionRatio;
    const zoneH = view.h * manager._config.edgeDetectionRatio;
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

    if (manager._dragState.snap !== snap) {
      manager._dragState.snap = snap;
      Tiling._updateSnapIndicator(manager, snap, view.w, view.h);
    }
  }

  static _updateSnapIndicator(manager, type, vw, vh) {
    if (!manager._snapIndicator) return;
    if (!type) {
      manager._snapIndicator.classList.remove("visible");
      return;
    }
    let layout;
    if (type === "maximize") {
      layout = { top: "0px", left: "0px", width: `${vw}px`, height: `${vh}px` };
    } else {
      layout = Tiling._getSnapLayout(manager, type, vw, vh);
    }
    Object.assign(manager._snapIndicator.style, layout);
    manager._snapIndicator.classList.add("visible");
  }

  static _snapWindow(manager, winElement, type, vw, vh) {
    if (!winElement.classList.contains("tiled")) {
      saveWindowState(winElement, "prevState", { includePosition: false });
    }
    winElement.classList.add("window-toggling", "tiled");
    winElement.dataset.snapType = type;
    const layout = Tiling._getSnapLayout(manager, type, vw, vh);
    Object.assign(winElement.style, layout);
    setTimeout(() => winElement.classList.remove("window-toggling"), manager._config.animationDurationMs);
  }

  static _getSnapLayout(manager, type, vw, vh) {
    const gap = manager._config.snapGap;
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
    return {
      width: `${layout.width}px`,
      height: `${layout.height}px`,
      top: `${layout.top}px`,
      left: `${layout.left}px`,
    };
  }

  static _handleResize(manager) {
    const vw = window.innerWidth;
    const vhFull = window.innerHeight;
    const vhTiled = vhFull - manager._config.taskbarHeight;
    manager._windows.forEach((winElement) => {
      if (winElement.classList.contains("tiled") && winElement.dataset.snapType) {
        const type = winElement.dataset.snapType;
        const layout = Tiling._getSnapLayout(manager, type, vw, vhTiled);
        Object.assign(winElement.style, layout);
      } else if (!winElement.classList.contains("maximized")) {
        State._repositionWindowFromRatios(manager, winElement, vw, vhFull);
      }
    });
  }

  static _restoreWindowInternal(manager, winElement, xRatio) {
    let width, height;
    const savedState = readWindowState(winElement);
    if (xRatio === null) {
      if (savedState) {
        width = savedState.width;
        height = savedState.height;
      }
    } else {
      width = savedState?.width || winElement.style.width;
      height = savedState?.height || winElement.style.height;
    }
    if (!width || width === "100%") width = manager._config.defaultWidth + "px";
    if (!height || height === "100%") height = manager._config.defaultHeight + "px";

    winElement.classList.remove("maximized", "tiled");
    Lifecycle._updateMaximizeIcon(manager, winElement, false);
    winElement.classList.add("window-toggling", "dragging-restore");
    applyWindowState(winElement, { width, height });

    setTimeout(() => {
      winElement.classList.remove("window-toggling", "dragging-restore");
      State._savePositionRatios(manager, winElement);
    }, manager._config.animationDurationMs);
  }
}
