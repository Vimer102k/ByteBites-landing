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
    // Supabase Configuration - Fill in your credentials when connecting cloud DB
    SUPABASE: {
        URL: '',
        ANON_KEY: '',
        TABLE_DISHES: 'dishes',
        TABLE_VIP: 'vip_members',
        TABLE_ORDERS: 'orders'
    },
    // Telegram Bot API Configuration
    TELEGRAM: {
        BOT_TOKEN: '8518807306:AAEPeFrcclNxCv7sGPIn8ohUDG6BIJaBMn8',
        CHAT_ID: '5595887601'
    },
    DEFAULT_IMAGE_FALLBACK: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=800&auto=format&fit=crop',
    DELIVERY_FEE: 0.00,
    CURRENCY_SYMBOL: '$'
};
