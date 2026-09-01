/**
 * Formatting Utility Functions
 */
import { CONFIG } from '../config/config.js';

export function formatPrice(amount, currency = '$') {
    const num = Number(amount) || 0;
    return `${currency}${num.toFixed(2)}`;
}

export function escapeHtml(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}
