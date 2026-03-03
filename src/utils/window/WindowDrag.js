/**
 * WindowDrag utility for handling window movement, snapping, and restoration.
 * This class is static and operates on a shared state object provided by the caller.
 */
export default class WindowDrag {
  /**
   * Initializes the drag process for a window.
   * Attaches mousemove and mouseup listeners to the document.
   *
   * @param {MouseEvent} e - The initial mousedown event.
   * @param {HTMLElement} winElement - The window element to drag.
   * @param {Object} config - Configuration object (dragThreshold, taskbarHeight).
   * @param {Object} state - Shared drag state object to be populated.
   * @param {Object} callbacks - Hooks for external actions (onRestore, onMaximize, onSnap, etc.).
   */
  static drag(e, winElement, config, state, callbacks) {
    if (state.active) return;

    // Initialize local drag state
    Object.assign(state, {
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
        h: window.innerHeight - config.taskbarHeight,
      },
      snap: null,
      isDragging: false,
    });

    const moveHandler = (ev) => {
      state.currentX = ev.clientX;
      state.currentY = ev.clientY;
    };

    const stopHandler = () =>
      WindowDrag._handleDragStop(config, state, callbacks);

    state._moveHandler = moveHandler;

    document.addEventListener("mousemove", moveHandler, { passive: true });
    document.addEventListener("mouseup", stopHandler, { once: true });

    requestAnimationFrame(() => WindowDrag._dragLoop(config, state, callbacks));
  }

  /**
   * Internal animation loop for smooth dragging.
   * @private
   */
  static _dragLoop(config, state, callbacks) {
    if (!state.active) return;
    WindowDrag._updateDragPosition(config, state, callbacks);
    requestAnimationFrame(() => WindowDrag._dragLoop(config, state, callbacks));
  }

  /**
   * Core logic for calculating the new window position during a drag.
   * Handles automatic restoration from maximized/tiled states and snap zone detection.
   *
   * @private
   */
  static _updateDragPosition(config, state, callbacks) {
    const { winElement, currentX, currentY, startX, startY } = state;

    const deltaX = currentX - startX;
    const deltaY = currentY - startY;

    // Movement threshold detection
    if (
      !state.isDragging &&
      (Math.abs(deltaX) > config.dragThreshold ||
        Math.abs(deltaY) > config.dragThreshold)
    ) {
      state.isDragging = true;
    }

    if (!state.isDragging) return;

    // Handle restoration from maximized/tiled states on drag start
    if (
      (state.initialState.tiled || state.initialState.maximized) &&
      !state.isRestored
    ) {
      if (state.initialState.maximized) {
        state.restoreXRatio = startX / window.innerWidth;
        callbacks.onRestore(winElement, state.restoreXRatio, true);
        state.startWinTop = 0;
      } else {
        state.restoreXRatio =
          (startX - winElement.offsetLeft) / winElement.offsetWidth;
        callbacks.onRestore(winElement, null, false);
        state.startWinTop = winElement.offsetTop;
      }

      state.startX = currentX;
      state.startY = currentY;
      state.isRestored = true;
    }

    // Position calculation
    let newLeft, newTop;
    if (state.isRestored && state.restoreXRatio !== null) {
      newLeft = currentX - state.restoreXRatio * winElement.offsetWidth;
      newTop = Math.max(0, state.startWinTop + (currentY - startY));
    } else {
      newLeft =
        state.startWinLeft + (state.isRestored ? currentX - startX : deltaX);
      newTop = Math.max(
        0,
        state.startWinTop + (state.isRestored ? currentY - startY : deltaY),
      );
    }

    winElement.style.left = `${newLeft}px`;
    winElement.style.top = `${newTop}px`;

    // Immediate visual cleanup of state classes
    if (
      state.isRestored ||
      (!state.initialState.tiled && !state.initialState.maximized)
    ) {
      winElement.classList.remove("tiled", "maximized");
      callbacks.onUpdateMaximizeIcon(winElement, false);
    }

    // Snap zone detection
    const snap = callbacks.detectSnapZone(currentX, currentY, state.view);
    if (state.snap !== snap) {
      state.snap = snap;
      callbacks.updateSnapIndicator(snap, state.view);
    }
  }

  /**
   * Finalizes the drag process, removes listeners, and applies final snapping or state saving.
   * @private
   */
  static _handleDragStop(config, state, callbacks) {
    if (!state.active) return;

    const { winElement, snap, view } = state;

    document.removeEventListener("mousemove", state._moveHandler);
    callbacks.updateSnapIndicator(null, view);

    if (snap) {
      if (snap === "maximize") {
        callbacks.onMaximize(winElement);
      } else {
        callbacks.onSnap(winElement, snap, view);
      }
    } else {
      callbacks.onSaveState(winElement);
    }

    state.active = false;
  }
}
