import storageUtil from "../../src/utils/storageUtil.js";

describe("storageUtil", () => {
  let store;

  beforeEach(() => {
    store = {};
    Object.defineProperty(globalThis, "localStorage", {
      configurable: true,
      value: {
        getItem: (key) => (key in store ? store[key] : null),
        setItem: (key, value) => {
          store[key] = String(value);
        },
        removeItem: (key) => {
          delete store[key];
        },
        clear: () => {
          store = {};
        },
      },
    });
  });

  test("set/get roundtrip for objects", () => {
    storageUtil.set("prefs", { a: 1, b: true });

    expect(storageUtil.get("prefs")).toEqual({ a: 1, b: true });
  });

  test("returns default value for missing key", () => {
    expect(storageUtil.get("missing", "fallback")).toBe("fallback");
  });

  test("remove and has work as expected", () => {
    storageUtil.set("key", 42);
    expect(storageUtil.has("key")).toBe(true);

    storageUtil.remove("key");
    expect(storageUtil.has("key")).toBe(false);
  });
});
