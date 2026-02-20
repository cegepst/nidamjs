import Router from "../../utils/window/router.js";

/**
 * WindowRefresher handles silent refreshes and dependency-based closure of windows.
 * It reacts to server-sent events or custom application events.
 */
export default class WindowRefresher {
  /** @type {Object} Map of event names to path patterns */
  #refreshMap;
  
  /** @type {number} Delay in ms before triggering a refresh/close */
  #refreshTimeout;

  /**
   * @param {Object} windowProvider - An object providing window management methods (getWindows, open, close).
   * @param {Object} options - Configuration options.
   */
  constructor(windowProvider, { refreshMap = null, refreshTimeout = 200 } = {}) {
    this._provider = windowProvider;
    this.#refreshMap = refreshMap || window.window_refresh_map || {};
    this.#refreshTimeout = refreshTimeout;
  }

  /**
   * Updates the refresh mapping at runtime.
   */
  setRefreshMap(refreshMap = {}) {
    this.#refreshMap = refreshMap || {};
  }

  /**
   * Processes an incoming event and triggers window actions.
   * 
   * @param {string} eventName - The event identifier (e.g., "user:updated").
   * @param {Object} payload - Data associated with the event (must contain id for param matching).
   */
  handleEvent(eventName, payload) {
    if (!this._provider) return;

    const [category, action] = eventName.split(":");
    const isDestructive = action === "deleted";
    const entityId = payload?.id || null;
    const patterns = this.#refreshMap[eventName] || [];

    this._provider.getWindows().forEach(([endpoint, winElement]) => {
      const currentPath = Router.normalize(endpoint);

      // 1. Dependency-based Closure
      if (isDestructive && entityId && winElement.dataset.dependsOn) {
        if (this._shouldCloseByDependency(winElement.dataset.dependsOn, category, entityId)) {
          setTimeout(() => this._provider.close(winElement), this.#refreshTimeout);
          return; // Skip further processing for this window
        }
      }

      // 2. Standard Refresh Mapping
      const shouldRefresh = patterns.some(pattern => 
        Router.match(pattern, currentPath, isDestructive ? null : entityId)
      );

      if (shouldRefresh) {
        setTimeout(() => {
          // Re-open with force=true and activate=false for silent refresh
          this._provider.open(endpoint, true, null, false);
        }, this.#refreshTimeout);
      }
    });
  }

  /**
   * Checks if a window should be closed based on its data-depends-on attribute.
   * Format: "category:id|category:id"
   * 
   * @private
   */
  _shouldCloseByDependency(dependsOn, category, entityId) {
    const dependencies = dependsOn.split("|");
    return dependencies.some((dep) => {
      const [depCategory, depId] = dep.split(":");
      return category === depCategory && String(depId) === String(entityId);
    });
  }
}
