/**
 * WindowLoader handles fetching and routing for window content.
 * It supports both dynamic network requests and static HTML templates.
 * This class is static and operates on a context provided by the caller.
 */
export default class WindowLoader {
  /**
   * Loads window content for a given endpoint.
   *
   * @param {string} endpoint - The route or identifier.
   * @param {Object} options - Additional options for the fetch.
   * @param {Object} context - Context containing flags (isStatic, resolveEndpoint).
   * @returns {Promise<string>} The HTML content.
   */
  static async load(endpoint, options, context) {
    const { isStatic, resolveEndpoint } = context;

    // 1. Static Template Strategy
    if (isStatic) {
      const templateContent = WindowLoader._getStaticTemplateContent(endpoint);
      if (templateContent !== null) {
        return templateContent;
      }
      throw new Error(`Static route not found: ${String(endpoint || "")}`);
    }

    // 2. Network Fetch Strategy
    const url = (resolveEndpoint || WindowLoader._defaultResolveEndpoint)(
      endpoint,
    );

    const response = await fetch(url, {
      headers: { "X-Modal-Request": "1" },
      cache: "no-cache",
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch window content: ${response.statusText}`);
    }

    return response.text();
  }

  /**
   * Default implementation to resolve an endpoint to a URL.
   *
   * @param {string} endpoint
   * @returns {string} The resolved URL.
   */
  static _defaultResolveEndpoint(endpoint) {
    const normalized = String(endpoint || "").replace(/^\/+/, "");
    return `/${normalized}`;
  }

  /**
   * Normalizes an endpoint by trimming and removing leading slashes.
   *
   * @param {string} endpoint
   * @returns {string}
   */
  static _normalizeEndpoint(endpoint) {
    return String(endpoint || "")
      .trim()
      .replace(/^\/+/, "");
  }

  /**
   * Builds a list of potential route candidates for static template matching.
   * (e.g., "team/details.html" -> ["team/details.html", "details.html", "team/details", "details"])
   *
   * @param {string} endpoint
   * @returns {string[]}
   */
  static _buildStaticRouteCandidates(endpoint) {
    const normalized = WindowLoader._normalizeEndpoint(endpoint);
    const candidates = [];
    const addCandidate = (value) => {
      const item = String(value || "").trim();
      if (!item || candidates.includes(item)) {
        return;
      }
      candidates.push(item);
    };

    addCandidate(normalized);
    const lastSegment = normalized.split("/").pop();
    addCandidate(lastSegment);

    if (normalized.endsWith(".html")) {
      addCandidate(normalized.slice(0, -5));
    }
    if (lastSegment && lastSegment.endsWith(".html")) {
      addCandidate(lastSegment.slice(0, -5));
    }

    return candidates;
  }

  /**
   * Searches for a <template> element with a matching data-route attribute.
   *
   * @param {string} endpoint
   * @returns {string|null} The template content or null if not found.
   */
  static _getStaticTemplateContent(endpoint) {
    const templates = document.querySelectorAll("template[data-route]");
    if (!templates.length) return null;

    const routes = new Map();
    templates.forEach((template) => {
      const route = template.getAttribute("data-route");
      if (!route) return;
      routes.set(route.trim(), template.innerHTML);
    });

    const candidates = WindowLoader._buildStaticRouteCandidates(endpoint);
    for (const candidate of candidates) {
      if (routes.has(candidate)) {
        return routes.get(candidate);
      }
    }

    return null;
  }
}
