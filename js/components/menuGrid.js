/**
 * Menu Grid Component: Dynamic Cards, Categories, Search & Filtering
 */
import { MenuService } from '../services/supabaseClient.js';
import { CATEGORIES } from '../data/mockData.js';
import { cartStore } from '../state/cartStore.js';
import { toast } from './toast.js';
import { formatPrice, escapeHtml } from '../utils/formatters.js';
import { t } from '../i18n/i18n.js';
import { CONFIG } from '../config/config.js';

export class MenuGrid {
    constructor({ containerId, filterContainerId, searchInputId }) {
        this.container = document.getElementById(containerId);
        this.filterContainer = document.getElementById(filterContainerId);
        this.searchInput = document.getElementById(searchInputId);
        this.items = [];
        this.activeCategory = 'all';
        this.searchQuery = '';
    }

    async init() {
        if (!this.container) return;

        this.renderCategoryPills();
        this.setupSearch();
        
        // Listen to language changes to re-render dynamic labels
        window.addEventListener('language:changed', () => {
            this.renderCategoryPills();
            this.renderCards();
        });

        await this.loadItems();
    }

    async loadItems() {
        if (this.container) {
            this.container.innerHTML = `
                <div class="col-span-full py-16 flex flex-col items-center justify-center text-center">
                    <div class="w-10 h-10 border-4 border-brand-primary border-t-transparent rounded-full animate-spin mb-4"></div>
                    <p class="text-gray-400 text-sm font-medium" data-i18n="menu.loading">${t('menu.loading')}</p>
                </div>
            `;
        }

        try {
            this.items = await MenuService.getDishes();
            this.renderCards();
        } catch (err) {
            console.error('[MenuGrid] Failed to load dishes:', err);
            if (this.container) {
                this.container.innerHTML = `
                    <div class="col-span-full py-12 text-center text-red-400">
                        <i class="fa-solid fa-triangle-exclamation text-3xl mb-2"></i>
                        <p>Error loading menu items. Please try again later.</p>
                    </div>
                `;
            }
        }
    }

    renderCategoryPills() {
        if (!this.filterContainer) return;

        this.filterContainer.innerHTML = CATEGORIES.map(cat => {
            const isActive = this.activeCategory === cat.id;
            const activeClasses = isActive 
                ? 'bg-brand-primary text-white shadow-glow border-brand-primary' 
                : 'bg-brand-card/80 text-gray-400 hover:text-white hover:bg-brand-surface border-brand-border';

            return `
                <button 
                    data-category="${cat.id}"
                    class="px-5 py-2.5 rounded-xl border text-sm font-semibold flex items-center gap-2.5 transition-all duration-200 ${activeClasses}">
                    <i class="fa-solid ${cat.icon}"></i>
                    <span>${t(cat.labelKey)}</span>
                </button>
            `;
        }).join('');

        this.filterContainer.querySelectorAll('button').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const category = e.currentTarget.getAttribute('data-category');
                this.activeCategory = category;
                this.renderCategoryPills();
                this.renderCards();
            });
        });
    }

    setupSearch() {
        if (!this.searchInput) return;

        this.searchInput.addEventListener('input', (e) => {
            this.searchQuery = e.target.value.toLowerCase().trim();
            this.renderCards();
        });
    }

    getFilteredItems() {
        return this.items.filter(item => {
            const matchesCategory = this.activeCategory === 'all' || item.category === this.activeCategory;
            const matchesSearch = !this.searchQuery || 
                item.name.toLowerCase().includes(this.searchQuery) ||
                (item.description && item.description.toLowerCase().includes(this.searchQuery));
            return matchesCategory && matchesSearch;
        });
    }

    renderCards() {
        if (!this.container) return;

        const filtered = this.getFilteredItems();

        if (filtered.length === 0) {
            this.container.innerHTML = `
                <div class="col-span-full py-16 text-center text-gray-400">
                    <div class="w-16 h-16 mx-auto mb-4 rounded-2xl bg-brand-surface flex items-center justify-center text-gray-500">
                        <i class="fa-solid fa-utensils text-2xl"></i>
                    </div>
                    <p class="text-base font-semibold text-gray-300" data-i18n="menu.noItems">${t('menu.noItems')}</p>
                </div>
            `;
            return;
        }

        this.container.innerHTML = filtered.map(dish => {
            const badgeColor = dish.badge_color || 'bg-brand-primary/90';
            const badgeHtml = dish.badge 
                ? `<span class="absolute top-3 left-3 px-3 py-1 rounded-lg text-xs font-bold text-white shadow-md backdrop-blur-md ${badgeColor}">${escapeHtml(dish.badge)}</span>` 
                : '';

            return `
                <div class="group bg-brand-card rounded-2xl border border-brand-border/80 overflow-hidden flex flex-col hover:border-brand-primary/50 transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl">
                    <div class="relative h-48 overflow-hidden bg-brand-surface">
                        <img 
                            src="${dish.image || CONFIG.DEFAULT_IMAGE_FALLBACK}" 
                            alt="${escapeHtml(dish.name)}"
                            loading="lazy"
                            decoding="async"
                            class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            onerror="this.src='${CONFIG.DEFAULT_IMAGE_FALLBACK}'"
                        >
                        ${badgeHtml}
                        <div class="absolute top-3 right-3 px-2.5 py-1 rounded-lg bg-black/60 backdrop-blur-md border border-white/10 text-amber-400 text-xs font-bold flex items-center gap-1">
                            <i class="fa-solid fa-star text-[10px]"></i>
                            <span>${dish.rating || '5.0'}</span>
                        </div>
                    </div>
                    
                    <div class="p-5 flex-1 flex flex-col justify-between">
                        <div>
                            <h3 class="text-lg font-bold text-white group-hover:text-brand-primary transition-colors">
                                ${escapeHtml(dish.name)}
                            </h3>
                            <p class="text-gray-400 text-xs mt-2 line-clamp-2 leading-relaxed">
                                ${escapeHtml(dish.description || '')}
                            </p>
                        </div>

                        <div class="mt-5 pt-4 border-t border-brand-border/60 flex items-center justify-between">
                            <div>
                                <span class="text-xl font-extrabold text-brand-primary">${formatPrice(dish.price)}</span>
                            </div>
                            <button 
                                data-add-id="${dish.id}"
                                class="btn-add-to-cart px-4 py-2 rounded-xl bg-brand-primary/10 hover:bg-brand-primary text-brand-primary hover:text-white border border-brand-primary/30 text-xs font-bold flex items-center gap-2 transition-all active:scale-95">
                                <i class="fa-solid fa-plus text-xs"></i>
                                <span>${t('menu.addToCart')}</span>
                            </button>
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        // Attach click handlers
        this.container.querySelectorAll('.btn-add-to-cart').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const dishId = e.currentTarget.getAttribute('data-add-id');
                const dish = this.items.find(d => String(d.id) === String(dishId));
                if (dish) {
                    cartStore.addItem(dish);
                    toast.success('toasts.added');
                }
            });
        });
    }

    addDishDirectly(newDish) {
        this.items.unshift(newDish);
        this.renderCards();
    }
}
