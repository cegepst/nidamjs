/**
 * Helper to handle server response event emission (refresh).
 * Parses composite event strings (e.g., "category:action:id") into
 * separate event names and IDs for the WindowRefresher.
 *
 * @param {Object} refresher - The WindowRefresher instance.
 * @param {Object} payload - The server response payload containing 'emit', 'type', etc.
 */
export function handleRefreshEvent(refresher, payload) {
  if (!refresher || !payload || payload.type !== "success" || !payload.emit) {
    return;
  }

  let emitEvent = payload.emit;
  let id = payload.id || null;
  const parts = emitEvent.split(":");

  // Extract ID if the emit string is in format "category:action:id"
  // Example: "algorithm:restored:123" -> event: "algorithm:restored", id: "123"
  if (parts.length >= 3) {
    id = parts.pop();
    emitEvent = parts.join(":");
  }

  refresher.handleEvent(emitEvent, { ...payload, emit: emitEvent, id });
}
