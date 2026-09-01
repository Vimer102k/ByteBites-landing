/**
 * Reactive Cart Store with Pub/Sub Event System
 */
import { CONFIG } from '../config/config.js';
import { StorageService } from '../services/storageService.js';

class CartStore extends EventTarget {
    constructor() {
        super();
        this.items = StorageService.get(CONFIG.STORAGE_KEYS.CART, []);
    }

    getItems() {
        return this.items;
    }

    getCount() {
        return this.items.reduce((total, item) => total + (item.quantity || 1), 0);
    }

    getSubtotal() {
        return this.items.reduce((total, item) => total + (Number(item.price) * (item.quantity || 1)), 0);
    }

    getTotal() {
        const subtotal = this.getSubtotal();
        return subtotal > 0 ? subtotal + CONFIG.DELIVERY_FEE : 0;
    }

    addItem(dish) {
        const existing = this.items.find(i => String(i.id) === String(dish.id));
        if (existing) {
            existing.quantity = (existing.quantity || 1) + 1;
        } else {
            this.items.push({
                id: dish.id,
                name: dish.name,
                price: Number(dish.price),
                image: dish.image || CONFIG.DEFAULT_IMAGE_FALLBACK,
                category: dish.category,
                quantity: 1
            });
        }
        this._notify('item_added', dish);
    }

    updateQuantity(dishId, delta) {
        const item = this.items.find(i => String(i.id) === String(dishId));
        if (!item) return;

        item.quantity = (item.quantity || 1) + delta;
        if (item.quantity <= 0) {
            this.removeItem(dishId);
            return;
        }
        this._notify('quantity_changed', item);
    }

    removeItem(dishId) {
        this.items = this.items.filter(i => String(i.id) !== String(dishId));
        this._notify('item_removed', { id: dishId });
    }

    clear() {
        this.items = [];
        this._notify('cart_cleared', null);
    }

    _notify(action, payload) {
        StorageService.set(CONFIG.STORAGE_KEYS.CART, this.items);
        const event = new CustomEvent('cart:updated', {
            detail: {
                action,
                payload,
                items: this.items,
                count: this.getCount(),
                subtotal: this.getSubtotal(),
                total: this.getTotal()
            }
        });
        this.dispatchEvent(event);
        window.dispatchEvent(event);
    }
}

export const cartStore = new CartStore();
