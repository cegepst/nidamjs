import { describe, test, expect, vi, beforeEach, afterEach } from "vitest";
import {
  createToastNotify,
  showToast,
  toastNotify,
} from "../../src/utils/toast.js";

describe("Toast Utility", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
  });

  test("showToast creates stack and toast", () => {
    showToast("success", "Test message");

    const container = document.querySelector("[nd-toast-stack]");
    expect(container).toBeTruthy();

    const toast = container.querySelector('.nd-toast[data-type="success"]');
    expect(toast).toBeTruthy();
    expect(toast?.textContent).toContain("Test message");
  });

  test("showToast handles multiple messages", () => {
    showToast("error", ["Error 1", "Error 2"]);

    const toast = document.querySelector('.nd-toast[data-type="error"]');
    const listItems = toast?.querySelectorAll("li") || [];
    expect(listItems.length).toBe(2);
    expect(listItems[0].textContent).toBe("Error 1");
    expect(listItems[1].textContent).toBe("Error 2");
  });

  test("toastNotify maps levels to toast types", () => {
    toastNotify("error", "Failed operation");

    const toast = document.querySelector('.nd-toast[data-type="error"]');
    expect(toast).toBeTruthy();
    expect(toast?.textContent).toContain("Failed operation");
  });

  test("supports position option", () => {
    showToast("info", "bottom left", { position: "bottom-left" });

    const container = document.querySelector("[nd-toast-stack]");
    expect(container?.getAttribute("data-position")).toBe("bottom-left");
  });

  test("supports disabling close button", () => {
    showToast("info", "No close", { closable: false });

    const closeButton = document.querySelector(".nd-toast-close");
    expect(closeButton).toBeNull();
  });

  test("removes toast after timeout", () => {
    showToast("info", "Short timeout", { duration: 10 });

    expect(document.querySelector(".nd-toast")).toBeTruthy();
    vi.advanceTimersByTime(10 + 220);
    expect(document.querySelector(".nd-toast")).toBeNull();
  });

  test("close button removes the toast", () => {
    showToast("info", "Click to close");

    const toast = document.querySelector(".nd-toast");
    const closeBtn = toast?.querySelector("button");

    closeBtn?.click();

    expect(toast?.getAttribute("data-state")).toBe("closing");
    vi.advanceTimersByTime(250);
    expect(document.querySelector(".nd-toast")).toBeNull();
  });

  test("createToastNotify applies default options", () => {
    const notify = createToastNotify({
      position: "bottom-right",
      duration: 0,
      closable: false,
    });

    notify("warn", "Heads up");

    const container = document.querySelector("[nd-toast-stack]");
    const toast = document.querySelector('.nd-toast[data-type="warning"]');

    expect(container?.getAttribute("data-position")).toBe("bottom-right");
    expect(toast).toBeTruthy();
    expect(document.querySelector(".nd-toast-close")).toBeNull();
  });
});
