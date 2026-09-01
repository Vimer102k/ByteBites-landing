/**
 * Modals Component: VIP Club, Add New Dish & Checkout Confirmation
 */
import { MenuService, VipService } from '../services/supabaseClient.js';
import { toast } from './toast.js';
import { CONFIG } from '../config/config.js';

export function initModals({ onDishAdded } = {}) {
    // --- VIP Modal Elements ---
    const vipModal = document.getElementById('vip-modal');
    const openVipBtns = document.querySelectorAll('.btn-open-vip');
    const closeVipBtn = document.getElementById('close-vip-modal');
    const vipForm = document.getElementById('vip-form');

    // --- Add Dish Modal Elements ---
    const addDishModal = document.getElementById('add-dish-modal');
    const openDishBtns = document.querySelectorAll('.btn-open-add-dish');
    const closeDishBtn = document.getElementById('close-add-dish-modal');
    const addDishForm = document.getElementById('add-dish-form');

    // --- Checkout Modal Elements ---
    const checkoutModal = document.getElementById('checkout-modal');
    const closeCheckoutBtn = document.getElementById('close-checkout-modal');

    // Utility: Open modal
    function open(modal) {
        if (!modal) return;
        modal.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
    }

    // Utility: Close modal
    function close(modal) {
        if (!modal) return;
        modal.classList.add('hidden');
        document.body.style.overflow = '';
    }

    // VIP Modal Listeners
    openVipBtns.forEach(btn => btn.addEventListener('click', (e) => {
        e.preventDefault();
        open(vipModal);
    }));

    if (closeVipBtn) closeVipBtn.addEventListener('click', () => close(vipModal));

    if (vipForm) {
        vipForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(vipForm);
            const member = {
                name: formData.get('name'),
                email: formData.get('email'),
                phone: formData.get('phone'),
                created_at: new Date().toISOString()
            };

            await VipService.registerMember(member);
            close(vipModal);
            vipForm.reset();
            toast.success('toasts.vip_success');
        });
    }

    // Add Dish Modal Listeners
    openDishBtns.forEach(btn => btn.addEventListener('click', (e) => {
        e.preventDefault();
        open(addDishModal);
    }));

    if (closeDishBtn) closeDishBtn.addEventListener('click', () => close(addDishModal));

    if (addDishForm) {
        addDishForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(addDishForm);

            const dishData = {
                name: formData.get('name')?.toString().trim(),
                category: formData.get('category')?.toString(),
                price: parseFloat(formData.get('price')?.toString() || '0'),
                badge: formData.get('badge')?.toString().trim() || null,
                badge_color: 'bg-brand-primary/90',
                rating: parseFloat(formData.get('rating')?.toString() || '5.0'),
                description: formData.get('description')?.toString().trim() || '',
                image: formData.get('image')?.toString().trim() || CONFIG.DEFAULT_IMAGE_FALLBACK
            };

            if (!dishData.name || isNaN(dishData.price) || dishData.price <= 0) {
                toast.error('toasts.dish_error');
                return;
            }

            const submitBtn = addDishForm.querySelector('button[type="submit"]');
            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.innerHTML = `<i class="fa-solid fa-spinner animate-spin"></i> Saving...`;
            }

            try {
                const res = await MenuService.addDish(dishData);
                close(addDishModal);
                addDishForm.reset();
                toast.success('toasts.dish_added');
                
                if (typeof onDishAdded === 'function' && res.data) {
                    onDishAdded(res.data);
                }
            } catch (err) {
                console.error('[AddDish] Error adding dish:', err);
                toast.error('toasts.dish_error');
            } finally {
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = `Save & Publish Dish`;
                }
            }
        });
    }

    // Checkout Modal Listeners
    if (closeCheckoutBtn) {
        closeCheckoutBtn.addEventListener('click', () => close(checkoutModal));
    }

    // Global Modal Backdrop clicks & ESC key
    [vipModal, addDishModal, checkoutModal].forEach(modal => {
        if (!modal) return;
        modal.addEventListener('click', (e) => {
            if (e.target === modal) close(modal);
        });
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            close(vipModal);
            close(addDishModal);
            close(checkoutModal);
        }
    });
}
