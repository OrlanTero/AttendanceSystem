class AsyncStorage {
  constructor() {
    this.storage = window.localStorage;
  }

  async setItem(key, value) {
    try {
      await Promise.resolve(this.storage.setItem(key, JSON.stringify(value)));
      return true;
    } catch (error) {
      console.error("Error saving data", error);
      return false;
    }
  }

  async getItem(key) {
    try {
      const item = await Promise.resolve(this.storage.getItem(key));
      return item ? JSON.parse(item) : null;
    } catch (error) {
      console.error("Error reading data", error);
      return null;
    }
  }

  async removeItem(key) {
    try {
      await Promise.resolve(this.storage.removeItem(key));
      return true;
    } catch (error) {
      console.error("Error removing data", error);
      return false;
    }
  }

  async clear() {
    try {
      await Promise.resolve(this.storage.clear());
      return true;
    } catch (error) {
      console.error("Error clearing data", error);
      return false;
    }
  }
}

export const storage = new AsyncStorage();
