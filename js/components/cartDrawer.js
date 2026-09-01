/**
 * Cart Drawer Slide-over Component
 */
import { cartStore } from '../state/cartStore.js';
import { formatPrice, escapeHtml } from '../utils/formatters.js';
import { t } from '../i18n/i18n.js';
import { toast } from './toast.js';

import { TelegramService } from '../services/telegramService.js';

export function initCartDrawer() {
    const drawer = document.getElementById('cart-drawer');
    const backdrop = document.getElementById('cart-backdrop');
    const openBtns = document.querySelectorAll('.btn-open-cart, #navbar-cart-btn');
    const closeBtn = document.getElementById('close-cart-btn');
    const clearBtn = document.getElementById('clear-cart-btn');
    const itemsContainer = document.getElementById('cart-items-container');
    const emptyState = document.getElementById('cart-empty-state');
    const summaryFooter = document.getElementById('cart-summary-footer');
    const countBadge = document.getElementById('cart-drawer-count');
    const subtotalEl = document.getElementById('cart-subtotal-val');
    const totalEl = document.getElementById('cart-total-val');
    const checkoutBtn = document.getElementById('cart-checkout-btn');

    function openDrawer() {
        if (!drawer || !backdrop) return;
        backdrop.classList.remove('hidden');
        drawer.classList.remove('translate-x-full');
        document.body.style.overflow = 'hidden';
    }

    function closeDrawer() {
        if (!drawer || !backdrop) return;
        drawer.classList.add('translate-x-full');
        setTimeout(() => {
            backdrop.classList.add('hidden');
            document.body.style.overflow = '';
        }, 250);
    }

    openBtns.forEach(btn => btn.addEventListener('click', (e) => {
        e.preventDefault();
        openDrawer();
    }));

    if (closeBtn) closeBtn.addEventListener('click', closeDrawer);
    if (backdrop) backdrop.addEventListener('click', closeDrawer);

    // Close on Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && drawer && !drawer.classList.contains('translate-x-full')) {
            closeDrawer();
        }
    });

    // Clear cart button
    if (clearBtn) {
        clearBtn.addEventListener('click', () => {
            if (cartStore.getCount() > 0) {
                cartStore.clear();
                toast.info('toasts.cleared');
            }
        });
    }

    function renderCart() {
        const items = cartStore.getItems();
        const count = cartStore.getCount();
        const subtotal = cartStore.getSubtotal();
        const total = cartStore.getTotal();

        if (countBadge) countBadge.textContent = count;
        if (subtotalEl) subtotalEl.textContent = formatPrice(subtotal);
        if (totalEl) totalEl.textContent = formatPrice(total);

        if (items.length === 0) {
            if (itemsContainer) itemsContainer.innerHTML = '';
            if (emptyState) emptyState.classList.remove('hidden');
            if (summaryFooter) summaryFooter.classList.add('hidden');
            return;
        }

        if (emptyState) emptyState.classList.add('hidden');
        if (summaryFooter) summaryFooter.classList.remove('hidden');

        if (itemsContainer) {
            itemsContainer.innerHTML = items.map(item => {
                console.log(item.image);
                return `
                <div class="flex items-center gap-3.5 p-3 rounded-xl bg-brand-surface border border-brand-border/80 group">
                    <img 
                        src="${item.image}" 
                        alt="${escapeHtml(item.name)}" 
                        onerror="this.onerror=null; this.src='https://images.unsplash.com/photo-1576107232684-1279f3908594?q=80&w=300';"
                        class="w-16 h-16 rounded-lg object-cover flex-shrink-0"
                    >
                    <div class="flex-1 min-w-0">
                        <h4 class="text-sm font-bold text-white truncate group-hover:text-brand-primary transition-colors">
                            ${escapeHtml(item.name)}
                        </h4>
                        <span class="text-xs font-semibold text-brand-primary">${formatPrice(item.price)}</span>
                        
                        <div class="flex items-center gap-2.5 mt-2">
                            <button 
                                data-cart-dec="${item.id}"
                                class="w-6 h-6 rounded-md bg-brand-card hover:bg-brand-primary text-gray-300 hover:text-white flex items-center justify-center text-xs transition-colors">
                                <i class="fa-solid fa-minus text-[10px]"></i>
                            </button>
                            <span class="text-xs font-bold text-white px-1.5">${item.quantity}</span>
                            <button 
                                data-cart-inc="${item.id}"
                                class="w-6 h-6 rounded-md bg-brand-card hover:bg-brand-primary text-gray-300 hover:text-white flex items-center justify-center text-xs transition-colors">
                                <i class="fa-solid fa-plus text-[10px]"></i>
                            </button>
                        </div>
                    </div>

                    <button 
                        data-cart-del="${item.id}"
                        class="text-gray-500 hover:text-red-400 p-2 text-sm transition-colors"
                        aria-label="Remove item">
                        <i class="fa-regular fa-trash-can"></i>
                    </button>
                </div>
            `;
            }).join('');

            // Attach cart action events
            itemsContainer.querySelectorAll('[data-cart-inc]').forEach(b => {
                b.addEventListener('click', (e) => {
                    const id = e.currentTarget.getAttribute('data-cart-inc');
                    cartStore.updateQuantity(id, 1);
                });
            });

            itemsContainer.querySelectorAll('[data-cart-dec]').forEach(b => {
                b.addEventListener('click', (e) => {
                    const id = e.currentTarget.getAttribute('data-cart-dec');
                    cartStore.updateQuantity(id, -1);
                });
            });

            itemsContainer.querySelectorAll('[data-cart-del]').forEach(b => {
                b.addEventListener('click', (e) => {
                    const id = e.currentTarget.getAttribute('data-cart-del');
                    cartStore.removeItem(id);
                    toast.info('toasts.removed');
                });
            });
        }
    }

    // Checkout handler
    if (checkoutBtn) {
        checkoutBtn.addEventListener('click', async () => {
            if (cartStore.getCount() === 0) return;

            const originalBtnContent = checkoutBtn.innerHTML;
            checkoutBtn.disabled = true;
            checkoutBtn.classList.add('opacity-75', 'cursor-not-allowed');
            checkoutBtn.innerHTML = `<i class="fa-solid fa-circle-notch fa-spin"></i> <span>Processing Order...</span>`;

            const total = cartStore.getTotal();
            const orderId = 'BB-' + Math.floor(100000 + Math.random() * 900000);

            try {
                // Dispatch to Telegram
                const result = await TelegramService.sendOrder({
                    orderId: `#${orderId}`,
                    customer: {
                        name: 'Guest Customer',
                        phone: 'Direct Web Order',
                        method: 'delivery',
                        address: null
                    },
                    items: [...cartStore.getItems()],
                    subtotal: cartStore.getSubtotal(),
                    deliveryFee: 0.00,
                    total,
                    timestamp: new Date().toLocaleString()
                });

                if (result && result.success === false) {
                    throw new Error(result.error?.description || result.error || 'Failed to submit order');
                }

                // Open Checkout Success Modal
                const checkoutModal = document.getElementById('checkout-modal');
                const orderIdEl = document.getElementById('checkout-order-id');
                const totalPaidEl = document.getElementById('checkout-total-paid');

                if (orderIdEl) orderIdEl.textContent = `#${orderId}`;
                if (totalPaidEl) totalPaidEl.textContent = formatPrice(total);

                closeDrawer();
                if (checkoutModal) checkoutModal.classList.remove('hidden');

                // Clear cart & show success feedback
                cartStore.clear();
                toast.show("Order Sent! We will call you back shortly", "success");

            } catch (err) {
                console.error('[Cart Checkout Error]', err);
                toast.show(err.message || "Order submission failed", "error");
            } finally {
                checkoutBtn.disabled = false;
                checkoutBtn.classList.remove('opacity-75', 'cursor-not-allowed');
                checkoutBtn.innerHTML = originalBtnContent;
            }
        });
    }

    // Initial render & listeners
    renderCart();
    window.addEventListener('cart:updated', renderCart);
    window.addEventListener('language:changed', renderCart);
}
