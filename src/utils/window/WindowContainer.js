/**
 * Utility for ensuring the modal container exists within the nd-desktop environment.
 */
export default class WindowContainer {
  /**
   * Finds or creates the modal container within an [nd-desktop] element.
   *
   * @param {Document|HTMLElement} root - The search root
   * @param {string} selector - The container selector (e.g., "#target")
   * @returns {HTMLElement|null} The container element
   */
  static ensure(root, selector) {
    if (typeof document === "undefined") return null;

    let container = root.querySelector(selector);
    if (container) return container;

    const desktop = root.querySelector("[nd-desktop]");
    if (!desktop) return null;

    container = document.createElement("div");

    if (selector.startsWith("#")) {
      container.id = selector.slice(1);
    }
    
    container.className = "demo-target";
    container.setAttribute("data-pending-modal", "");

    const taskbar = desktop.querySelector("[nd-taskbar]");
    if (taskbar) {
      desktop.insertBefore(container, taskbar);
    } else {
      desktop.appendChild(container);
    }

    return container;
  }
}
