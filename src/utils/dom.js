export const DOMUtils = {
  /**
   * Move text cursor to the end of an editable element
   * @param {HTMLElement} element - Target element
   */
  moveCursorToEnd(element) {
    const range = document.createRange();
    range.selectNodeContents(element);
    range.collapse(false);

    const selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(range);
  },

  /**
   * Register a callback for ESC key press
   * Automatically removes listener after first trigger
   * @param {Function} callback - Function to call on ESC press
   * @returns {Function} Handler function for manual removal
   */
  onEscape(callback) {
    const handler = (e) => {
      if (e.key === "Escape") {
        callback();
        document.removeEventListener("keydown", handler);
      }
    };
    document.addEventListener("keydown", handler);
    return handler;
  },

  /**
   * Hide elements by adding 'hidden' class
   * @param {...HTMLElement} elements - Elements to hide
   */
  hide(...elements) {
    elements.forEach((el) => el?.classList.add("hidden"));
  },

  /**
   * Show elements by removing 'hidden' class
   * @param {...HTMLElement} elements - Elements to show
   */
  show(...elements) {
    elements.forEach((el) => el?.classList.remove("hidden"));
  },

  /**
   * Toggle visibility of elements
   * @param {...HTMLElement} elements - Elements to toggle
   */
  toggle(...elements) {
    elements.forEach((el) => el?.classList.toggle("hidden"));
  },
};
