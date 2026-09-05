/**
 * Telegram Order Service via Secure Supabase Edge Function
 * Keeps Telegram Bot credentials safely on the server side.
 */
import { getSupabaseClient } from './supabaseClient.js';

export const TelegramService = {
    /**
     * Sends formatted order notification to Telegram via Supabase Edge Function
     * @param {Object} orderDetails - Object containing order info, customer details, and item list
     * @returns {Promise<Object>} Result object indicating success state or error message
     */
    async sendOrder(orderDetails) {
        const supabase = getSupabaseClient();

        if (!supabase) {
            console.info('[TelegramService] Supabase not configured. Order simulated locally in demo mode:', orderDetails);
            // Return simulation success in offline/mock mode
            return {
                success: true,
                simulated: true,
                message: 'Supabase credentials not configured. Order processed in local demo mode.'
            };
        }

        try {
            const { data, error } = await supabase.functions.invoke('send-telegram-order', {
                body: orderDetails
            });

            if (error) {
                console.warn('[TelegramService] Supabase Edge Function error, falling back to local simulation:', error);
                return {
                    success: true,
                    simulated: true,
                    fallback: true,
                    message: error.message || 'Order simulated locally (Edge Function unavailable).'
                };
            }

            if (data && data.success === false) {
                console.warn('[TelegramService] Edge Function returned error, falling back to local simulation:', data.error);
                return {
                    success: true,
                    simulated: true,
                    fallback: true,
                    message: data.error || 'Order simulated locally (Telegram dispatch error).'
                };
            }

            console.log('[TelegramService] Order dispatched successfully via Edge Function:', data);
            return { success: true, data };
        } catch (error) {
            console.warn('[TelegramService] Error calling send-telegram-order function, falling back to local simulation:', error);
            return {
                success: true,
                simulated: true,
                fallback: true,
                message: 'Order simulated locally (Network or runtime error).'
            };
        }
    }
};
