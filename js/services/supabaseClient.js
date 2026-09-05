/**
 * Supabase Client & Data Access Layer with Offline/Mock fallback
 */
import { CONFIG } from '../config/config.js';
import { INITIAL_MENU_ITEMS } from '../data/mockData.js';
import { StorageService } from './storageService.js';

let supabase = null;

// Initialize Supabase if credentials are valid and SDK is loaded
const supabaseUrl = (typeof window !== 'undefined' && window.__ENV__?.SUPABASE_URL) || CONFIG.SUPABASE.URL;
const supabaseAnonKey = (typeof window !== 'undefined' && window.__ENV__?.SUPABASE_ANON_KEY) || CONFIG.SUPABASE.ANON_KEY;

if (typeof window !== 'undefined' && window.supabase && supabaseUrl && supabaseAnonKey && supabaseUrl.trim() !== '' && supabaseAnonKey.trim() !== '') {
    try {
        supabase = window.supabase.createClient(supabaseUrl.trim(), supabaseAnonKey.trim());
    } catch (err) {
        console.info('[SupabaseClient] Initialization skipped/failed, using local mock data:', err);
    }
}

export function getSupabaseClient() {
    return supabase;
}

export const MenuService = {
    /**
     * Fetch all dishes (combining Supabase or Mock data + any locally added items)
     */
    async getDishes() {
        let dishes = [];

        if (supabase) {
            try {
                const { data, error } = await supabase
                    .from(CONFIG.SUPABASE.TABLE_DISHES)
                    .select('*')
                    .order('id', { ascending: true });

                if (!error && data && data.length > 0) {
                    dishes = data;
                }
            } catch (err) {
                console.warn('[MenuService] Supabase fetch error, falling back to local data:', err);
            }
        }

        if (dishes.length === 0) {
            // Load base mock items
            dishes = [...INITIAL_MENU_ITEMS];
            
            // Merge any locally stored user-created custom dishes
            const customDishes = StorageService.get(CONFIG.STORAGE_KEYS.CUSTOM_DISHES, []);
            if (Array.isArray(customDishes) && customDishes.length > 0) {
                dishes = [...dishes, ...customDishes];
            }
        }

        return dishes;
    },

    /**
     * Add a new dish to Supabase or fallback to LocalStorage
     */
    async addDish(dishData) {
        if (supabase) {
            try {
                const { data, error } = await supabase
                    .from(CONFIG.SUPABASE.TABLE_DISHES)
                    .insert([dishData])
                    .select();

                if (!error && data && data.length > 0) {
                    return { success: true, data: data[0], source: 'supabase' };
                }
            } catch (err) {
                console.warn('[MenuService] Supabase insert error, saving locally:', err);
            }
        }

        // Fallback: save to LocalStorage
        const customDishes = StorageService.get(CONFIG.STORAGE_KEYS.CUSTOM_DISHES, []);
        const newDish = {
            ...dishData,
            id: Date.now()
        };
        customDishes.push(newDish);
        StorageService.set(CONFIG.STORAGE_KEYS.CUSTOM_DISHES, customDishes);

        return { success: true, data: newDish, source: 'local' };
    }
};

export const VipService = {
    async registerMember(memberData) {
        if (supabase) {
            try {
                const { data, error } = await supabase
                    .from(CONFIG.SUPABASE.TABLE_VIP)
                    .insert([memberData]);
                if (!error) return { success: true };
            } catch (err) {
                console.warn('[VipService] Error saving VIP to cloud:', err);
            }
        }
        return { success: true };
    }
};
