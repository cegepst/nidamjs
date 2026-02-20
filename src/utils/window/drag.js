export default class Drag {
  /**
   * Initialise le processus de drag
   * @param {MouseEvent} e
   * @param {HTMLElement} winElement
   * @param {Object} config - Configuration (dragThreshold, taskbarHeight)
   * @param {Object} state - Objet d'état à remplir (géré par le manager)
   * @param {Object} callbacks - Fonctions de rappel (onRestore, onMaximize, onSnap, etc.)
   */
  static drag(e, winElement, config, state, callbacks) {
    if (state.active) return;

    // Initialisation de l'état local du drag
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

    const stopHandler = () => Drag._handleDragStop(config, state, callbacks);

    state._moveHandler = moveHandler; // Stocké pour pouvoir le supprimer

    document.addEventListener("mousemove", moveHandler, { passive: true });
    document.addEventListener("mouseup", stopHandler, { once: true });

    requestAnimationFrame(() => Drag._dragLoop(config, state, callbacks));
  }

  static _dragLoop(config, state, callbacks) {
    if (!state.active) return;
    Drag._updateDragPosition(config, state, callbacks);
    requestAnimationFrame(() => Drag._dragLoop(config, state, callbacks));
  }

  static _updateDragPosition(config, state, callbacks) {
    const { winElement, currentX, currentY, startX, startY } = state;

    const deltaX = currentX - startX;
    const deltaY = currentY - startY;

    // Détection du seuil de mouvement pour considérer que le drag a commencé
    if (!state.isDragging && (Math.abs(deltaX) > config.dragThreshold || Math.abs(deltaY) > config.dragThreshold)) {
      state.isDragging = true;
    }

    if (!state.isDragging) return;

    // Gestion de la sortie du mode maximisé/tuilé
    if ((state.initialState.tiled || state.initialState.maximized) && !state.isRestored) {
      if (state.initialState.maximized) {
        state.restoreXRatio = startX / window.innerWidth;
        callbacks.onRestore(winElement, state.restoreXRatio, true);
        state.startWinTop = 0;
      } else {
        state.restoreXRatio = (startX - winElement.offsetLeft) / winElement.offsetWidth;
        callbacks.onRestore(winElement, null, false);
        state.startWinTop = winElement.offsetTop;
      }

      state.startX = currentX;
      state.startY = currentY;
      state.isRestored = true;
    }

    // Calcul de la position
    let newLeft, newTop;
    if (state.isRestored && state.restoreXRatio !== null) {
      newLeft = currentX - state.restoreXRatio * winElement.offsetWidth;
      newTop = Math.max(0, state.startWinTop + (currentY - startY));
    } else {
      newLeft = state.startWinLeft + (state.isRestored ? currentX - startX : deltaX);
      newTop = Math.max(0, state.startWinTop + (state.isRestored ? currentY - startY : deltaY));
    }

    winElement.style.left = `${newLeft}px`;
    winElement.style.top = `${newTop}px`;

    // Nettoyage visuel immédiat
    if (state.isRestored || (!state.initialState.tiled && !state.initialState.maximized)) {
      winElement.classList.remove("tiled", "maximized");
      callbacks.onUpdateMaximizeIcon(winElement, false);
    }

    // Zone de snap
    const snap = callbacks.detectSnapZone(currentX, currentY, state.view);
    if (state.snap !== snap) {
      state.snap = snap;
      callbacks.updateSnapIndicator(snap, state.view);
    }
  }

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
