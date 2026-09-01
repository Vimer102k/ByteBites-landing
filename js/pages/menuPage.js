/**
 * Dedicated Menu Page Controller
 */
import { MenuGrid } from '../components/menuGrid.js';
import { initModals } from '../components/modals.js';

export async function initMenuPage() {
    const menuGrid = new MenuGrid({
        containerId: 'full-menu-grid-container',
        filterContainerId: 'full-category-pills-container',
        searchInputId: 'full-menu-search-input'
    });

    await menuGrid.init();

    initModals({
        onDishAdded: (newDish) => {
            menuGrid.addDishDirectly(newDish);
        }
    });
}
