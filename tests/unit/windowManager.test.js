import WindowManager from "../../src/features/window/WindowManager.js";

const createDelegatorStub = () => ({
  on: vi.fn(),
});

describe("WindowManager", () => {
  test("calls notify and rejects when max windows limit is reached", async () => {
    document.body.innerHTML = `<div id="target"></div>`;
    const container = document.querySelector("#target");
    const delegator = createDelegatorStub();
    const notify = vi.fn();

    const manager = new WindowManager(container, delegator, {
      notify,
      config: { maxWindows: 1 },
      initializeContent: vi.fn(),
      fetchWindowContent: vi.fn(),
    });

    manager._windows.set("a", document.createElement("div"));

    await expect(manager.open("b")).rejects.toThrow("Max windows reached");
    expect(notify).toHaveBeenCalledTimes(1);
    expect(notify.mock.calls[0][0]).toBe("error");
  });

  test("opens a new window and initializes modal content", async () => {
    document.body.innerHTML = `<div id="target"></div>`;
    const container = document.querySelector("#target");
    const delegator = createDelegatorStub();
    const initializeContent = vi.fn();

    const manager = new WindowManager(container, delegator, {
      initializeContent,
      fetchWindowContent: vi.fn(
        async () => `
        <div class="window" style="width: 300px; height: 200px;">
          <div data-bar></div>
          <button data-maximize><i class="fa-solid fa-expand"></i></button>
          <button data-close></button>
          <div class="window-content-scrollable"><div>body</div></div>
        </div>
      `,
      ),
    });

    const win = await manager.open("team/1");

    expect(win).toBeTruthy();
    expect(win.dataset.endpoint).toBe("team/1");
    expect(container.querySelector(".window")).toBe(win);
    expect(initializeContent).toHaveBeenCalledTimes(1);
  });

  test("captures current size before maximize for robust restore", () => {
    document.body.innerHTML = `<div id="target"></div>`;
    const container = document.querySelector("#target");
    const delegator = createDelegatorStub();

    const manager = new WindowManager(container, delegator, {
      initializeContent: vi.fn(),
      fetchWindowContent: vi.fn(),
    });

    const win = document.createElement("div");
    win.className = "window";
    win.innerHTML = `<button data-maximize><i class="fa-expand"></i></button>`;

    Object.defineProperty(win, "offsetWidth", {
      value: 640,
      configurable: true,
    });
    Object.defineProperty(win, "offsetHeight", {
      value: 315,
      configurable: true,
    });

    manager.toggleMaximize(win);

    expect(JSON.parse(win.dataset.prevState)).toMatchObject({
      width: "640px",
      height: "315px",
    });
  });

  test("unmaximize uses restored size for placement when layout metrics are stale", () => {
    document.body.innerHTML = `<div id="target"></div>`;
    const container = document.querySelector("#target");
    const delegator = createDelegatorStub();

    Object.defineProperty(window, "innerWidth", {
      value: 1000,
      configurable: true,
      writable: true,
    });
    Object.defineProperty(window, "innerHeight", {
      value: 800,
      configurable: true,
      writable: true,
    });

    const manager = new WindowManager(container, delegator, {
      initializeContent: vi.fn(),
      fetchWindowContent: vi.fn(),
    });

    const win = document.createElement("div");
    win.className = "window";
    win.innerHTML = `<button data-maximize><i class="fa-expand"></i></button>`;
    win.style.width = "200px";
    win.style.height = "100px";
    win.style.left = "400px";
    win.style.top = "350px";
    win.dataset.xRatio = "0.5";
    win.dataset.yRatio = "0.5";

    let measuredWidth = 200;
    let measuredHeight = 100;
    Object.defineProperty(win, "offsetWidth", {
      get: () => measuredWidth,
      configurable: true,
    });
    Object.defineProperty(win, "offsetHeight", {
      get: () => measuredHeight,
      configurable: true,
    });

    manager.toggleMaximize(win);

    window.innerWidth = 1400;
    window.innerHeight = 900;
    measuredWidth = 1400;
    measuredHeight = 900;

    manager.toggleMaximize(win);

    expect(win.style.left).toBe("600px");
    expect(win.style.top).toBe("400px");
  });

  test("maximize keeps an existing restore size when viewport temporarily constrains window", () => {
    document.body.innerHTML = `<div id="target"></div>`;
    const container = document.querySelector("#target");
    const delegator = createDelegatorStub();

    Object.defineProperty(window, "innerWidth", {
      value: 1000,
      configurable: true,
      writable: true,
    });
    Object.defineProperty(window, "innerHeight", {
      value: 800,
      configurable: true,
      writable: true,
    });

    const manager = new WindowManager(container, delegator, {
      initializeContent: vi.fn(),
      fetchWindowContent: vi.fn(),
    });

    const win = document.createElement("div");
    win.className = "window";
    win.innerHTML = `<button data-maximize><i class="fa-expand"></i></button>`;
    win.dataset.prevState = JSON.stringify({
      width: "640px",
      height: "360px",
      left: "",
      top: "",
    });
    win.dataset.xRatio = "0.5";
    win.dataset.yRatio = "0.5";
    win.style.width = "640px";
    win.style.height = "360px";
    win.style.left = "180px";
    win.style.top = "220px";

    let measuredWidth = 475;
    let measuredHeight = 280;
    Object.defineProperty(win, "offsetWidth", {
      get: () => measuredWidth,
      configurable: true,
    });
    Object.defineProperty(win, "offsetHeight", {
      get: () => measuredHeight,
      configurable: true,
    });

    manager.toggleMaximize(win);

    expect(JSON.parse(win.dataset.prevState)).toMatchObject({
      width: "640px",
      height: "360px",
    });

    window.innerWidth = 1400;
    window.innerHeight = 900;
    measuredWidth = 1400;
    measuredHeight = 900;

    manager.toggleMaximize(win);

    expect(win.style.width).toBe("640px");
    expect(win.style.height).toBe("360px");
  });

  test("tiled window stays tiled after maximize then unmaximize", () => {
    document.body.innerHTML = `<div id="target"></div>`;
    const container = document.querySelector("#target");
    const delegator = createDelegatorStub();

    Object.defineProperty(window, "innerWidth", {
      value: 1000,
      configurable: true,
      writable: true,
    });
    Object.defineProperty(window, "innerHeight", {
      value: 800,
      configurable: true,
      writable: true,
    });

    const manager = new WindowManager(container, delegator, {
      initializeContent: vi.fn(),
      fetchWindowContent: vi.fn(),
    });

    const win = document.createElement("div");
    win.className = "window tiled";
    win.dataset.snapType = "left";
    win.innerHTML = `<button data-maximize><i class="fa-expand"></i></button>`;

    manager.toggleMaximize(win);

    window.innerWidth = 1400;
    window.innerHeight = 900;

    manager.toggleMaximize(win);

    const expected = manager._getSnapLayout("left", 1400, 900 - 64);
    expect(win.classList.contains("tiled")).toBe(true);
    expect(win.style.left).toBe(expected.left);
    expect(win.style.top).toBe(expected.top);
    expect(win.style.width).toBe(expected.width);
    expect(win.style.height).toBe(expected.height);
  });

  test("maximize from tiled preserves original restore size", () => {
    document.body.innerHTML = `<div id="target"></div>`;
    const container = document.querySelector("#target");
    const delegator = createDelegatorStub();

    Object.defineProperty(window, "innerWidth", {
      value: 1000,
      configurable: true,
      writable: true,
    });
    Object.defineProperty(window, "innerHeight", {
      value: 800,
      configurable: true,
      writable: true,
    });

    const manager = new WindowManager(container, delegator, {
      initializeContent: vi.fn(),
      fetchWindowContent: vi.fn(),
    });

    const win = document.createElement("div");
    win.className = "window tiled";
    win.dataset.snapType = "left";
    win.innerHTML = `<button data-maximize><i class="fa-expand"></i></button>`;
    win.style.width = "600px";
    win.style.height = "500px";
    win.dataset.prevState = JSON.stringify({
      width: "320px",
      height: "240px",
    });

    Object.defineProperty(win, "offsetWidth", {
      value: 600,
      configurable: true,
    });
    Object.defineProperty(win, "offsetHeight", {
      value: 500,
      configurable: true,
    });

    manager.toggleMaximize(win);

    window.innerWidth = 1400;
    window.innerHeight = 900;
    manager.toggleMaximize(win);

    manager._restoreWindowInternal(win, null);

    expect(JSON.parse(win.dataset.prevState)).toMatchObject({
      width: "320px",
      height: "240px",
    });
    expect(win.style.width).toBe("320px");
    expect(win.style.height).toBe("240px");
  });
});
