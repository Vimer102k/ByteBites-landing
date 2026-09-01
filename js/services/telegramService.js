/**
 * Telegram Bot API Notification Service
 */
import { CONFIG } from '../config/config.js';

export const TelegramService = {
    /**
     * Send formatted order notification to Telegram chat/channel via Bot API
     * @param {Object} orderDetails - Object containing order info, customer details, and item list
     * @returns {Promise<Object>} Result object indicating success state or error message
     */
    async sendOrder(orderDetails) {
        const botToken = CONFIG.TELEGRAM?.BOT_TOKEN;
        const chatId = CONFIG.TELEGRAM?.CHAT_ID;

        // Verify that botToken and chatId are present in CONFIG
        if (!botToken || !chatId) {
            const errorMsg = 'Telegram botToken or chatId is missing in CONFIG.';
            console.error('[TelegramService]', errorMsg);
            throw new Error(errorMsg);
        }

        const { orderId, customer, items, subtotal, deliveryFee, total, timestamp } = orderDetails;

        // Build itemized list of ordered dishes
        const itemsListText = (items || []).map(item => {
            const itemTotal = (Number(item.price) * Number(item.quantity)).toFixed(2);
            return `• <b>${item.name}</b> x${item.quantity} — $${itemTotal}`;
        }).join('\n');

        // Construct HTML formatted message for Telegram
        const message = `
🍔 <b>NEW ORDER ${orderId}</b>

👤 <b>Customer Info:</b>
• <b>Name:</b> ${customer?.name || 'N/A'}
• <b>Phone:</b> ${customer?.phone || 'N/A'}
• <b>Method:</b> ${customer?.method === 'delivery' ? '🚗 Delivery' : '🏪 Pickup'}
${customer?.method === 'delivery' && customer?.address ? `• <b>Address:</b> ${customer.address}\n` : ''}${customer?.notes ? `• <b>Notes:</b> ${customer.notes}\n` : ''}
🛒 <b>Ordered Items:</b>
${itemsListText || 'No items listed'}

💰 <b>Payment Summary:</b>
• <b>Subtotal:</b> $${Number(subtotal || 0).toFixed(2)}
• <b>Delivery Fee:</b> $${Number(deliveryFee || 0).toFixed(2)}
• <b>Total Amount:</b> <b>$${Number(total || 0).toFixed(2)}</b>

⏰ <b>Order Timestamp:</b> ${timestamp || new Date().toLocaleString()}
`.trim();

        // Perform Telegram API fetch request with error handling
        try {
            const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    chat_id: chatId,
                    text: message,
                    parse_mode: 'HTML'
                })
            });

            const data = await response.json();

            // Check HTTP response status and Telegram API result flag
            if (!response.ok || !data.ok) {
                const apiError = data.description || `Telegram API returned error (HTTP ${response.status})`;
                console.error('[TelegramService] API error response:', data);
                throw new Error(apiError);
            }

            console.log('[TelegramService] Order notification sent successfully:', data);
            return { success: true, data };

        } catch (error) {
            console.error('[TelegramService] Network or Telegram API error:', error);
            throw error;
        }
    }
};
