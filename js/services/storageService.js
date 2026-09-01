/**
 * Storage Service - Safe LocalStorage abstractions
 */
export const StorageService = {
    get(key, defaultValue = null) {
        try {
            const raw = localStorage.getItem(key);
            if (raw === null) return defaultValue;
            return JSON.parse(raw);
        } catch (e) {
            console.warn(`[StorageService] Failed to parse key "${key}":`, e);
            return defaultValue;
        }
    },

    set(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
            return true;
        } catch (e) {
            console.error(`[StorageService] Failed to set key "${key}":`, e);
            return false;
        }
    },

    remove(key) {
        try {
            localStorage.removeItem(key);
            return true;
        } catch (e) {
            console.error(`[StorageService] Failed to remove key "${key}":`, e);
            return false;
        }
    }
};
