import { StoryResponse } from "../types";

const CACHE_KEY_PREFIX = 'loen_lesson_cache_';
const MAX_CACHE_ENTRIES = 50;

interface CacheEntry {
    data: StoryResponse;
    timestamp: number;
}

export const getCachedLesson = (text: string): StoryResponse | null => {
    try {
        const key = CACHE_KEY_PREFIX + btoa(encodeURIComponent(text.trim())).slice(0, 32); // Simple hash-like key
        const cached = localStorage.getItem(key);
        if (!cached) return null;

        const entry: CacheEntry = JSON.parse(cached);
        // Optional: expire after 7 days? For now keep indefinitely until LRU eviction
        return entry.data;
    } catch (e) {
        console.error("Cache retrieval failed", e);
        return null;
    }
};

export const cacheLesson = (text: string, data: StoryResponse) => {
    try {
        const key = CACHE_KEY_PREFIX + btoa(encodeURIComponent(text.trim())).slice(0, 32);
        const entry: CacheEntry = {
            data,
            timestamp: Date.now()
        };

        localStorage.setItem(key, JSON.stringify(entry));
        manageCacheSize();
    } catch (e) {
        console.error("Cache storage failed", e);
    }
};

const manageCacheSize = () => {
    try {
        const keys = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith(CACHE_KEY_PREFIX)) {
                keys.push(key);
            }
        }

        if (keys.length > MAX_CACHE_ENTRIES) {
            // Sort by timestamp if we could read them all, but for speed just delete random or oldest
            // Let's read timestamps
            const entries = keys.map(k => {
                try {
                    return { key: k, ...JSON.parse(localStorage.getItem(k) || '{}') };
                } catch {
                    return { key: k, timestamp: 0 };
                }
            });

            // Sort oldest first
            entries.sort((a: any, b: any) => a.timestamp - b.timestamp);

            // Delete excess
            const toDelete = entries.slice(0, keys.length - MAX_CACHE_ENTRIES);
            toDelete.forEach((e: any) => localStorage.removeItem(e.key));
        }
    } catch (e) {
        console.warn("Cache cleanup failed", e);
    }
};
