import { featureRegistry } from "../features/registry.js";

export default class ContentInitializer {
  static #initializedElements = new WeakSet();

  /**
   * Initializes features within a container.
   * @param {Object} delegator - The event delegator.
   * @param {Document|Element} container - The root element to search for features.
   * @param {Object} [modules=null] - Optional modules to pass to feature initializers.
   */
  static initialize(delegator, container = document, modules = null) {
    featureRegistry.forEach(({ selector, init, name }) => {
      const elements = container.querySelectorAll(selector);
      elements.forEach((element) => {
        try {
          const instance = init(element, delegator, modules);
          this.#initializedElements.add(element);

          if (name && instance && modules) {
            modules.set(name, instance);
          }
        } catch (error) {
          console.warn(`Failed to initialize ${selector}:`, error);
        }
      });
    });
  }
}
