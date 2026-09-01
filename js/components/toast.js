/**
 * Toast Notifications Manager
 */
import { t } from '../i18n/i18n.js';

class ToastManager {
    constructor() {
        this.container = null;
    }

    _ensureContainer() {
        if (!this.container) {
            this.container = document.getElementById('toast-container');
            if (!this.container) {
                this.container = document.createElement('div');
                this.container.id = 'toast-container';
                this.container.className = 'fixed bottom-6 right-6 z-50 flex flex-col gap-3 pointer-events-none max-w-sm w-full px-4';
                document.body.appendChild(this.container);
            }
        }
    }

    show(messageKeyOrText, type = 'success', duration = 3000) {
        this._ensureContainer();

        // Check if message is an i18n key or direct string
        const message = messageKeyOrText.startsWith('toasts.') ? t(messageKeyOrText) : messageKeyOrText;

        const toast = document.createElement('div');
        toast.className = `pointer-events-auto flex items-center gap-3 p-4 rounded-xl shadow-2xl backdrop-blur-md border transition-all duration-300 transform translate-y-4 opacity-0 ${
            type === 'success' 
                ? 'bg-zinc-900/95 border-brand-primary/40 text-white' 
                : type === 'error'
                ? 'bg-red-950/95 border-red-500/50 text-white'
                : 'bg-zinc-900/95 border-zinc-700 text-white'
        }`;

        const iconClass = type === 'success' ? 'fa-circle-check text-brand-primary' : type === 'error' ? 'fa-circle-exclamation text-red-400' : 'fa-circle-info text-sky-400';

        toast.innerHTML = `
            <i class="fa-solid ${iconClass} text-lg"></i>
            <span class="text-sm font-medium leading-snug">${message}</span>
        `;

        this.container.appendChild(toast);

        // Animate entrance
        requestAnimationFrame(() => {
            toast.classList.remove('translate-y-4', 'opacity-0');
        });

        // Auto remove
        setTimeout(() => {
            toast.classList.add('opacity-0', 'translate-y-2');
            setTimeout(() => {
                if (toast.parentElement) toast.remove();
            }, 300);
        }, duration);
    }

    success(msgKey) {
        this.show(msgKey, 'success');
    }

    error(msgKey) {
        this.show(msgKey, 'error');
    }

    info(msgKey) {
        this.show(msgKey, 'info');
    }
}

export const toast = new ToastManager();
