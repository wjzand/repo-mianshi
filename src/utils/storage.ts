export function getItem<T>(key: string, defaultValue?: T): T | null {
  try {
    const item = localStorage.getItem(key);
    if (item === null) {
      return defaultValue !== undefined ? defaultValue : null;
    }
    return JSON.parse(item) as T;
  } catch {
    return defaultValue !== undefined ? defaultValue : null;
  }
}

export function setItem<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error('Error saving to localStorage:', error);
  }
}

export function removeItem(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch (error) {
    console.error('Error removing from localStorage:', error);
  }
}

export function clearAll(): void {
  try {
    localStorage.clear();
  } catch (error) {
    console.error('Error clearing localStorage:', error);
  }
}
