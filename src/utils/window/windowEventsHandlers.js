function _handleModalTrigger(e, target) {
    e.preventDefault();
    this.open(target.dataset.modal).catch((err) => {
        console.debug("Modal trigger failed:", err);
    });
}

function _handleCloseTrigger(e, target) {
    e.preventDefault();
    const winElement = target.closest(".window");
    if (winElement) this.close(winElement);
}

function _handleWindowFocus(e, target) {
    if (e.target.closest("[data-close]") || e.target.closest("[data-modal]"))
        return;
    const winElement = target.closest(".window");
    if (winElement) this._focusWindow(winElement);
}

function _handleMaximizeTrigger(e, target) {
    e.preventDefault();
    const winElement = target.closest(".window");
    if (winElement) this.toggleMaximize(winElement);
}

function _handleWindowDragStart(e, target) {
    if (e.target.closest("[data-close]") || e.target.closest("[data-maximize]"))
        return;
    e.preventDefault();
    const winElement = target.closest(".window");

    if (winElement) {
        this._focusWindow(winElement);
        this.drag(e, winElement);
    }
}

function _handleGlobalKeydown(e) {
    if (e.key === "Escape" && !e.repeat) {
        this._closeTopmostWindow();
    }
}

export {
    _handleModalTrigger,
    _handleCloseTrigger,
    _handleWindowFocus,
    _handleMaximizeTrigger,
    _handleWindowDragStart,
    _handleGlobalKeydown
}
