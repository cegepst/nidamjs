/**
 * @typedef {{width: string, height: string, left: string, top: string}} WindowGeometry
 * @typedef {{includePosition?: boolean}} CaptureWindowStateOptions
 * @typedef {{includePosition?: boolean}} ApplyWindowStateOptions
 */

/**
 * Cache parsed JSON states by element/key to avoid repeated JSON.parse.
 * @type {WeakMap<HTMLElement, Map<string, {raw: string, parsed: WindowGeometry|null}>>}
 */
const stateParseCache = new WeakMap();

/**
 * @param {string|undefined} value
 * @returns {string}
 */
function normalizeCssValue(value) {
  if (!value || value === "auto" || value === "normal") return "";
  return value;
}

/**
 * @param {number} value
 * @returns {string}
 */
function toPx(value) {
  if (!Number.isFinite(value)) return "";
  return `${Math.round(value)}px`;
}

/**
 * Capture the current geometry of a window element.
 * Uses layout/inline values first and only falls back to computed style lazily.
 *
 * @param {HTMLElement} winElement
 * @param {CaptureWindowStateOptions} [options]
 * @returns {WindowGeometry}
 */
export function captureWindowState(winElement, options = {}) {
  const includePosition = options.includePosition === true;
  /** @type {CSSStyleDeclaration|null} */
  let computed = null;
  const getComputed = () => {
    if (!computed) computed = window.getComputedStyle(winElement);
    return computed;
  };

  const width =
    (winElement.offsetWidth > 0 ? toPx(winElement.offsetWidth) : "") ||
    normalizeCssValue(winElement.style.width) ||
    normalizeCssValue(getComputed().width);

  const height =
    (winElement.offsetHeight > 0 ? toPx(winElement.offsetHeight) : "") ||
    normalizeCssValue(winElement.style.height) ||
    normalizeCssValue(getComputed().height);

  let left = "";
  let top = "";
  if (includePosition) {
    left =
      toPx(winElement.offsetLeft) ||
      normalizeCssValue(winElement.style.left) ||
      normalizeCssValue(getComputed().left);
    top =
      toPx(winElement.offsetTop) ||
      normalizeCssValue(winElement.style.top) ||
      normalizeCssValue(getComputed().top);
  }

  return {
    width: width || "",
    height: height || "",
    left,
    top,
  };
}

/**
 * @param {HTMLElement} winElement
 * @returns {Map<string, {raw: string, parsed: WindowGeometry|null}>}
 */
function getElementCache(winElement) {
  let byKey = stateParseCache.get(winElement);
  if (!byKey) {
    byKey = new Map();
    stateParseCache.set(winElement, byKey);
  }
  return byKey;
}

/**
 * Save the current window geometry to a dataset key.
 *
 * @param {HTMLElement} winElement
 * @param {string} [key="prevState"]
 * @param {CaptureWindowStateOptions} [options]
 * @returns {WindowGeometry}
 */
export function saveWindowState(winElement, key = "prevState", options = {}) {
  const state = captureWindowState(winElement, options);
  const raw = JSON.stringify(state);
  winElement.dataset[key] = raw;
  getElementCache(winElement).set(key, { raw, parsed: state });
  return state;
}

/**
 * Read a saved window geometry from a dataset key.
 *
 * @param {HTMLElement} winElement
 * @param {string} [key="prevState"]
 * @returns {WindowGeometry|null}
 */
export function readWindowState(winElement, key = "prevState") {
  const raw = winElement.dataset[key];
  if (!raw) return null;

  const cached = getElementCache(winElement).get(key);
  if (cached && cached.raw === raw) {
    return cached.parsed;
  }

  try {
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") {
      getElementCache(winElement).set(key, { raw, parsed: null });
      return null;
    }
    const state = {
      width: normalizeCssValue(parsed.width),
      height: normalizeCssValue(parsed.height),
      left: normalizeCssValue(parsed.left),
      top: normalizeCssValue(parsed.top),
    };
    getElementCache(winElement).set(key, { raw, parsed: state });
    return state;
  } catch {
    getElementCache(winElement).set(key, { raw, parsed: null });
    return null;
  }
}

export function ensureRestoreState(winElement) {
  const savedState = readWindowState(winElement);
  if (savedState?.width && savedState?.height) return savedState;
  return saveWindowState(winElement, "prevState", { includePosition: false });
}

/**
 * Apply a saved window geometry back to element styles.
 * Only writes styles that are different to avoid unnecessary style invalidations.
 *
 * @param {HTMLElement} winElement
 * @param {Partial<WindowGeometry>|null} state
 * @param {ApplyWindowStateOptions} [options]
 * @returns {boolean}
 */
export function applyWindowState(winElement, state, options = {}) {
  if (!state || typeof state !== "object") return false;

  if (state.width && winElement.style.width !== state.width) {
    winElement.style.width = state.width;
  }
  if (state.height && winElement.style.height !== state.height) {
    winElement.style.height = state.height;
  }

  if (options.includePosition) {
    if (state.left && winElement.style.left !== state.left) {
      winElement.style.left = state.left;
    }
    if (state.top && winElement.style.top !== state.top) {
      winElement.style.top = state.top;
    }
  }

  return true;
}


