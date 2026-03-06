import WindowLoader from "../../src/utils/window/WindowLoader.js";

describe("WindowLoader", () => {
  test("resolves endpoints relative to document.baseURI", () => {
    document.head.innerHTML =
      '<base href="https://example.com/nidamjs-showcase/">';

    expect(WindowLoader._defaultResolveEndpoint("/windows/demo.html")).toBe(
      "https://example.com/nidamjs-showcase/windows/demo.html",
    );
    expect(WindowLoader._defaultResolveEndpoint("./windows/demo.html")).toBe(
      "https://example.com/nidamjs-showcase/windows/demo.html",
    );
    expect(WindowLoader._defaultResolveEndpoint(" windows/demo.html ")).toBe(
      "https://example.com/nidamjs-showcase/windows/demo.html",
    );
  });
});
