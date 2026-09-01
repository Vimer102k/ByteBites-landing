/**
 * ByteBites Cafe - Application Main Entry Point
 */
import { i18n } from './i18n/i18n.js';
import { initHeader } from './components/header.js';
import { initCartDrawer } from './components/cartDrawer.js';
import { initHomePage } from './pages/home.js';

document.addEventListener('DOMContentLoaded', async () => {
    try {
        // 1. Initialize Internationalization (i18n) Engine
        await i18n.init();

        // 2. Initialize Shared Shell Components
        initHeader();
        initCartDrawer();

        // 3. Page Specific Routing / Initialization
        const pageType = document.body.getAttribute('data-page') || 'home';

        if (pageType === 'home') {
            await initHomePage();
        } else if (pageType === 'menu') {
            // For dedicated menu.html page
            const { initMenuPage } = await import('./pages/menuPage.js');
            await initMenuPage();
        } else if (pageType === 'checkout') {
            // For dedicated checkout.html page
            const { initCheckoutPage } = await import('./pages/checkoutPage.js');
            await initCheckoutPage();
        }

        console.log(`[App] Initialized successfully. Page: ${pageType}, Language: ${i18n.getLanguage()}`);
    } catch (err) {
        console.error('[App] Bootstrap error:', err);
    }
});
