export { };

declare global {
  interface Window {
    window_refresh_map?: Record<string, string[]>;
    nidamConfig?: import("../nidam.config.js").NidamConfig;
  }
}
