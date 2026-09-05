/**
 * Initial & Fallback Menu Mockup Data
 */
export const CATEGORIES = [
    { id: 'all', labelKey: 'menu.filter_all', icon: 'fa-layer-group' },
    { id: 'burgers', labelKey: 'menu.filter_burgers', icon: 'fa-burger' },
    { id: 'pizza', labelKey: 'menu.filter_pizza', icon: 'fa-pizza-slice' },
    { id: 'sides', labelKey: 'menu.filter_sides', icon: 'fa-drumstick-bite' },
    { id: 'drinks', labelKey: 'menu.filter_drinks', icon: 'fa-glass-water' }
];

export const INITIAL_MENU_ITEMS = [
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
        image: "https://images.unsplash.com/photo-1585109649139-366815a0d713?w=300"
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
