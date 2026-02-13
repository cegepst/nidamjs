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
});
