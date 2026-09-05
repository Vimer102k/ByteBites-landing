/**
 * Application Configuration
 */
export const CONFIG = {
    APP_NAME: 'ByteBites Cafe',
    DEFAULT_LANG: 'ru',
    SUPPORTED_LANGS: ['ru', 'en', 'uz'],
    STORAGE_KEYS: {
        CART: 'bytebites_cart_v2',
        LANG: 'bytebites_user_lang',
        THEME: 'bytebites_theme',
        CUSTOM_DISHES: 'bytebites_custom_dishes'
    },
    // Supabase Configuration - Fill in your project URL and public Anon Key to enable Cloud Database & Edge Functions
    SUPABASE: {
        URL: 'https://qrrvvnymmjbbanflgvxm.supabase.co', // e.g. 'https://your-project-ref.supabase.co'
        ANON_KEY: 'sb_publishable_BShghNM3hvr41CWsQIY7Mw_JsOnBFyj', // e.g. 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
        TABLE_DISHES: 'dishes',
        TABLE_VIP: 'vip_members',
        TABLE_ORDERS: 'orders'
    },
    // Telegram is securely handled via Supabase Edge Function ('send-telegram-order')
    DEFAULT_IMAGE_FALLBACK: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=800&auto=format&fit=crop',
    DELIVERY_FEE: 0.00,
    CURRENCY_SYMBOL: '$'
};
