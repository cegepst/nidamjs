import ContentInitializer from "../core/ContentInitializer.js";
import EventDelegator from "../core/EventDelegator.js";
import IconManager from "../features/desktop/IconManager.js";
import WindowManager from "../features/window/WindowManager.js";
import WindowRefresher from "../features/window/WindowRefresher.js";
import defaultConfig from "../nidam.config.js";
import TaskbarManager from "../features/taskbar/TaskbarManager.js";
import { createToastNotify, toastNotify } from "../utils/toast.js";

export default class NidamApp {
  #config;
  #modules = new Map();
  #delegator = null;
  /**
   * @param {import('../nidam.config.js').NidamConfig | string} config - The app configuration object or JSON string.
   */
  constructor(config = {}) {
    const parsedConfig = this._parseConfig(config);

    this.#config = {
      ...defaultConfig,
      ...parsedConfig,
    };
  }

  initialize() {
    this.#initializeEventDelegation();
    this.#initializeWindowManagement();
    this.#initializeStaticContent();
    this.#initializeIconManager();
    return this;
  }

  getModule(name) {
    return this.#modules.get(name);
  }

  getModules() {
    return this.#modules;
  }

  #initializeEventDelegation() {
    this.#delegator = new EventDelegator(this.#config.root);
    this.#modules.set("delegator", this.#delegator);
  }

  #initializeWindowManagement() {
    const container = this.#config.root.querySelector(
      this.#config.modalContainer,
    );
    if (!container) {
      return;
    }

    const windowManager = new WindowManager(container, this.#delegator, {
      getModules: () => this.#modules,
      initializeContent: (root, ctx) =>
        ContentInitializer.initialize(
          ctx.delegator,
          root,
          ctx.modules,
          this.#config.registry,
        ),
      notify: this.#config.notify,
      ...(this.#config.windowManager || {}),
    });

    this.#modules.set("window", windowManager);
    this.#openPendingWindow(container, windowManager);

    const taskbarElement = this.#config.root.querySelector("[nd-taskbar]");
    if (taskbarElement) {
      const taskbarManager = new TaskbarManager(
        taskbarElement,
        this.#delegator,
        {
          windowManager: windowManager,
        },
      );
      this.#modules.set("taskbar", taskbarManager);
    }

    const refresher = new WindowRefresher(windowManager, {
      refreshMap: this.#config.refreshMap,
      refreshTimeout: this.#config.refreshTimeout,
    });
    this.#modules.set("refresher", refresher);
  }

  #initializeIconManager() {
    const iconManager = new IconManager("[nd-icons]", this.#delegator);
    this.#modules.set("icon", iconManager);
  }

  #openPendingWindow(container, windowManager) {
    const key = this.#config.pendingModalDatasetKey;
    const pending = (container?.dataset?.[key] || "").trim();
    if (!pending) {
      return;
    }

    const normalized = pending.startsWith("/") ? pending.slice(1) : pending;
    windowManager.open(normalized);
  }

  #initializeStaticContent() {
    ContentInitializer.initialize(
      this.#delegator,
      this.#config.root,
      this.#modules,
      this.#config.registry,
    );
  }

  _parseConfig(config) {
    const normalizeNotify = (notifyConfig) => {
      if (typeof notifyConfig === "function") {
        return notifyConfig;
      }
      if (notifyConfig && typeof notifyConfig === "object") {
        return createToastNotify(
          /** @type {import("../utils/toast.js").NotifyOptions} */ (notifyConfig),
        );
      }
      return toastNotify;
    };

    if (typeof config === "string") {
      try {
        const parsed = JSON.parse(config);
        return {
          ...parsed,
          notify: normalizeNotify(parsed?.notify),
        };
      } catch (e) {
        toastNotify(
          "error",
          "Parsing error, falling back to default settings.",
        );
        return { notify: toastNotify };
      }
    }

    const parsed = config || {};
    return {
      ...parsed,
      notify: normalizeNotify(parsed.notify),
    };
  }

}

export const createNidamApp = (config = {}) => new NidamApp(config);
