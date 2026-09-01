/**
 * Header Component: Cart Badge, Language Selector & Mobile Navigation
 */
import { cartStore } from '../state/cartStore.js';
import { i18n } from '../i18n/i18n.js';

export function initHeader() {
    const cartCountEl = document.getElementById('navbar-cart-count');
    const langBtn = document.getElementById('lang-switch-btn');
    const langDropdown = document.getElementById('lang-dropdown-menu');
    const currentLangLabel = document.getElementById('current-lang-label');
    const mobileMenuBtn = document.getElementById('mobile-menu-btn');
    const mobileNav = document.getElementById('mobile-nav-links');

    // Update cart badge
    function updateCartBadge() {
        const count = cartStore.getCount();
        if (cartCountEl) {
            cartCountEl.textContent = count;
            if (count > 0) {
                cartCountEl.classList.remove('hidden');
                cartCountEl.classList.add('animate-badge-bump');
                setTimeout(() => cartCountEl.classList.remove('animate-badge-bump'), 300);
            } else {
                cartCountEl.classList.add('hidden');
            }
        }
    }

    // Initial badge update & subscribe
    updateCartBadge();
    window.addEventListener('cart:updated', updateCartBadge);

    // Language Dropdown Setup
    if (langBtn && langDropdown) {
        // Update label
        const langMap = { ru: 'RU', en: 'EN', uz: 'UZ' };
        if (currentLangLabel) {
            currentLangLabel.textContent = langMap[i18n.getLanguage()] || 'RU';
        }

        langBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            langDropdown.classList.toggle('hidden');
        });

        document.addEventListener('click', (e) => {
            if (!langDropdown.contains(e.target) && !langBtn.contains(e.target)) {
                langDropdown.classList.add('hidden');
            }
        });

        langDropdown.querySelectorAll('[data-lang]').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const targetLang = e.currentTarget.getAttribute('data-lang');
                await i18n.setLanguage(targetLang);
                if (currentLangLabel) {
                    currentLangLabel.textContent = langMap[targetLang] || targetLang.toUpperCase();
                }
                langDropdown.classList.add('hidden');
            });
        });
    }

    // Mobile Navigation Toggle
    if (mobileMenuBtn && mobileNav) {
        mobileMenuBtn.addEventListener('click', () => {
            mobileNav.classList.toggle('hidden');
        });

        // Close on link click
        mobileNav.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                mobileNav.classList.add('hidden');
            });
        });
    }
}
