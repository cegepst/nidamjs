export default class EventDelegator {
  #handlers = new Map();
  /** @type {Document | HTMLElement} */
  #root;
  #eventListeners = new Map();

  /**
   * @param {Document | HTMLElement} root
   */
  constructor(root = document) {
    this.#root = root;
    this.#initDelegation();
  }

  #initDelegation() {
    const events = [
      "click",
      "input",
      "change",
      "focusin",
      "focusout",
      "keydown",
      "mousedown",
      "desktop:toggle-matrix",
      "desktop:theme-changed",
    ];

    events.forEach((eventType) => {
      const listener = (e) => this.#dispatch(eventType, e);
      this.#root.addEventListener(eventType, listener);
      this.#eventListeners.set(eventType, listener);
    });
  }

  #dispatch(eventType, e) {
    const handlers = this.#handlers.get(eventType);
    if (!handlers || handlers.length === 0) return;

    for (const { selector, handler } of handlers) {
      if (!selector) {
        // Global handler (in case there is noo selector)
        handler.call(this.#root, e, this.#root);
        continue;
      }

      const target = e.target.closest(selector);
      if (target) {
        handler.call(target, e, target);
      }
    }
  }

  /**
   * Register an event handler.
   * @param {string} eventType
   * @param {string|null} selector
   * @param {(e: Event, target: Element|Document) => void} handler
   * @param {{group?: string}} [options]
   */
  on(eventType, selector, handler, options = {}) {
    const group = options.group;
    if (!this.#handlers.has(eventType)) this.#handlers.set(eventType, []);
    const ref = { selector, handler, group };
    this.#handlers.get(eventType).push(ref);
    return ref;
  }

  off(eventType, ref) {
    const arr = this.#handlers.get(eventType);
    if (!arr) return;
    const i = arr.indexOf(ref);
    if (i !== -1) arr.splice(i, 1);
    if (!arr.length) this.#handlers.delete(eventType);
  }

  destroy() {
    for (const [eventType, listener] of this.#eventListeners) {
      this.#root.removeEventListener(eventType, listener);
    }

    this.#eventListeners.clear();
    this.#handlers.clear();
  }
}
