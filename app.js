/**
 * ByteBites Cafe - Full Client-Side JavaScript Logic with Supabase Integration
 * Features:
 * - Supabase JS SDK Integration with Graceful Local Mockup Fallback
 * - Dynamic Category Filter Pills Rendering
 * - Dynamic Menu Card Generation
 * - Cart State Management (Add, Remove, Quantity +/-)
 * - LocalStorage Persistence
 * - Animated Navbar Badge Bump
 * - Slide-over Drawer Controls & Keybindings (ESC)
 * - Toast Feedback Notifications
 * - Checkout Success Confirmation Modal
 * - Admin "Add New Dish" Modal with Supabase Insert / localStorage Fallback
 */

// ------------------------------------------------------------------
// Telegram Bot API Configuration
// Replace botToken and chatId with your Telegram bot credentials
// ------------------------------------------------------------------
const TELEGRAM_CONFIG = {
    botToken: '8518807306:AAEPeFrcclNxCv7sGPIn8ohUDG6BIJaBMn8',
    chatId: '5595887601'
};

/**
 * Sends formatted order notification to Telegram chat/channel via Bot API
 * @param {Object} orderDetails - Object containing order info, customer details, and item list
 * @returns {Promise<Object>}
 */
async function sendOrderToTelegram(orderDetails) {
    const { botToken, chatId } = TELEGRAM_CONFIG;

    if (!botToken || !chatId) {
        const errorMsg = 'Telegram botToken or chatId is missing in TELEGRAM_CONFIG.';
        console.error('[Telegram]', errorMsg);
        throw new Error(errorMsg);
    }

    const { orderId, customer, items, subtotal, deliveryFee, total, timestamp } = orderDetails;

    // Itemized list of ordered dishes
    const itemsListText = (items || []).map(item => {
        const itemTotal = (Number(item.price) * Number(item.quantity)).toFixed(2);
        return `• <b>${item.name}</b> x${item.quantity} — $${itemTotal}`;
    }).join('\n');

    // Clean HTML formatted Telegram message
    const message = `
🍔 <b>NEW ORDER ${orderId}</b>

👤 <b>Customer Info:</b>
• <b>Name:</b> ${customer?.name || 'N/A'}
• <b>Phone:</b> ${customer?.phone || 'N/A'}
• <b>Method:</b> ${customer?.method === 'delivery' ? '🚗 Delivery' : '🏪 Pickup'}
${customer?.method === 'delivery' && customer?.address ? `• <b>Address:</b> ${customer.address}\n` : ''}${customer?.notes ? `• <b>Notes:</b> ${customer.notes}\n` : ''}
🛒 <b>Ordered Items:</b>
${itemsListText || 'No items listed'}

💰 <b>Payment Summary:</b>
• <b>Subtotal:</b> $${Number(subtotal || 0).toFixed(2)}
• <b>Delivery Fee:</b> $${Number(deliveryFee || 0).toFixed(2)}
• <b>Total Amount:</b> <b>$${Number(total || 0).toFixed(2)}</b>

⏰ <b>Order Timestamp:</b> ${timestamp || new Date().toLocaleString()}
`.trim();

    try {
        const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                chat_id: chatId,
                text: message,
                parse_mode: 'HTML'
            })
        });

        const data = await response.json();
        if (!response.ok || !data.ok) {
            const apiError = data.description || `Telegram API error (HTTP ${response.status})`;
            console.error('[Telegram] API error response:', data);
            throw new Error(apiError);
        }
        console.log('[Telegram] Order notification sent successfully:', data);
        return { success: true, data };
    } catch (error) {
        console.error('[Telegram] Network or API error sending message:', error);
        throw error;
    }
}

// ------------------------------------------------------------------
// Supabase Configuration
// Replace SUPABASE_URL & SUPABASE_ANON_KEY with your project credentials
// ------------------------------------------------------------------
const SUPABASE_URL = ""; 
const SUPABASE_ANON_KEY = "";

// Default Fallback Image URL for Broken / Missing Image Links
const DEFAULT_IMAGE_FALLBACK = "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=800&auto=format&fit=crop";

// ------------------------------------------------------------------
// Local Mockup Data (Fallback if Supabase is unconfigured or offline)
// ------------------------------------------------------------------
const LOCAL_MOCK_ITEMS = [
    {
        id: 1,
        name: "Byte Flame Smash Burger",
        category: "burgers",
        badge: "Spicy 🔥",
        badge_color: "bg-red-600/90",
        rating: 4.9,
        description: "Double Angus beef smash patty, melted cheddar, fiery jalapeños & signature spicy Byte sauce.",
        price: 12.99,
        image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?q=80&w=800&auto=format&fit=crop"
    },
    {
        id: 2,
        name: "Truffle Mushroom Pizza",
        category: "pizza",
        badge: "Popular ⭐",
        badge_color: "bg-amber-500/90",
        rating: 5.0,
        description: "Hand-tossed sourdough crust, wild forest mushrooms, black truffle oil & fresh mozzarella cheese.",
        price: 16.49,
        image: "https://images.unsplash.com/photo-1574071318508-1cdbab80d002?q=80&w=800&auto=format&fit=crop"
    },
    {
        id: 3,
        name: "Crispy Tender Bucket",
        category: "sides",
        badge: "Best Seller",
        badge_color: "bg-emerald-600/90",
        rating: 4.8,
        description: "Golden buttermilk chicken tenders served with house smoky bbq sauce & garlic aioli dip.",
        price: 9.99,
        image: "https://images.unsplash.com/photo-1562967914-608f82629710?q=80&w=800&auto=format&fit=crop"
    },
    {
        id: 4,
        name: "Loaded Smoked Bacon Fries",
        category: "sides",
        badge: "Popular ⭐",
        badge_color: "bg-amber-500/90",
        rating: 4.7,
        description: "Crispy skin-on fries smothered in warm cheddar queso, smoked bacon bits & fresh chives.",
        price: 6.99,
        image: "https://images.unsplash.com/photo-1576107232684-1279f3908594?q=80&w=800&auto=format&fit=crop"
    },
    {
        id: 5,
        name: "Electric Mango Sparkler",
        category: "drinks",
        badge: "Refreshing ⚡",
        badge_color: "bg-sky-600/90",
        rating: 4.9,
        description: "Refreshing iced sparkling fizz infused with Alphonso mango nectar, fresh mint & lime zest.",
        price: 4.49,
        image: "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?q=80&w=800&auto=format&fit=crop"
    },
    {
        id: 6,
        name: "Hot Honey Pepperoni Pizza",
        category: "pizza",
        badge: "Spicy 🔥",
        badge_color: "bg-red-600/90",
        rating: 4.9,
        description: "Crispy cupping pepperoni slices, hot chili honey drizzle, fresh basil & San Marzano marinara.",
        price: 15.99,
        image: "https://images.unsplash.com/photo-1628840042765-356cda07504e?q=80&w=800&auto=format&fit=crop"
    }
];

document.addEventListener('DOMContentLoaded', async () => {
    // ------------------------------------------------------------------
    // State Initialization
    // ------------------------------------------------------------------
    let cart = [];
    let menuItems = [];
    let currentCategory = 'all';

    // Load Cart from LocalStorage
    try {
        const savedCart = localStorage.getItem('bytebites_cart');
        if (savedCart) {
            cart = JSON.parse(savedCart);
        }
    } catch (e) {
        console.error('Failed to load cart from localStorage:', e);
        cart = [];
    }

    // ------------------------------------------------------------------
    // DOM Elements
    // ------------------------------------------------------------------
    const menuGrid = document.getElementById('menu-grid');
    const filterPillsContainer = document.getElementById('filter-pills-container');
    const cartToggleBtn = document.getElementById('cart-toggle-btn');
    const cartCloseBtn = document.getElementById('cart-close-btn');
    const cartDrawer = document.getElementById('cart-drawer');
    const cartBackdrop = document.getElementById('cart-backdrop');
    const cartBadge = document.getElementById('cart-badge');
    const drawerItemCount = document.getElementById('drawer-item-count');
    const cartItemsContainer = document.getElementById('cart-items-container');
    const cartSubtotalEl = document.getElementById('cart-subtotal');
    const cartDeliveryEl = document.getElementById('cart-delivery');
    const cartTotalEl = document.getElementById('cart-total');
    const checkoutBtn = document.getElementById('checkout-btn');

    // Modal Elements (Checkout Success)
    const checkoutModal = document.getElementById('checkout-modal');
    const checkoutModalBackdrop = document.getElementById('checkout-modal-backdrop');
    const closeCheckoutModalBtn = document.getElementById('close-checkout-modal-btn');
    const modalOrderId = document.getElementById('modal-order-id');
    const modalOrderTotal = document.getElementById('modal-order-total');
    const modalItemCount = document.getElementById('modal-item-count');

    // Order Checkout Form Modal Elements
    const orderCheckoutModal = document.getElementById('order-checkout-modal');
    const orderCheckoutBackdrop = document.getElementById('order-checkout-backdrop');
    const orderCheckoutCloseBtn = document.getElementById('order-checkout-close-btn');
    const checkoutCancelBtn = document.getElementById('checkout-cancel-btn');
    const checkoutForm = document.getElementById('checkout-form');
    const checkoutNameInput = document.getElementById('checkout-name');
    const checkoutPhoneInput = document.getElementById('checkout-phone');
    const deliveryAddressContainer = document.getElementById('checkout-address-container');
    const checkoutAddressInput = document.getElementById('checkout-address');
    const checkoutCommentInput = document.getElementById('checkout-comment');
    const checkoutSummaryCount = document.getElementById('checkout-summary-count');
    const checkoutSummarySubtotal = document.getElementById('checkout-summary-subtotal');
    const checkoutSummaryFeeLabel = document.getElementById('checkout-summary-fee-label');
    const checkoutSummaryFee = document.getElementById('checkout-summary-fee');
    const checkoutSummaryTotal = document.getElementById('checkout-summary-total');
    const labelDelivery = document.getElementById('label-delivery');
    const labelPickup = document.getElementById('label-pickup');
    const deliveryRadioDelivery = document.getElementById('delivery-radio-delivery');

    // Toast Elements
    const toast = document.getElementById('toast');
    const toastTitle = document.getElementById('toast-title');
    const toastMsg = document.getElementById('toast-msg');
    let toastTimeout = null;

    // Mobile Navigation Elements
    const mobileMenuBtn = document.getElementById('mobile-menu-btn');
    const mobileMenuIcon = document.getElementById('mobile-menu-icon');
    const mobileMenuDrawer = document.getElementById('mobile-menu-drawer');
    const mobileNavLinks = document.querySelectorAll('.mobile-nav-link');
    let isMobileMenuOpen = false;

    // ------------------------------------------------------------------
    // Supabase Data Fetcher with Fallback
    // ------------------------------------------------------------------
    async function fetchMenuItems() {
        if (typeof window.supabase !== 'undefined' && SUPABASE_URL && SUPABASE_ANON_KEY && SUPABASE_URL.trim() !== "" && SUPABASE_ANON_KEY.trim() !== "") {
            try {
                const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
                const { data, error } = await supabaseClient
                    .from('menu_items')
                    .select('*');

                if (error) {
                    console.warn('Supabase query error. Falling back to local data:', error.message);
                    return LOCAL_MOCK_ITEMS;
                }
                if (data && data.length > 0) {
                    console.log('Successfully fetched menu items from Supabase database.');
                    return data;
                }
            } catch (err) {
                console.warn('Supabase initialization error. Falling back to local data:', err);
            }
        }
        console.log('Using local fallback menu items array.');
        return LOCAL_MOCK_ITEMS;
    }

    // ------------------------------------------------------------------
    // LocalStorage Helper
    // ------------------------------------------------------------------
    function saveCartToStorage() {
        try {
            localStorage.setItem('bytebites_cart', JSON.stringify(cart));
        } catch (e) {
            console.error('Failed to save cart to localStorage:', e);
        }
    }

    // ------------------------------------------------------------------
    // Mobile Navigation Drawer Controls
    // ------------------------------------------------------------------
    function openMobileMenu() {
        if (!mobileMenuDrawer || !mobileMenuBtn) return;
        isMobileMenuOpen = true;
        mobileMenuDrawer.classList.remove('hidden');
        
        requestAnimationFrame(() => {
            mobileMenuDrawer.classList.remove('opacity-0', 'max-h-0');
            mobileMenuDrawer.classList.add('opacity-100', 'max-h-96');
        });

        if (mobileMenuIcon) {
            mobileMenuIcon.classList.remove('fa-bars');
            mobileMenuIcon.classList.add('fa-xmark');
        }
        mobileMenuBtn.setAttribute('aria-expanded', 'true');
    }

    function closeMobileMenu() {
        if (!mobileMenuDrawer || !mobileMenuBtn || !isMobileMenuOpen) return;
        isMobileMenuOpen = false;
        mobileMenuDrawer.classList.remove('opacity-100', 'max-h-96');
        mobileMenuDrawer.classList.add('opacity-0', 'max-h-0');

        if (mobileMenuIcon) {
            mobileMenuIcon.classList.remove('fa-xmark');
            mobileMenuIcon.classList.add('fa-bars');
        }
        mobileMenuBtn.setAttribute('aria-expanded', 'false');

        setTimeout(() => {
            if (!isMobileMenuOpen) {
                mobileMenuDrawer.classList.add('hidden');
            }
        }, 300);
    }

    function toggleMobileMenu(e) {
        if (e) e.stopPropagation();
        if (isMobileMenuOpen) {
            closeMobileMenu();
        } else {
            openMobileMenu();
        }
    }

    if (mobileMenuBtn) {
        mobileMenuBtn.addEventListener('click', toggleMobileMenu);
    }

    // Automatically close mobile menu when clicking any navigation link
    mobileNavLinks.forEach(link => {
        link.addEventListener('click', () => {
            closeMobileMenu();
        });
    });

    // Close mobile menu when clicking outside
    document.addEventListener('click', (e) => {
        if (isMobileMenuOpen && mobileMenuDrawer && mobileMenuBtn) {
            if (!mobileMenuDrawer.contains(e.target) && !mobileMenuBtn.contains(e.target)) {
                closeMobileMenu();
            }
        }
    });

    // ------------------------------------------------------------------
    // Cart Drawer Controls
    // ------------------------------------------------------------------
    function openCart() {
        if (!cartDrawer || !cartBackdrop) return;
        closeMobileMenu();
        cartDrawer.classList.remove('translate-x-full');
        cartBackdrop.classList.remove('opacity-0', 'pointer-events-none');
        cartBackdrop.classList.add('opacity-100');
        document.body.style.overflow = 'hidden';
    }

    function closeCart() {
        if (!cartDrawer || !cartBackdrop) return;
        cartDrawer.classList.add('translate-x-full');
        cartBackdrop.classList.remove('opacity-100');
        cartBackdrop.classList.add('opacity-0', 'pointer-events-none');
        document.body.style.overflow = '';
    }

    if (cartToggleBtn) cartToggleBtn.addEventListener('click', openCart);
    if (cartCloseBtn) cartCloseBtn.addEventListener('click', closeCart);
    if (cartBackdrop) cartBackdrop.addEventListener('click', closeCart);

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeCart();
            closeCheckoutModal();
            closeOrderCheckoutModal();
            closeMobileMenu();
        }
    });

    // ------------------------------------------------------------------
    // Cart Badge Bump Animation
    // ------------------------------------------------------------------
    function animateBadgeBump() {
        if (!cartBadge) return;
        cartBadge.classList.add('scale-125', 'bg-amber-400');
        cartBadge.classList.remove('bg-brand-primary');

        setTimeout(() => {
            cartBadge.classList.remove('scale-125', 'bg-amber-400');
            cartBadge.classList.add('bg-brand-primary');
        }, 300);
    }

    // ------------------------------------------------------------------
    // Global Cart Operations
    // ------------------------------------------------------------------
    window.addToCart = function (id, name, price, image) {
        const existingItem = cart.find(item => item.id === id);
        if (existingItem) {
            existingItem.quantity += 1;
        } else {
            cart.push({ id, name, price: Number(price), image, quantity: 1 });
        }

        saveCartToStorage();
        updateCartUI();
        animateBadgeBump();
        showToast("Item Added!", `${name} is in your cart.`);
    };

    window.updateQuantity = function (id, delta) {
        const item = cart.find(item => item.id === id);
        if (!item) return;

        item.quantity += delta;
        if (item.quantity <= 0) {
            cart = cart.filter(i => i.id !== id);
        }

        saveCartToStorage();
        updateCartUI();
    };

    window.removeItem = function (id) {
        const item = cart.find(i => i.id === id);
        const name = item ? item.name : 'Item';
        cart = cart.filter(i => i.id !== id);

        saveCartToStorage();
        updateCartUI();
        showToast("Item Removed", `${name} removed from cart.`);
    };

    function clearCart() {
        cart = [];
        saveCartToStorage();
        updateCartUI();
    }

    // ------------------------------------------------------------------
    // Render Cart UI
    // ------------------------------------------------------------------
    function updateCartUI() {
        const totalItemsCount = cart.reduce((sum, item) => sum + item.quantity, 0);
        const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        const deliveryFee = totalItemsCount > 0 ? 2.99 : 0.00;
        const grandTotal = subtotal + deliveryFee;

        if (cartBadge) cartBadge.textContent = totalItemsCount;
        if (drawerItemCount) drawerItemCount.textContent = totalItemsCount;
        if (cartSubtotalEl) cartSubtotalEl.textContent = `$${subtotal.toFixed(2)}`;
        if (cartDeliveryEl) cartDeliveryEl.textContent = `$${deliveryFee.toFixed(2)}`;
        if (cartTotalEl) cartTotalEl.textContent = `$${grandTotal.toFixed(2)}`;

        if (!cartItemsContainer) return;

        if (cart.length === 0) {
            cartItemsContainer.innerHTML = `
                <div class="h-full flex flex-col items-center justify-center text-center text-gray-400 py-16 space-y-4">
                    <div class="w-16 h-16 rounded-2xl bg-brand-card flex items-center justify-center text-3xl text-gray-500 shadow-inner">
                        <i class="fa-solid fa-basket-shopping"></i>
                    </div>
                    <div>
                        <p class="text-base font-bold text-white">Your cart is currently empty</p>
                        <p class="text-xs text-gray-500 mt-1 max-w-xs">Explore our menu and add your favorite smash burgers, pizza & drinks!</p>
                    </div>
                </div>
            `;
        } else {
            cartItemsContainer.innerHTML = cart.map(item => {
                console.log(item.image);
                const itemImg = item.image || DEFAULT_IMAGE_FALLBACK;
                const safeName = item.name ? item.name.replace(/"/g, '&quot;') : 'Food item';
                return `
                <div class="bg-brand-card/90 border border-brand-border/80 hover:border-brand-primary/40 p-3.5 rounded-2xl flex items-center justify-between gap-3 shadow-md transition-all">
                    <img src="${itemImg}" alt="${safeName}" onerror="this.onerror=null; this.src='https://images.unsplash.com/photo-1576107232684-1279f3908594?q=80&w=300';" class="w-14 h-14 object-cover rounded-xl bg-brand-surface border border-brand-border/50">
                    <div class="flex-grow min-w-0">
                        <h4 class="text-xs sm:text-sm font-bold text-white truncate">${item.name}</h4>
                        <p class="text-xs text-brand-primary font-extrabold mt-0.5">$${(item.price * item.quantity).toFixed(2)} <span class="text-[10px] text-gray-400 font-normal">($${item.price.toFixed(2)} ea)</span></p>
                    </div>
                    <div class="flex items-center gap-2">
                        <div class="flex items-center bg-brand-surface border border-brand-border rounded-xl p-1 shadow-inner">
                            <button onclick="updateQuantity(${item.id}, -1)" aria-label="Decrease quantity" class="w-6 h-6 rounded-lg flex items-center justify-center text-gray-400 hover:text-white hover:bg-brand-card transition-colors text-xs font-bold">
                                <i class="fa-solid fa-minus"></i>
                            </button>
                            <span class="px-2 text-xs font-bold text-white">${item.quantity}</span>
                            <button onclick="updateQuantity(${item.id}, 1)" aria-label="Increase quantity" class="w-6 h-6 rounded-lg flex items-center justify-center text-gray-400 hover:text-white hover:bg-brand-card transition-colors text-xs font-bold">
                                <i class="fa-solid fa-plus"></i>
                            </button>
                        </div>
                        <button onclick="removeItem(${item.id})" aria-label="Remove item" class="w-8 h-8 rounded-xl bg-brand-surface/60 hover:bg-red-500/20 text-gray-500 hover:text-red-400 flex items-center justify-center transition-colors text-xs">
                            <i class="fa-solid fa-trash-can"></i>
                        </button>
                    </div>
                </div>
            `;
            }).join('');
        }
    }

    // Initial cart render from storage
    updateCartUI();

    // ------------------------------------------------------------------
    // Dynamic Filter Pills Generator
    // ------------------------------------------------------------------
    function renderFilterPills(items) {
        if (!filterPillsContainer) return;

        const categoryEmojis = {
            all: '✨',
            burgers: '🍔',
            pizza: '🍕',
            sides: '🍟',
            drinks: '🍹'
        };

        const uniqueCategories = ['all', ...new Set(items.map(item => item.category.toLowerCase()))];

        filterPillsContainer.innerHTML = uniqueCategories.map(cat => {
            const isActive = cat === currentCategory;
            const emoji = categoryEmojis[cat] || '🍽️';
            const label = cat.charAt(0).toUpperCase() + cat.slice(1);
            
            const activeClasses = "bg-brand-primary text-white shadow-glow";
            const inactiveClasses = "bg-brand-surface hover:bg-brand-card text-gray-300 hover:text-white border border-brand-border";

            return `
                <button data-category="${cat}" class="filter-pill ${isActive ? 'active ' + activeClasses : inactiveClasses} px-6 py-2.5 rounded-full text-sm font-bold transition-all duration-300">
                    ${label} ${emoji}
                </button>
            `;
        }).join('');

        // Attach click listeners to newly rendered pills
        const pills = filterPillsContainer.querySelectorAll('.filter-pill');
        pills.forEach(pill => {
            pill.addEventListener('click', () => {
                const cat = pill.getAttribute('data-category');
                currentCategory = cat;
                renderFilterPills(items);
                renderMenuCards(items, currentCategory);
            });
        });
    }

    // ------------------------------------------------------------------
    // Dynamic Menu Cards Generator
    // ------------------------------------------------------------------
    function renderMenuCards(items, category = 'all') {
        if (!menuGrid) return;

        const filtered = category === 'all' 
            ? items 
            : items.filter(item => item.category.toLowerCase() === category.toLowerCase());

        if (filtered.length === 0) {
            menuGrid.innerHTML = `
                <div class="col-span-full py-16 text-center text-gray-400 space-y-3">
                    <div class="text-4xl">🍽️</div>
                    <p class="text-lg font-bold text-white">No items found in this category.</p>
                    <p class="text-xs text-gray-500">Try selecting another filter pill above.</p>
                </div>
            `;
            return;
        }

        menuGrid.innerHTML = filtered.map(item => {
            const badgeColor = item.badge_color || 'bg-brand-primary/90';
            const rating = item.rating || 4.9;
            const itemPrice = Number(item.price).toFixed(2);
            const categoryLabel = item.category ? item.category.toUpperCase() : 'BYTEBITES';
            const itemImg = item.image || DEFAULT_IMAGE_FALLBACK;
            const safeName = item.name ? item.name.replace(/"/g, '&quot;') : 'Food Item';
            const safeSingleQuoteName = item.name ? item.name.replace(/'/g, "\\'") : 'Food Item';
            const safeSingleQuoteImg = itemImg.replace(/'/g, "\\'");

            return `
                <div class="food-card group bg-brand-card border border-brand-border hover:border-brand-primary/50 rounded-2xl overflow-hidden shadow-xl transition-all duration-300 hover:-translate-y-1 hover:shadow-glow/20 flex flex-col" data-category="${item.category}" data-item-id="${item.id}">
                    <div class="relative overflow-hidden h-56 bg-brand-surface">
                        <img src="${itemImg}" alt="${safeName}" onerror="this.onerror=null;this.src='${DEFAULT_IMAGE_FALLBACK}';" class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" loading="lazy">
                        ${item.badge ? `
                            <span class="absolute top-4 left-4 ${badgeColor} backdrop-blur-md text-white text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1 shadow-md">
                                ${item.badge}
                            </span>
                        ` : ''}
                        <div class="absolute bottom-3 right-3 bg-black/70 backdrop-blur-md px-2.5 py-1 rounded-lg text-amber-400 text-xs font-bold flex items-center gap-1">
                            <i class="fa-solid fa-star"></i> ${rating}
                        </div>
                    </div>
                    <div class="p-6 flex flex-col flex-grow justify-between space-y-4">
                        <div>
                            <span class="text-brand-primary text-xs font-semibold uppercase tracking-wider">${categoryLabel}</span>
                            <h3 class="text-xl font-bold text-white mt-1 group-hover:text-brand-primary transition-colors">${item.name}</h3>
                            <p class="text-gray-400 text-xs sm:text-sm mt-2 line-clamp-2">${item.description}</p>
                        </div>
                        <div class="flex items-center justify-between pt-2 border-t border-brand-border/60">
                            <span class="text-2xl font-extrabold text-white">$${itemPrice}</span>
                            <button onclick="addToCart('${item.id}', '${safeSingleQuoteName}', ${item.price}, '${safeSingleQuoteImg}')" class="bg-brand-primary hover:bg-brand-primaryHover text-white text-xs sm:text-sm font-bold px-4 py-2.5 rounded-xl shadow-glow transition-all duration-300 flex items-center gap-2">
                                <i class="fa-solid fa-cart-plus"></i> Add to Cart
                            </button>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }

    // ------------------------------------------------------------------
    // Load Menu Data & Render Page
    // ------------------------------------------------------------------
    menuGrid.innerHTML = `
        <div class="col-span-full py-16 text-center text-gray-400 space-y-3">
            <div class="w-10 h-10 border-4 border-brand-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p class="text-sm font-semibold text-gray-300">Loading gourmet menu items...</p>
        </div>
    `;

    menuItems = await fetchMenuItems();
    renderFilterPills(menuItems);
    renderMenuCards(menuItems, currentCategory);

    // ------------------------------------------------------------------
    // Toast Notification System
    // ------------------------------------------------------------------
    function showToast(title, message) {
        if (!toast) return;

        if (toastTitle) toastTitle.textContent = title;
        if (toastMsg) toastMsg.textContent = message;

        toast.classList.remove('translate-y-20', 'opacity-0', 'pointer-events-none');
        toast.classList.add('translate-y-0', 'opacity-100');

        if (toastTimeout) clearTimeout(toastTimeout);

        toastTimeout = setTimeout(() => {
            toast.classList.add('translate-y-20', 'opacity-0', 'pointer-events-none');
            toast.classList.remove('translate-y-0', 'opacity-100');
        }, 3000);
    }

    // ------------------------------------------------------------------
    // Order Checkout Form Modal & Confirmation Modal Logic
    // ------------------------------------------------------------------
    let selectedDeliveryMethod = 'delivery';

    function getSelectedDeliveryMethod() {
        const checkedRadio = document.querySelector('input[name="deliveryType"]:checked');
        return checkedRadio ? checkedRadio.value : selectedDeliveryMethod;
    }

    function updateCheckoutSummary() {
        const totalItemsCount = cart.reduce((sum, item) => sum + item.quantity, 0);
        const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        const method = getSelectedDeliveryMethod();
        const deliveryFee = method === 'delivery' ? 2.99 : 0.00;
        const grandTotal = subtotal + deliveryFee;

        if (checkoutSummaryCount) checkoutSummaryCount.textContent = `${totalItemsCount} item${totalItemsCount !== 1 ? 's' : ''}`;
        if (checkoutSummarySubtotal) checkoutSummarySubtotal.textContent = `$${subtotal.toFixed(2)}`;
        if (checkoutSummaryFeeLabel) checkoutSummaryFeeLabel.textContent = method === 'delivery' ? 'Delivery Fee' : 'Pickup Fee';
        if (checkoutSummaryFee) checkoutSummaryFee.textContent = method === 'delivery' ? `$${deliveryFee.toFixed(2)}` : 'FREE';
        if (checkoutSummaryTotal) checkoutSummaryTotal.textContent = `$${grandTotal.toFixed(2)}`;
    }

    function updateDeliveryMethodUI() {
        const method = getSelectedDeliveryMethod();
        if (method === 'delivery') {
            if (deliveryAddressContainer) deliveryAddressContainer.classList.remove('hidden');
            if (checkoutAddressInput) checkoutAddressInput.setAttribute('required', 'required');
            if (labelDelivery) {
                labelDelivery.className = 'flex items-center justify-center gap-2.5 p-3.5 bg-brand-surface border-2 border-brand-primary text-white font-semibold text-sm rounded-xl cursor-pointer transition-all';
                const icon = labelDelivery.querySelector('i');
                if (icon) icon.className = 'fa-solid fa-truck text-brand-primary';
            }
            if (labelPickup) {
                labelPickup.className = 'flex items-center justify-center gap-2.5 p-3.5 bg-brand-surface border border-brand-border text-gray-400 font-semibold text-sm rounded-xl cursor-pointer transition-all hover:border-gray-500';
                const icon = labelPickup.querySelector('i');
                if (icon) icon.className = 'fa-solid fa-store';
            }
        } else {
            if (deliveryAddressContainer) deliveryAddressContainer.classList.add('hidden');
            if (checkoutAddressInput) checkoutAddressInput.removeAttribute('required');
            if (labelDelivery) {
                labelDelivery.className = 'flex items-center justify-center gap-2.5 p-3.5 bg-brand-surface border border-brand-border text-gray-400 font-semibold text-sm rounded-xl cursor-pointer transition-all hover:border-gray-500';
                const icon = labelDelivery.querySelector('i');
                if (icon) icon.className = 'fa-solid fa-truck';
            }
            if (labelPickup) {
                labelPickup.className = 'flex items-center justify-center gap-2.5 p-3.5 bg-brand-surface border-2 border-brand-primary text-white font-semibold text-sm rounded-xl cursor-pointer transition-all';
                const icon = labelPickup.querySelector('i');
                if (icon) icon.className = 'fa-solid fa-store text-brand-primary';
            }
        }
        updateCheckoutSummary();
    }

    // Attach listener for delivery method radio changes
    const deliveryRadios = document.querySelectorAll('input[name="deliveryType"]');
    deliveryRadios.forEach(radio => {
        radio.addEventListener('change', updateDeliveryMethodUI);
    });

    function openOrderCheckoutModal() {
        if (cart.length === 0) {
            showToast("Cart Empty", "Please add items to your cart before checking out!");
            return;
        }

        closeCart();
        updateDeliveryMethodUI();

        if (orderCheckoutModal) {
            orderCheckoutModal.classList.remove('hidden');
            setTimeout(() => {
                orderCheckoutModal.classList.remove('opacity-0');
                if (orderCheckoutBackdrop) orderCheckoutBackdrop.classList.remove('opacity-0');
            }, 10);
            document.body.style.overflow = 'hidden';
        }
    }

    function closeOrderCheckoutModal() {
        if (!orderCheckoutModal) return;
        orderCheckoutModal.classList.add('opacity-0');
        if (orderCheckoutBackdrop) orderCheckoutBackdrop.classList.add('opacity-0');
        setTimeout(() => {
            orderCheckoutModal.classList.add('hidden');
            document.body.style.overflow = '';
            if (checkoutForm) checkoutForm.reset();
            if (deliveryRadioDelivery) deliveryRadioDelivery.checked = true;
            updateDeliveryMethodUI();
        }, 300);
    }

    function closeCheckoutSuccessModal() {
        if (!checkoutModal) return;
        checkoutModal.classList.add('opacity-0');
        if (checkoutModalBackdrop) checkoutModalBackdrop.classList.add('opacity-0');
        setTimeout(() => {
            checkoutModal.classList.add('hidden');
            document.body.style.overflow = '';
        }, 300);
    }

    // Submit handler for Order Checkout Form
    if (checkoutForm) {
        checkoutForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const name = checkoutNameInput ? checkoutNameInput.value.trim() : '';
            const phone = checkoutPhoneInput ? checkoutPhoneInput.value.trim() : '';
            const method = getSelectedDeliveryMethod();
            const address = checkoutAddressInput ? checkoutAddressInput.value.trim() : '';

            if (!name) {
                showToast("Missing Field", "Please enter your Full Name.");
                if (checkoutNameInput) checkoutNameInput.focus();
                return;
            }
            if (!phone) {
                showToast("Missing Field", "Please enter your Phone Number.");
                if (checkoutPhoneInput) checkoutPhoneInput.focus();
                return;
            }
            if (method === 'delivery' && !address) {
                showToast("Missing Field", "Please enter your Delivery Address.");
                if (checkoutAddressInput) checkoutAddressInput.focus();
                return;
            }

            const submitBtn = checkoutForm.querySelector('button[type="submit"]') || document.getElementById('checkout-submit-btn');
            const originalBtnContent = submitBtn ? submitBtn.innerHTML : '';

            // Disable button and show spinner (fa-spin) during fetch
            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.classList.add('opacity-75', 'cursor-not-allowed');
                submitBtn.innerHTML = `
                    <i class="fa-solid fa-circle-notch fa-spin"></i>
                    <span>Submitting Order...</span>
                `;
            }

            // Calculate final order summary
            const totalCount = cart.reduce((sum, item) => sum + item.quantity, 0);
            const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
            const deliveryFee = method === 'delivery' ? 2.99 : 0.00;
            const grandTotal = subtotal + deliveryFee;

            const randomNum = Math.floor(10000 + Math.random() * 90000);
            const orderId = `#BB-${randomNum}`;

            // Prepare Order Details for Telegram
            const orderDetails = {
                orderId,
                customer: {
                    name,
                    phone,
                    method,
                    address: method === 'delivery' ? address : null,
                    notes: checkoutCommentInput ? checkoutCommentInput.value.trim() : null
                },
                items: [...cart],
                subtotal,
                deliveryFee,
                total: grandTotal,
                timestamp: new Date().toLocaleString()
            };

            try {
                // Send notification to Telegram
                const result = await sendOrderToTelegram(orderDetails);

                if (result && result.success === false) {
                    throw new Error(typeof result.error === 'string' ? result.error : 'Failed to send order to Telegram. Please check connection.');
                }

                // ON SUCCESS:
                // 1. Close Checkout Form Modal
                if (orderCheckoutModal) {
                    orderCheckoutModal.classList.add('opacity-0');
                    if (orderCheckoutBackdrop) orderCheckoutBackdrop.classList.add('opacity-0');
                    setTimeout(() => {
                        orderCheckoutModal.classList.add('hidden');
                    }, 300);
                }

                // 2. Play subtle success state and show confirmation modal
                if (modalOrderId) modalOrderId.textContent = orderId;
                if (modalOrderTotal) modalOrderTotal.textContent = `$${grandTotal.toFixed(2)}`;
                if (modalItemCount) modalItemCount.textContent = `${totalCount} item${totalCount !== 1 ? 's' : ''}`;

                if (checkoutModal) {
                    checkoutModal.classList.remove('hidden');
                    setTimeout(() => {
                        checkoutModal.classList.remove('opacity-0');
                        if (checkoutModalBackdrop) checkoutModalBackdrop.classList.remove('opacity-0');
                    }, 10);
                    document.body.style.overflow = 'hidden';
                }

                // 3. Clear cart
                clearCart();

                // 4. Show success Toast
                showToast("Order Sent!", "Order Sent! We will call you back shortly");

                // 5. Reset form
                if (checkoutForm) checkoutForm.reset();
                if (deliveryRadioDelivery) deliveryRadioDelivery.checked = true;
                updateDeliveryMethodUI();

            } catch (err) {
                console.error('[Checkout Submission Error]', err);
                // ON ERROR: show error message to user
                showToast("Submission Failed", err.message || "An error occurred while submitting your order.");
            } finally {
                // Re-enable submit button
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.classList.remove('opacity-75', 'cursor-not-allowed');
                    submitBtn.innerHTML = originalBtnContent || `<span>Confirm & Send Order</span> <i class="fa-solid fa-paper-plane"></i>`;
                }
            }
        });
    }

    if (checkoutBtn) checkoutBtn.addEventListener('click', openOrderCheckoutModal);
    if (orderCheckoutCloseBtn) orderCheckoutCloseBtn.addEventListener('click', closeOrderCheckoutModal);
    if (checkoutCancelBtn) checkoutCancelBtn.addEventListener('click', closeOrderCheckoutModal);
    if (orderCheckoutBackdrop) orderCheckoutBackdrop.addEventListener('click', closeOrderCheckoutModal);

    if (closeCheckoutModalBtn) closeCheckoutModalBtn.addEventListener('click', closeCheckoutSuccessModal);
    if (checkoutModalBackdrop) checkoutModalBackdrop.addEventListener('click', closeCheckoutSuccessModal);

    // ------------------------------------------------------------------
    // Admin Modal – Add New Dish
    // ------------------------------------------------------------------
    const adminModal = document.getElementById('admin-modal');
    const adminModalBackdrop = document.getElementById('admin-modal-backdrop');
    const adminCloseBtn = document.getElementById('admin-close-btn');
    const adminForm = document.getElementById('admin-dish-form');
    const adminSubmitBtn = document.getElementById('admin-submit-btn');
    const adminSubmitText = document.getElementById('admin-submit-text');
    const adminSubmitSpinner = document.getElementById('admin-submit-spinner');

    // Expose globally so the header gear icon can call it
    window.openAdminModal = function () {
        if (!adminModal) return;
        adminModal.classList.remove('hidden');
        setTimeout(() => adminModal.classList.remove('opacity-0'), 10);
        document.body.style.overflow = 'hidden';
    };

    function closeAdminModal() {
        if (!adminModal) return;
        adminModal.classList.add('opacity-0');
        setTimeout(() => {
            adminModal.classList.add('hidden');
            document.body.style.overflow = '';
            if (adminForm) adminForm.reset();
        }, 300);
    }

    if (adminCloseBtn) adminCloseBtn.addEventListener('click', closeAdminModal);
    if (adminModalBackdrop) adminModalBackdrop.addEventListener('click', closeAdminModal);

    // Category badge colour map
    const BADGE_COLORS = {
        "Spicy 🔥": "bg-red-600/90",
        "Popular ⭐": "bg-amber-500/90",
        "Best Seller": "bg-emerald-600/90",
        "Chef's Pick ⚡": "bg-brand-primary/90",
        "Refreshing ⚡": "bg-sky-600/90",
        "New 🆕": "bg-violet-600/90",
        "": ""
    };

    // ------------------------------------------------------------------
    // LocalStorage persistence for admin-added items (fallback mode)
    // ------------------------------------------------------------------
    const LS_ADMIN_KEY = 'bytebites_admin_items';

    function loadAdminItems() {
        try {
            return JSON.parse(localStorage.getItem(LS_ADMIN_KEY) || '[]');
        } catch { return []; }
    }

    function saveAdminItems(items) {
        try {
            localStorage.setItem(LS_ADMIN_KEY, JSON.stringify(items));
        } catch (e) { console.error('Failed to persist admin item:', e); }
    }

    // Merge admin-added local items into the live menu on page load
    const savedAdminItems = loadAdminItems();
    if (savedAdminItems.length > 0) {
        menuItems = [...menuItems, ...savedAdminItems];
        renderFilterPills(menuItems);
        renderMenuCards(menuItems, currentCategory);
    }

    // ------------------------------------------------------------------
    // Handle form submission
    // ------------------------------------------------------------------
    if (adminForm) {
        adminForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            // Gather form values
            const name = document.getElementById('admin-name').value.trim();
            const category = document.getElementById('admin-category').value.trim().toLowerCase();
            const price = parseFloat(document.getElementById('admin-price').value);
            const image = document.getElementById('admin-image').value.trim();
            const description = document.getElementById('admin-desc').value.trim();
            const badge = document.getElementById('admin-badge').value;

            if (!name || !category || isNaN(price) || price <= 0) {
                showToast("Validation Error", "Please fill in all required fields correctly.");
                return;
            }

            const newItem = {
                id: Date.now(), // temp unique id
                name,
                category,
                price,
                image: image || DEFAULT_IMAGE_FALLBACK,
                description,
                badge,
                badge_color: BADGE_COLORS[badge] || 'bg-brand-primary/90',
                rating: 5.0
            };

            // Show loading state
            if (adminSubmitBtn) adminSubmitBtn.disabled = true;
            if (adminSubmitText) adminSubmitText.textContent = 'Adding…';
            if (adminSubmitSpinner) adminSubmitSpinner.classList.remove('hidden');

            let insertedViaSupabase = false;

            // Try Supabase insert if configured
            if (typeof window.supabase !== 'undefined' && SUPABASE_URL && SUPABASE_ANON_KEY
                && SUPABASE_URL.trim() !== '' && SUPABASE_ANON_KEY.trim() !== '') {
                try {
                    const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
                    const { data, error } = await supabaseClient
                        .from('menu_items')
                        .insert([{ name, category, price, image: newItem.image, description, badge, badge_color: newItem.badge_color, rating: 5.0 }])
                        .select()
                        .single();

                    if (!error && data) {
                        newItem.id = data.id; // use server-assigned id
                        insertedViaSupabase = true;
                    } else {
                        console.warn('Supabase insert failed, falling back to localStorage:', error?.message);
                    }
                } catch (err) {
                    console.warn('Supabase insert error:', err);
                }
            }

            // localStorage fallback
            if (!insertedViaSupabase) {
                const adminItems = loadAdminItems();
                adminItems.push(newItem);
                saveAdminItems(adminItems);
            }

            // Merge into live menu & re-render
            menuItems = [...menuItems, newItem];
            renderFilterPills(menuItems);
            renderMenuCards(menuItems, currentCategory);

            // Reset UI state
            if (adminSubmitBtn) adminSubmitBtn.disabled = false;
            if (adminSubmitText) adminSubmitText.textContent = 'Add to Menu';
            if (adminSubmitSpinner) adminSubmitSpinner.classList.add('hidden');

            closeAdminModal();

            const modeLabel = insertedViaSupabase ? 'Saved to Supabase!' : 'Saved locally!';
            showToast("Dish Added ✅", `"${name}" is now live on the menu. ${modeLabel}`);

            // Scroll to the new card
            setTimeout(() => {
                const newCard = menuGrid.querySelector(`[data-item-id="${newItem.id}"]`);
                if (newCard) newCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }, 100);
        });
    }
});

