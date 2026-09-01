/**
 * Internationalization (i18n) Core Engine
 */
import { CONFIG } from '../config/config.js';
import { StorageService } from '../services/storageService.js';

class I18nManager extends EventTarget {
    constructor() {
        super();
        this.currentLang = StorageService.get(CONFIG.STORAGE_KEYS.LANG, CONFIG.DEFAULT_LANG);
        if (!CONFIG.SUPPORTED_LANGS.includes(this.currentLang)) {
            this.currentLang = CONFIG.DEFAULT_LANG;
        }
        this.translations = {};
        this.loaded = false;
    }

    async init() {
        await this.loadTranslations(this.currentLang);
        this.translatePage();
        this.updateHtmlLang();
        this.loaded = true;
    }

    async loadTranslations(lang) {
        if (this.translations[lang]) return;

        try {
            const response = await fetch(`locales/${lang}.json`);
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            this.translations[lang] = await response.json();
        } catch (err) {
            console.warn(`[i18n] Could not load dictionary for "${lang}", falling back:`, err);
            // If fetch fails (e.g. running via file:// protocol without a server), load minimal fallback
            this.translations[lang] = this.translations[lang] || {};
        }
    }

    async setLanguage(lang) {
        if (!CONFIG.SUPPORTED_LANGS.includes(lang)) return;
        this.currentLang = lang;
        StorageService.set(CONFIG.STORAGE_KEYS.LANG, lang);
        
        await this.loadTranslations(lang);
        this.translatePage();
        this.updateHtmlLang();

        const event = new CustomEvent('language:changed', { detail: { lang } });
        this.dispatchEvent(event);
        window.dispatchEvent(event);
    }

    getLanguage() {
        return this.currentLang;
    }

    /**
     * Retrieve nested translation key: t('hero.title') or t('toasts.added')
     */
    t(keyPath, params = {}) {
        const dict = this.translations[this.currentLang] || this.translations[CONFIG.DEFAULT_LANG] || {};
        const keys = keyPath.split('.');
        let val = dict;

        for (const k of keys) {
            if (val && typeof val === 'object' && k in val) {
                val = val[k];
            } else {
                return keyPath; // fallback to key
            }
        }

        if (typeof val === 'string') {
            return val.replace(/\{\{\s*(\w+)\s*\}\}/g, (_, match) => {
                return params[match] !== undefined ? params[match] : `{{${match}}}`;
            });
        }

        return val;
    }

    updateHtmlLang() {
        document.documentElement.lang = this.currentLang;
    }

    translatePage() {
        // Translate text content
        document.querySelectorAll('[data-i18n]').forEach(el => {
            const key = el.getAttribute('data-i18n');
            const translation = this.t(key);
            if (translation && translation !== key) {
                el.textContent = translation;
            }
        });

        // Translate inner HTML content
        document.querySelectorAll('[data-i18n-html]').forEach(el => {
            const key = el.getAttribute('data-i18n-html');
            const translation = this.t(key);
            if (translation && translation !== key) {
                el.innerHTML = translation;
            }
        });

        // Translate placeholders
        document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
            const key = el.getAttribute('data-i18n-placeholder');
            const translation = this.t(key);
            if (translation && translation !== key) {
                el.setAttribute('placeholder', translation);
            }
        });

        // Translate aria-labels
        document.querySelectorAll('[data-i18n-aria]').forEach(el => {
            const key = el.getAttribute('data-i18n-aria');
            const translation = this.t(key);
            if (translation && translation !== key) {
                el.setAttribute('aria-label', translation);
            }
        });
    }
}

export const i18n = new I18nManager();
export const t = (key, params) => i18n.t(key, params);
