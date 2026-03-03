import { DOMUtils } from "../utils/dom.js";

/** @typedef {import("./EventDelegator.js").default} EventDelegator */

export default class BaseManager {
  _root;
  _elements = {};
  _state = {};
  _utils = DOMUtils;
  _delegator = null;

  /**
   * @param {HTMLElement|string} root - Root element or selector
   * @param {EventDelegator} delegator - Global event delegator instance
   */
  constructor(root, delegator) {
    this._root = typeof root === "string" ? document.querySelector(root) : root;
    this._delegator = delegator;

    if (!this._root) {
      throw new Error(`Root element not found: ${root}`);
    }

    this._initialize();
  }

  /**
   * Initialize the manager (called automatically)
   * @private
   */
  _initialize() {
    this._elements = this._cacheElements();
    this._bindEvents();
  }

  /**
   * Cache DOM elements needed by this manager
   * Override in child classes
   * @returns {Object} Object containing DOM element references
   * @protected
   */
  _cacheElements() {
    return {};
  }

  /**
   * Bind event listeners
   * Override in child classes
   * @protected
   */
  _bindEvents() {
    // Override in child classes
  }

  /**
   * Query a single element within the root
   * @param {string} selector - CSS selector
   * @returns {HTMLElement|null}
   * @protected
   */
  _query(selector) {
    return this._root.querySelector(selector);
  }

  /**
   * Query multiple elements within the root
   * @template {HTMLElement} T
   * @param {string} selector
   * @returns {NodeListOf<T>}
   * @protected
   */
  _queryAll(selector) {
    return this._root.querySelectorAll(selector);
  }

  /**
   * Register scoped event handler
   * @param {string} eventType
   * @param {string} selector
   * @param {Function} handler
   * @protected
   */
  _on(eventType, selector, handler) {
    this._delegator.on(eventType, selector, (e, target) => {
      if (this._root.contains(target)) {
        handler.call(this, e, target);
      }
    });
  }
}
