export default class ContentInitializer {
  static #initializedElements = new WeakSet();

  /**
   * Initialize feature modules in a container.
   *
   * @param {Object} delegator - Shared EventDelegator instance.
   * @param {Document|Element} container - Container to scan.
   * @param {Map|null} modules - Shared module registry.
   * @param {Array<{selector:string, init:Function, name?:string}>} registry - Feature definitions.
   */
  static initialize(
    delegator,
    container = document,
    modules = null,
    registry = [],
  ) {
    if (!Array.isArray(registry) || registry.length === 0) {
      return;
    }

    registry.forEach(({ selector, init, name }) => {
      if (!selector || typeof init !== "function") {
        return;
      }

      const elements = container.querySelectorAll(selector);
      elements.forEach((element) => {
        if (this.#initializedElements.has(element)) {
          return;
        }

        try {
          const instance = init(element, delegator, modules);
          this.#initializedElements.add(element);

          if (
            name &&
            instance &&
            modules &&
            typeof modules.set === "function"
          ) {
            modules.set(name, instance);
          }
        } catch (error) {
          console.warn(`Failed to initialize ${selector}:`, error);
        }
      });
    });
  }
}
