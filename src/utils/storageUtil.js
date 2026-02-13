const storageUtil = {
  /**
   * Saves a value to localStorage. Automatically stringifies objects/arrays.
   * @param {string} key 
   * @param {*} value 
   */
  set(key, value) {
    try {
      const serializedValue = JSON.stringify(value);
      localStorage.setItem(key, serializedValue);
    } catch (error) {
      console.error(`Error saving to localStorage (key: ${key}):`, error);
    }
  },

  /**
   * Retrieves a value from localStorage. Automatically parses JSON.
   * @param {string} key 
   * @param {*} defaultValue - Returned if the key doesn't exist or on error.
   * @returns {*}
   */
  get(key, defaultValue = null) {
    try {
      const serializedValue = localStorage.getItem(key);
      if (serializedValue === null) {
        return defaultValue;
      }
      return JSON.parse(serializedValue);
    } catch (error) {
      console.error(`Error reading from localStorage (key: ${key}):`, error);
      return defaultValue;
    }
  },

  /**
   * Removes a specific item from localStorage.
   * @param {string} key 
   */
  remove(key) {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error(`Error removing from localStorage (key: ${key}):`, error);
    }
  },

  /**
   * Clears ALL items from localStorage for this domain.
   */
  clear() {
    try {
      localStorage.clear();
    } catch (error) {
      console.error('Error clearing localStorage:', error);
    }
  },

  /**
   * Checks if a key exists in localStorage.
   * @param {string} key 
   * @returns {boolean}
   */
  has(key) {
    try {
      return localStorage.getItem(key) !== null;
    } catch (error) {
      return false;
    }
  }
};

export default storageUtil;
