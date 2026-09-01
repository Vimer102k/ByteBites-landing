/**
 * Dedicated Checkout Page Controller
 */
import { cartStore } from '../state/cartStore.js';
import { formatPrice, escapeHtml } from '../utils/formatters.js';
import { toast } from '../components/toast.js';
import { TelegramService } from '../services/telegramService.js';

export async function initCheckoutPage() {
    const listEl = document.getElementById('checkout-items-summary');
    const subtotalEl = document.getElementById('checkout-page-subtotal');
    const totalEl = document.getElementById('checkout-page-total');
    const form = document.getElementById('checkout-order-form');

    function renderSummary() {
        const items = cartStore.getItems();
        const subtotal = cartStore.getSubtotal();
        const total = cartStore.getTotal();

        if (subtotalEl) subtotalEl.textContent = formatPrice(subtotal);
        if (totalEl) totalEl.textContent = formatPrice(total);

        if (listEl) {
            if (items.length === 0) {
                listEl.innerHTML = `
                    <div class="py-8 text-center text-gray-400">
                        <p>Ваша корзина пуста. Добавьте блюда для оформления заказа.</p>
                    </div>
                `;
                return;
            }

            listEl.innerHTML = items.map(item => `
                <div class="flex items-center justify-between py-3 border-b border-brand-border/60 text-sm">
                    <div class="flex items-center gap-3">
                        <span class="font-bold text-brand-primary">${item.quantity}x</span>
                        <span class="text-white font-medium">${escapeHtml(item.name)}</span>
                    </div>
                    <span class="font-semibold text-gray-300">${formatPrice(item.price * item.quantity)}</span>
                </div>
            `).join('');
        }
    }

    renderSummary();
    window.addEventListener('cart:updated', renderSummary);

    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            if (cartStore.getCount() === 0) {
                toast.error('Корзина пуста');
                return;
            }

            const submitBtn = form.querySelector('button[type="submit"]');
            const originalBtnHtml = submitBtn ? submitBtn.innerHTML : '';

            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.classList.add('opacity-75', 'cursor-not-allowed');
                submitBtn.innerHTML = `<i class="fa-solid fa-circle-notch fa-spin"></i> <span>Отправка заказа...</span>`;
            }

            const formData = new FormData(form);
            const nameInput = form.querySelector('input[type="text"]');
            const phoneInput = form.querySelector('input[type="tel"]');
            const addressInput = form.querySelector('textarea');
            const paymentInput = form.querySelector('input[name="payment"]:checked');

            const orderId = `#BB-${Math.floor(10000 + Math.random() * 90000)}`;

            try {
                const result = await TelegramService.sendOrder({
                    orderId,
                    customer: {
                        name: nameInput?.value || 'N/A',
                        phone: phoneInput?.value || 'N/A',
                        method: 'delivery',
                        address: addressInput?.value || 'N/A',
                        notes: `Payment: ${paymentInput?.value === 'cash' ? 'Cash on Delivery' : 'Bank Card'}`
                    },
                    items: [...cartStore.getItems()],
                    subtotal: cartStore.getSubtotal(),
                    deliveryFee: 0.00,
                    total: cartStore.getTotal(),
                    timestamp: new Date().toLocaleString()
                });

                if (result && result.success === false) {
                    throw new Error(result.error?.description || result.error || 'Ошибка отправки заказа');
                }

                // Success state
                cartStore.clear();
                const successBanner = document.getElementById('checkout-success-view');
                const formContainer = document.getElementById('checkout-form-container');

                if (formContainer) formContainer.classList.add('hidden');
                if (successBanner) successBanner.classList.remove('hidden');
                toast.show("Order Sent! We will call you back shortly", "success");

            } catch (err) {
                console.error('[Checkout Page Error]', err);
                toast.show(err.message || "Ошибка отправки заказа", "error");
            } finally {
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.classList.remove('opacity-75', 'cursor-not-allowed');
                    submitBtn.innerHTML = originalBtnHtml;
                }
            }
        });
    }
}
