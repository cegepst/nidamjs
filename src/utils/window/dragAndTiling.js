import { applyWindowState, readWindowState, saveWindowState } from "../windowState.js";

function drag(e, winElement) {
  if (this._dragState?.active) return; // Prevent double drags

  // 1. Initialize Drag State
  this._dragState = {
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
      h: window.innerHeight - this._config.taskbarHeight,
    },
    snap: null,
    inhibitSnap: false,
    isDragging: false,
  };

  // 2. Bind Handlers (Cached to allow removal)
  this._dragHandlers = {
    move: (ev) => {
      this._dragState.currentX = ev.clientX;
      this._dragState.currentY = ev.clientY;
    },
    stop: () => this._handleDragStop(),
  };

  document.addEventListener("mousemove", this._dragHandlers.move, {
    passive: true,
  });
  document.addEventListener("mouseup", this._dragHandlers.stop);

  // 3. Start Animation Loop
  requestAnimationFrame(() => this._dragLoop());
}

function _dragLoop() {
  if (!this._dragState?.active) return;
  this._updateDragPosition();
  requestAnimationFrame(() => this._dragLoop());
}

function _updateDragPosition() {
  const state = this._dragState;
  const { winElement, currentX, currentY, startX, startY } = state;

  const deltaX = currentX - startX;
  const deltaY = currentY - startY;

  if (
    !state.isDragging &&
    (Math.abs(deltaX) > this._config.dragThreshold ||
      Math.abs(deltaY) > this._config.dragThreshold)
  ) {
    state.isDragging = true;
  }

  if (!state.isDragging) return;

  // 1. Smart Restoration Logic
  if (
    (state.initialState.tiled || state.initialState.maximized) &&
    !state.isRestored &&
    state.isDragging
  ) {
    if (state.initialState.maximized) {
      state.restoreXRatio = startX / window.innerWidth;
      this._restoreWindowInternal(winElement, state.restoreXRatio);
      state.startWinTop = 0;
    } else {
      state.restoreXRatio =
        (startX - winElement.offsetLeft) / winElement.offsetWidth;
      this._restoreWindowInternal(winElement, null); // Null ratio triggers tiled restore logic
      state.startWinTop = winElement.offsetTop;
    }

    // Reset anchors to current mouse position for smooth continuation
    state.startX = currentX;
    state.startY = currentY;
    state.isRestored = true;
  }

  // 2. Calculate New Position
  let newLeft, newTop;

  if (state.isRestored && state.restoreXRatio !== null) {
    // Dynamic anchoring during restore transition
    const currentWidth = winElement.offsetWidth;
    newLeft = currentX - state.restoreXRatio * currentWidth;
    newTop = Math.max(0, state.startWinTop + (currentY - startY));
  } else {
    // Standard drag
    newLeft =
      state.startWinLeft +
      (state.isRestored ? currentX - state.startX : deltaX);
    newTop = Math.max(
      0,
      state.startWinTop +
        (state.isRestored ? currentY - startY : deltaY),
    );
  }

  winElement.style.left = `${newLeft}px`;
  winElement.style.top = `${newTop}px`;

  // 3. Cleanup State Classes
  if (
    state.isRestored ||
    (!state.initialState.tiled && !state.initialState.maximized)
  ) {
    if (winElement.classList.contains("tiled"))
      winElement.classList.remove("tiled");
    if (winElement.classList.contains("maximized")) {
      winElement.classList.remove("maximized");
      this._updateMaximizeIcon(winElement, false);
    }
  }

  // 4. Snap Detection
  if (state.isDragging) {
    this._detectSnapZone(currentX, currentY);
  }
}

function _detectSnapZone(x, y) {
  const { view } = this._dragState;
  const threshold = this._config.snapThreshold;
  const zoneW = view.w * this._config.edgeDetectionRatio;
  const zoneH = view.h * this._config.edgeDetectionRatio;

  let snap = null;

  if (y < threshold) {
    // Top
    if (x < zoneW) snap = "tl";
    else if (x > view.w - zoneW) snap = "tr";
    else snap = "maximize";
  } else if (x < threshold) {
    // Left
    if (y < zoneH) snap = "tl";
    else if (y > view.h - zoneH) snap = "bl";
    else snap = "left";
  } else if (x > view.w - threshold) {
    // Right
    if (y < zoneH) snap = "tr";
    else if (y > view.h - zoneH) snap = "br";
    else snap = "right";
  } else if (y > view.h - threshold) {
    // Bottom
    snap = x < view.w / 2 ? "bl" : "br";
  }

  if (this._dragState.snap !== snap) {
    this._dragState.snap = snap;
    this._updateSnapIndicator(snap, view.w, view.h);
  }
}

function _handleDragStop() {
  if (!this._dragState?.active) return;

  const { winElement, snap, view } = this._dragState;

  document.removeEventListener("mousemove", this._dragHandlers.move);
  document.removeEventListener("mouseup", this._dragHandlers.stop);

  this._snapIndicator.classList.remove("visible");

  if (snap) {
    if (snap === "maximize") {
      this.toggleMaximize(winElement);
    } else {
      this._snapWindow(winElement, snap, view.w, view.h);
    }
  } else {
    this._savePositionRatios(winElement);
  }

  this._dragState.active = false;
  this._dragState = null;
  this._dragHandlers = null;
}

function _restoreWindowInternal(winElement, xRatio) {
  // Determine target dimensions
  let width, height;
  const savedState = readWindowState(winElement);

  if (xRatio === null) {
    // Tiled Restore
    if (savedState) {
      width = savedState.width;
      height = savedState.height;
    }
  } else {
    // Maximized Restore
    width = savedState?.width || winElement.style.width;
    height = savedState?.height || winElement.style.height;
  }
  if (!width || width === "100%") width = this._config.defaultWidth + "px";
  if (!height || height === "100%")
    height = this._config.defaultHeight + "px";

  // Apply
  winElement.classList.remove("maximized", "tiled");
  this._updateMaximizeIcon(winElement, false);

  // Add restoration class for width/height transition only (no top/left transition)
  winElement.classList.add("window-toggling", "dragging-restore");

  applyWindowState(winElement, { width, height });

  // Cleanup
  setTimeout(() => {
    winElement.classList.remove("window-toggling", "dragging-restore");
    this._savePositionRatios(winElement);
  }, this._config.animationDurationMs);
}

function _updateSnapIndicator(type, vw, vh) {
  if (!type) {
    this._snapIndicator.classList.remove("visible");
    return;
  }

  let layout;
  if (type === "maximize") {
    layout = {
      top: "0px",
      left: "0px",
      width: `${vw}px`,
      height: `${vh}px`,
    };
  } else {
    layout = this._getSnapLayout(type, vw, vh);
  }

  Object.assign(this._snapIndicator.style, layout);
  this._snapIndicator.classList.add("visible");
}

function _snapWindow(winElement, type, vw, vh) {
  // Save current state before tiling for future restoration
  if (!winElement.classList.contains("tiled")) {
    saveWindowState(winElement, "prevState", { includePosition: false });
  }

  winElement.classList.add("window-toggling", "tiled");
  winElement.dataset.snapType = type;

  const layout = this._getSnapLayout(type, vw, vh);
  Object.assign(winElement.style, layout);

  setTimeout(
    () => winElement.classList.remove("window-toggling"),
    this._config.animationDurationMs,
  );
}

function _getSnapLayout(type, vw, vh) {
  const gap = this._config.snapGap;

  // Grid dimensions
  const halfW = (vw - gap * 3) / 2;
  const halfH = (vh - gap * 3) / 2;
  const fullH = vh - gap * 2;

  // Grid coordinates
  const leftX = gap;
  const rightX = halfW + gap * 2;
  const topY = gap;
  const bottomY = halfH + gap * 2;

  const layouts = {
    // Quadrants
    tl: { top: topY, left: leftX, width: halfW, height: halfH },
    tr: { top: topY, left: rightX, width: halfW, height: halfH },
    bl: { top: bottomY, left: leftX, width: halfW, height: halfH },
    br: { top: bottomY, left: rightX, width: halfW, height: halfH },

    // Vertical Splits
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

function _handleResize() {
  const vw = window.innerWidth;
  const vhFull = window.innerHeight;
  const vhTiled = vhFull - this._config.taskbarHeight;

  this._windows.forEach((winElement) => {
    if (
      winElement.classList.contains("tiled") &&
      winElement.dataset.snapType
    ) {
      const type = winElement.dataset.snapType;
      const layout = this._getSnapLayout(type, vw, vhTiled);
      Object.assign(winElement.style, layout);
    } else if (!winElement.classList.contains("maximized")) {
      this._repositionWindowFromRatios(winElement, vw, vhFull);
    }
  });
}

export {
    drag,
    _dragLoop,
    _updateDragPosition,
    _detectSnapZone,
    _handleDragStop,
    _restoreWindowInternal,
    _updateSnapIndicator,
    _snapWindow,
    _getSnapLayout,
    _handleResize
}
