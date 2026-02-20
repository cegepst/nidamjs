import Tiling from './tiling.js';
import Lifecycle from './lifecycle.js';
import State from './state.js';

export default class Drag {
  static drag(manager, e, winElement) {
    if (manager._dragState?.active) return;

    manager._dragState = {
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
        h: window.innerHeight - manager._config.taskbarHeight,
      },
      snap: null,
      inhibitSnap: false,
      isDragging: false,
    };

    manager._dragHandlers = {
      move: (ev) => {
        if (manager._dragState) {
          manager._dragState.currentX = ev.clientX;
          manager._dragState.currentY = ev.clientY;
        }
      },
      stop: () => Drag._handleDragStop(manager),
    };

    document.addEventListener("mousemove", manager._dragHandlers.move, { passive: true });
    document.addEventListener("mouseup", manager._dragHandlers.stop, { once: true });

    requestAnimationFrame(() => Drag._dragLoop(manager));
  }

  static _dragLoop(manager) {
    if (!manager._dragState?.active) return;
    Drag._updateDragPosition(manager);
    requestAnimationFrame(() => Drag._dragLoop(manager));
  }

  static _updateDragPosition(manager) {
    const state = manager._dragState;
    if (!state) return;
    const { winElement, currentX, currentY, startX, startY } = state;

    const deltaX = currentX - startX;
    const deltaY = currentY - startY;

    if (!state.isDragging && (Math.abs(deltaX) > manager._config.dragThreshold || Math.abs(deltaY) > manager._config.dragThreshold)) {
      state.isDragging = true;
    }

    if (!state.isDragging) return;

    if ((state.initialState.tiled || state.initialState.maximized) && !state.isRestored && state.isDragging) {
      if (state.initialState.maximized) {
        state.restoreXRatio = startX / window.innerWidth;
        Tiling._restoreWindowInternal(manager, winElement, state.restoreXRatio);
        state.startWinTop = 0;
      } else {
        state.restoreXRatio = (startX - winElement.offsetLeft) / winElement.offsetWidth;
        Tiling._restoreWindowInternal(manager, winElement, null);
        state.startWinTop = winElement.offsetTop;
      }

      state.startX = currentX;
      state.startY = currentY;
      state.isRestored = true;
    }

    let newLeft, newTop;
    if (state.isRestored && state.restoreXRatio !== null) {
      const currentWidth = winElement.offsetWidth;
      newLeft = currentX - state.restoreXRatio * currentWidth;
      newTop = Math.max(0, state.startWinTop + (currentY - startY));
    } else {
      newLeft = state.startWinLeft + (state.isRestored ? currentX - startX : deltaX);
      newTop = Math.max(0, state.startWinTop + (state.isRestored ? currentY - startY : deltaY));
    }

    winElement.style.left = `${newLeft}px`;
    winElement.style.top = `${newTop}px`;

    if (state.isRestored || (!state.initialState.tiled && !state.initialState.maximized)) {
      if (winElement.classList.contains("tiled")) winElement.classList.remove("tiled");
      if (winElement.classList.contains("maximized")) {
        winElement.classList.remove("maximized");
        Lifecycle._updateMaximizeIcon(manager, winElement, false);
      }
    }

    if (state.isDragging) {
      Tiling._detectSnapZone(manager, currentX, currentY);
    }
  }

  static _handleDragStop(manager) {
    if (!manager._dragState?.active) return;

    const { winElement, snap, view } = manager._dragState;

    document.removeEventListener("mousemove", manager._dragHandlers.move);

    if (manager._snapIndicator) manager._snapIndicator.classList.remove("visible");

    if (snap) {
      if (snap === "maximize") {
        manager.toggleMaximize(winElement);
      } else {
        Tiling._snapWindow(manager, winElement, snap, view.w, view.h);
      }
    } else {
      State._savePositionRatios(manager, winElement);
    }

    manager._dragState = null;
    manager._dragHandlers = null;
  }
}
