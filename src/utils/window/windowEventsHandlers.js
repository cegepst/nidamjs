import Lifecycle from "./lifecycle.js";
import Drag from "./drag.js";

export default class WindowEvents {
  static _handleModalTrigger(manager, e, target) {
    e.preventDefault();
    Lifecycle.open(manager, target.dataset.modal).catch((err) => {
      console.debug("Modal trigger failed:", err);
    });
  }

  static _handleCloseTrigger(manager, e, target) {
    e.preventDefault();
    const winElement = target.closest(".window");
    if (winElement) Lifecycle.close(manager, winElement);
  }

  static _handleWindowFocus(manager, e, target) {
    if (e.target.closest("[data-close]") || e.target.closest("[data-modal]")) return;
    const winElement = target.closest(".window");
    if (winElement) Lifecycle._focusWindow(manager, winElement);
  }

  static _handleMaximizeTrigger(manager, e, target) {
    e.preventDefault();
    const winElement = target.closest(".window");
    if (winElement) manager.toggleMaximize(winElement);
  }

  static _handleWindowDragStart(manager, e, target) {
    if (e.target.closest("[data-close]") || e.target.closest("[data-maximize]")) return;
    e.preventDefault();
    const winElement = target.closest(".window");
    if (winElement) {
      Lifecycle._focusWindow(manager, winElement);
      Drag.drag(manager, e, winElement);
    }
  }

  static _handleGlobalKeydown(manager, e) {
    if (e.key === "Escape" && !e.repeat) {
      Lifecycle._closeTopmostWindow(manager);
    }
  }
}
