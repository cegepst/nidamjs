import { describe, test, expect, vi, beforeEach } from "vitest";
import { createNidamApp } from "../../src/bootstrap/NidamApp.js";
import EventDelegator from "../../src/core/EventDelegator.js";
import TaskbarManager from "../../src/features/taskbar/TaskbarManager.js";
import WindowManager from "../../src/features/window/WindowManager.js";

const createDelegatorStub = () => ({
  on: vi.fn(),
});

describe("Notification Integration", () => {
  beforeEach(() => {
    document.body.innerHTML =
      '<div nd-toast-stack data-position="top-right"></div><section nd-icons="2:2"></section><div id="target"></div>';
    Object.defineProperty(globalThis, "localStorage", {
      value: {
        getItem: vi.fn(() => null),
        setItem: vi.fn(),
        removeItem: vi.fn(),
      },
      configurable: true,
    });
  });

  test("WindowManager uses toast notify", async () => {
    const container = document.querySelector("#target");
    const manager = new WindowManager(container, createDelegatorStub(), {
      config: { maxWindows: 0 },
    });

    await expect(manager.open("test")).rejects.toThrow();

    const toast = document.querySelector(
      '[nd-toast-stack] .nd-toast[data-type="error"]',
    );
    expect(toast).toBeTruthy();
    expect(toast?.textContent).toContain("Maximum of 0 windows allowed");
  });

  test("NidamApp uses default toast notifier", async () => {
    const app = createNidamApp({
      root: document,
      windowManager: {
        config: { maxWindows: 0 },
      },
    }).initialize();

    const manager = app.getModule("window");
    await expect(manager.open("test")).rejects.toThrow();

    const stack = document.querySelector("[nd-toast-stack]");
    const closeButton = document.querySelector(".nd-toast-close");
    expect(stack?.getAttribute("data-position")).toBe("top-right");
    expect(closeButton).toBeTruthy();
  });

  test("taskbar click triggers only one toast", async () => {
    document.body.innerHTML = `
      <div nd-toast-stack data-position="top-right"></div>
      <section nd-icons="2:2"></section>
      <div id="target"></div>
      <div nd-taskbar>
        <button nd-taskbar-icon data-modal="page-one">Page One</button>
      </div>
    `;

    const delegator = new EventDelegator(document);
    const container = document.querySelector("#target");
    const taskbar = document.querySelector("[nd-taskbar]");

    const windowManager = new WindowManager(container, delegator, {
      config: { maxWindows: 0 },
    });
    new TaskbarManager(taskbar, delegator, { windowManager });

    const debugSpy = vi.spyOn(console, "debug").mockImplementation(() => {});
    const button = /** @type {HTMLButtonElement | null} */ (
      document.querySelector("[nd-taskbar-icon]")
    );
    button?.click();
    await Promise.resolve();

    const toasts = document.querySelectorAll(
      '[nd-toast-stack] .nd-toast[data-type="error"]',
    );
    expect(toasts.length).toBe(1);
    debugSpy.mockRestore();
  });

  test("extended taskbar exposes bottom toast offset", () => {
    document.body.innerHTML = `
      <div nd-toast-stack data-position="bottom-right"></div>
      <section nd-icons="2:2"></section>
      <div id="target"></div>
      <div nd-taskbar="extend">
        <button nd-taskbar-icon data-modal="page-one">Page One</button>
      </div>
    `;

    const delegator = new EventDelegator(document);
    const taskbar = document.querySelector("[nd-taskbar]");

    Object.defineProperty(taskbar, "getBoundingClientRect", {
      value: () => ({
        height: 52,
      }),
      configurable: true,
    });

    new TaskbarManager(taskbar, delegator, {});

    expect(
      document.documentElement.style.getPropertyValue(
        "--nd-toast-bottom-offset",
      ),
    ).toBe("52px");
    expect(
      document.documentElement.style.getPropertyValue("--nd-toast-left-offset"),
    ).toBe("0px");
    expect(
      document.documentElement.style.getPropertyValue(
        "--nd-toast-right-offset",
      ),
    ).toBe("0px");
  });

  test("left taskbar exposes left toast offset", () => {
    document.body.innerHTML = `
      <div nd-toast-stack data-position="top-left"></div>
      <section nd-icons="2:2"></section>
      <div id="target"></div>
      <div nd-taskbar nd-taskbar-position="left">
        <button nd-taskbar-icon data-modal="page-one">Page One</button>
      </div>
    `;

    const delegator = new EventDelegator(document);
    const taskbar = document.querySelector("[nd-taskbar]");

    Object.defineProperty(window, "innerWidth", {
      value: 1280,
      configurable: true,
      writable: true,
    });
    Object.defineProperty(taskbar, "getBoundingClientRect", {
      value: () => ({
        width: 68,
        height: 320,
        left: 0,
        right: 68,
      }),
      configurable: true,
    });

    new TaskbarManager(taskbar, delegator, {});

    expect(
      document.documentElement.style.getPropertyValue("--nd-toast-left-offset"),
    ).toBe("68px");
    expect(
      document.documentElement.style.getPropertyValue(
        "--nd-toast-bottom-offset",
      ),
    ).toBe("0px");
  });
});
