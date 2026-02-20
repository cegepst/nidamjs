import ContentInitializer from "../core/ContentInitializer.js";
import EventDelegator from "../core/EventDelegator.js";
import WindowManager from "../features/window/WindowManager.js";
import WindowRefresher from "../features/window/WindowRefresher.js";
import defaultConfig, { defaultNotify } from "../nidam.config.js";

export default class NidamApp {
  #config;
  #modules = new Map();
  #delegator = null;

  constructor(config = {}) {
    let parsedConfig = this._parseConfig(config);

    this.#config = {
      ...defaultConfig,
      ...parsedConfig,
    };
  }

  initialize() {
    this.#initializeEventDelegation();
    this.#initializeWindowManagement();
    this.#initializeStaticContent();
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

    const refresher = new WindowRefresher(windowManager, {
      refreshMap: this.#config.refreshMap,
      refreshTimeout: this.#config.refreshTimeout,
    });
    this.#modules.set("refresher", refresher);
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
    let parsedConfig = {};
    if (typeof config === "string") {
      try {
        parsedConfig = JSON.parse(config);
      } catch (e) {
        defaultNotify("error", "Parsing error, falling back to default settings.");
        parsedConfig = {};
      }
    }
    return parsedConfig;
  }
}

export const createNidamApp = (config = {}) => new NidamApp(config);
