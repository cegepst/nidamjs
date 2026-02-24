export { };

declare global {
  interface Window {
    window_refresh_map?: Record<string, string[]>;
  }
}
