/**
 * Router utility for window path matching.
 * Supports exact matches, wildcards (*), and parameter placeholders ({id}).
 */
export default class Router {
  /**
   * Checks if a path matches a given pattern.
   * 
   * Rules:
   * 1. Exact Match: "team" matches "team".
   * 2. Wildcard (*): "team/*" matches "team/5", "team/12/details".
   * 3. Parameters ({id}): "team/{id}" matches "team/5".
   * 
   * @param {string} pattern - The pattern from configuration.
   * @param {string} path - The actual window endpoint path.
   * @param {string|number|null} [entityId=null] - Optional ID to enforce specific parameter matching.
   * @returns {boolean}
   */
  static match(pattern, path, entityId = null) {
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

  /**
   * Normalizes an endpoint/path by removing leading slashes and trimming.
   * 
   * @param {string} path 
   * @returns {string}
   */
  static normalize(path) {
    return String(path || "").trim().replace(/^\/+/, "");
  }
}
