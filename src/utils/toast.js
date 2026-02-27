const TOAST_STACK_SELECTOR = "[nd-toast-stack]";
const VALID_TYPES = new Set(["info", "success", "error", "warning"]);
const VALID_POSITIONS = new Set([
  "top-right",
  "top-left",
  "bottom-right",
  "bottom-left",
]);
const DEFAULT_DISMISS_MS = 220;
const DEFAULT_OPTIONS = {
  duration: 3000,
  closable: true,
  /** @type {"top-right"|"top-left"|"bottom-right"|"bottom-left"} */
  position: "top-right",
};

/**
 * @typedef {"info"|"success"|"error"|"warning"} ToastType
 * @typedef {"top-right"|"top-left"|"bottom-right"|"bottom-left"} ToastPosition
 * @typedef {Object} ToastOptions
 * @property {number} [duration] - Auto-dismiss timeout in ms. Use <= 0 to disable.
 * @property {boolean} [closable] - Whether to render the close button.
 * @property {ToastPosition} [position] - Stack position in the viewport.
 */

/**
 * @typedef {Object} NotifyOptions
 * @property {number} [duration] - Auto-dismiss timeout in ms. Use <= 0 to disable.
 * @property {boolean} [closable] - Whether to render the close button.
 * @property {ToastPosition} [position] - Stack position in the viewport.
 */

/**
 * @param {unknown} value
 * @returns {value is ToastPosition}
 */
const isValidPosition = (value) =>
  typeof value === "string" && VALID_POSITIONS.has(value);

/**
 * @param {ToastOptions|undefined} options
 * @returns {{ duration: number, closable: boolean, position: ToastPosition }}
 */
const normalizeOptions = (options) => {
  const duration = Number.isFinite(options?.duration)
    ? Number(options.duration)
    : DEFAULT_OPTIONS.duration;
  const closable =
    typeof options?.closable === "boolean"
      ? options.closable
      : DEFAULT_OPTIONS.closable;
  const position = isValidPosition(options?.position)
    ? options.position
    : DEFAULT_OPTIONS.position;

  return {
    duration,
    closable,
    position,
  };
};

/**
 * @param {ToastPosition} position
 * @returns {HTMLElement | null}
 */
const ensureContainer = (position) => {
  if (typeof document === "undefined") return null;

  let container = /** @type {HTMLElement|null} */ (
    document.querySelector(TOAST_STACK_SELECTOR)
  );
  if (!container) {
    container = document.createElement("div");
    container.setAttribute("nd-toast-stack", "");
    document.body.appendChild(container);
  }

  container.setAttribute("data-position", position);
  return container;
};

/**
 * @param {unknown} messages
 * @returns {string[]}
 */
const normalizeMessages = (messages) => {
  if (typeof messages === "string") {
    return messages.trim() ? [messages] : [];
  }

  if (Array.isArray(messages)) {
    return messages
      .filter(Boolean)
      .flatMap((message) => {
        if (typeof message === "object" && message !== null) {
          return normalizeMessages(message);
        }
        return String(message).trim();
      })
      .filter(Boolean);
  }

  if (messages && typeof messages === "object") {
    const bag = /** @type {Record<string, unknown>} */ (messages);
    if (bag.errors) {
      return normalizeMessages(bag.errors);
    }

    return Object.values(bag)
      .flatMap((value) => normalizeMessages(value))
      .filter(Boolean);
  }

  return [];
};

/**
 * @param {string[]} messageList
 * @returns {HTMLElement}
 */
const buildContent = (messageList) => {
  const wrapper = document.createElement("div");
  wrapper.className = "nd-toast-content";

  if (messageList.length <= 1) {
    const span = document.createElement("span");
    span.textContent = messageList[0];
    wrapper.appendChild(span);
    return wrapper;
  }

  const list = document.createElement("ul");
  list.className = "nd-toast-list";
  messageList.forEach((message) => {
    const item = document.createElement("li");
    item.textContent = message;
    list.appendChild(item);
  });
  wrapper.appendChild(list);
  return wrapper;
};

/**
 * @param {HTMLElement} container
 * @param {HTMLElement} toast
 * @returns {void}
 */
const removeToast = (container, toast) => {
  toast.setAttribute("data-state", "closing");
  window.setTimeout(() => {
    toast.remove();
    if (!container.childElementCount) {
      container.remove();
    }
  }, DEFAULT_DISMISS_MS);
};

/**
 * @param {HTMLElement} container
 * @param {HTMLElement} toast
 * @param {number} timeoutId
 * @returns {HTMLButtonElement}
 */
const createCloseButton = (container, toast, timeoutId) => {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "nd-toast-close";
  button.setAttribute("aria-label", "Close notification");
  button.textContent = "x";
  button.addEventListener("click", () => {
    if (timeoutId) {
      window.clearTimeout(timeoutId);
    }
    removeToast(container, toast);
  });
  return button;
};

/**
 * @param {HTMLElement} container
 * @param {HTMLElement} toast
 * @param {number} duration
 * @returns {number}
 */
const scheduleRemoval = (container, toast, duration) => {
  if (duration <= 0) return 0;
  return window.setTimeout(() => {
    removeToast(container, toast);
  }, duration);
};

/**
 * @param {ToastType|string} type
 * @param {unknown} messages
 * @param {ToastOptions} [options]
 * @returns {number | undefined}
 */
export const showToast = (type, messages, options = undefined) => {
  if (typeof window === "undefined" || typeof document === "undefined") {
    return undefined;
  }

  const messageList = normalizeMessages(messages);
  if (!messageList.length) return undefined;

  const resolvedType = VALID_TYPES.has(type) ? type : "info";
  const resolvedOptions = normalizeOptions(options);
  const container = ensureContainer(resolvedOptions.position);
  if (!container) return undefined;

  const toast = document.createElement("div");
  toast.className = "nd-toast";
  toast.setAttribute("data-type", resolvedType);
  toast.setAttribute("data-state", "open");
  toast.appendChild(buildContent(messageList));

  const timeoutId = scheduleRemoval(container, toast, resolvedOptions.duration);
  if (resolvedOptions.closable) {
    toast.appendChild(createCloseButton(container, toast, timeoutId));
  }

  container.appendChild(toast);
  return resolvedOptions.duration;
};

/**
 * @param {string} level
 * @returns {ToastType}
 */
const resolveTypeFromLevel = (level) => {
  if (level === "error") return "error";
  if (level === "warn" || level === "warning") return "warning";
  if (level === "success") return "success";
  return "info";
};

/**
 * @param {NotifyOptions} [defaultOptions]
 * @returns {(level: string, message: unknown) => void}
 */
export const createToastNotify = (defaultOptions = {}) => {
  const resolvedDefaults = normalizeOptions(defaultOptions);
  return (level, message) => {
    const type = resolveTypeFromLevel(level);
    showToast(type, message, resolvedDefaults);
  };
};

export const toastNotify = createToastNotify();
