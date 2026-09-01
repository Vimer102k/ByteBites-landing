/**
 * Home Page Controller
 */
import { MenuGrid } from '../components/menuGrid.js';
import { initModals } from '../components/modals.js';

export async function initHomePage() {
    const menuGrid = new MenuGrid({
        containerId: 'menu-grid-container',
        filterContainerId: 'category-pills-container',
        searchInputId: 'menu-search-input'
    });

    await menuGrid.init();

    // Initialize modals and hook new dish callback to menu grid
    initModals({
        onDishAdded: (newDish) => {
            menuGrid.addDishDirectly(newDish);
        }
    });
}
