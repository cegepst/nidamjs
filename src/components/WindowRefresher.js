/**
 * WindowRefresher
 * Handles silent refreshes on specific windows based on server events.
 * Configuration is provided by the backend via window.window_refresh_map.
 */
export default class WindowRefresher {
  #windowManager;
  #refreshMap;
  #refreshTimeout = 200;

  constructor(windowManager) {
    this.#windowManager = windowManager;
    this.#refreshMap = window.window_refresh_map || {};
  }

  handleEvent(eventName, payload) {
    const patterns = this.#refreshMap[eventName];
    const [category, action] = eventName.split(":");
    const isDestructive = action === "deleted";
    const entityId = payload?.id || null;

    if (!this.#windowManager) return;

    Array.from(this.#windowManager._windows.entries()).forEach(
      ([endpoint, winElement]) => {
        const currentPath = endpoint.startsWith("/")
          ? endpoint.slice(1)
          : endpoint;

        // 1. Dependency-based Closure
        if (isDestructive && entityId && winElement.dataset.dependsOn) {
          const dependencies = winElement.dataset.dependsOn.split("|");
          const shouldClose = dependencies.some((dep) => {
            const [depCategory, depId] = dep.split(":");
            return (
              category === depCategory && String(depId) === String(entityId)
            );
          });

          if (shouldClose) {
            setTimeout(() => {
              this.#windowManager.close(winElement);
            }, this.#refreshTimeout); // timeout to match the refresh
            return; // Stop processing this window
          }
        }

        // 2. Standard Refresh Mapping
        if (patterns) {
          patterns.forEach((pattern) => {
            // Refresh if it matches the route (either specifically or generally)
            if (
              this.#matchRoute(
                pattern,
                currentPath,
                isDestructive ? null : entityId,
              )
            ) {
              setTimeout(() => {
                this.#windowManager.open(endpoint, true, null, false);
              }, this.#refreshTimeout); // timeout to match the refresh
            }
          });
        }
      },
    );
  }

  /**
   * Matches a route pattern against an actual path with strict validation.
   *
   * Rules:
   * 1. Exact Match: "team" matches "team", but NOT "team/5" (length mismatch).
   * 2. Wildcard (*): "team/*" matches "team/5", "team/12/details", etc.
   * 3. Parameters ({param}): "team/{id}" matches "team/5".
   *    - If entityId is provided, it MUST match the parameter value (e.g. entityId "5" matches "team/5", but not "team/12").
   *    - Parameter syntax must be enclosed in braces: {id}.
   *
   * @param {string} pattern - The route pattern from configuration.
   * @param {string} path - The actual window endpoint path.
   * @param {string|null} entityId - Optional ID to enforce specific parameter matching.
   */
  #matchRoute(pattern, path, entityId = null) {
    if (pattern === path) return true;

    const patternSegments = pattern.split("/");
    const pathSegments = path.split("/");

    // Strict length check unless the last segment is a wildcard
    const hasWildcard = patternSegments[patternSegments.length - 1] === "*";
    if (!hasWildcard && patternSegments.length !== pathSegments.length) {
      return false;
    }

    return patternSegments.every((seg, i) => {
      // If we've reached the wildcard, everything else matches
      if (seg === "*") return true;

      // Strict Parameter Syntax: {param}
      const isParam = seg.startsWith("{") && seg.endsWith("}");
      if (isParam) {
        if (entityId !== null) {
          return String(pathSegments[i]) === String(entityId);
        }
        return true;
      }
      return seg === pathSegments[i];
    });
  }
}
