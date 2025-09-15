// Default cake data
const defaultCakes = [
    {
        id: '1',
        name: 'Chocolate Fudge Cake',
        category: 'Chocolate',
        priceUSD: 25.99,
        priceTSH: 65000,
        description: 'Rich chocolate cake with fudge frosting',
        image: 'https://images.pexels.com/photos/291528/pexels-photo-291528.jpeg?auto=compress&cs=tinysrgb&w=300'
    },
    {
        id: '2',
        name: 'Vanilla Buttercream Cake',
        category: 'Vanilla',
        priceUSD: 22.99,
        priceTSH: 57500,
        description: 'Classic vanilla cake with smooth buttercream',
        image: 'https://images.pexels.com/photos/1721932/pexels-photo-1721932.jpeg?auto=compress&cs=tinysrgb&w=300'
    },
    {
        id: '3',
        name: 'Red Velvet Cake',
        category: 'Red Velvet',
        priceUSD: 28.99,
        priceTSH: 72500,
        description: 'Moist red velvet with cream cheese frosting',
        image: 'https://images.pexels.com/photos/4099094/pexels-photo-4099094.jpeg?auto=compress&cs=tinysrgb&w=300'
    },
    {
        id: '4',
        name: 'Strawberry Shortcake',
        category: 'Fruit',
        priceUSD: 24.99,
        priceTSH: 62500,
        description: 'Fresh strawberries with whipped cream',
        image: 'https://images.pexels.com/photos/1070850/pexels-photo-1070850.jpeg?auto=compress&cs=tinysrgb&w=300'
    },
    {
        id: '5',
        name: 'Lemon Drizzle Cake',
        category: 'Citrus',
        priceUSD: 21.99,
        priceTSH: 55000,
        description: 'Zesty lemon cake with sweet drizzle',
        image: 'https://images.pexels.com/photos/1721932/pexels-photo-1721932.jpeg?auto=compress&cs=tinysrgb&w=300'
    },
    {
        id: '6',
        name: 'Black Forest Cake',
        category: 'Chocolate',
        priceUSD: 32.99,
        priceTSH: 82500,
        description: 'Chocolate sponge with cherries and cream',
        image: 'https://images.pexels.com/photos/291528/pexels-photo-291528.jpeg?auto=compress&cs=tinysrgb&w=300'
    }
];

// Initialize default data
function initializeDefaultData() {
    // Initialize users with default admin
    if (!localStorage.getItem('users')) {
        const defaultUsers = [
            {
                id: '1',
                name: 'Admin User',
                email: 'admin@cakeshop.com',
                password: 'admin123',
                role: 'admin',
                createdAt: new Date().toISOString()
            }
        ];
        localStorage.setItem('users', JSON.stringify(defaultUsers));
    }

    // Initialize cakes
    if (!localStorage.getItem('cakes')) {
        localStorage.setItem('cakes', JSON.stringify(defaultCakes));
    }

    // Initialize orders
    if (!localStorage.getItem('orders')) {
        localStorage.setItem('orders', JSON.stringify([]));
    }

    // Initialize notifications
    if (!localStorage.getItem('notifications')) {
        localStorage.setItem('notifications', JSON.stringify([]));
    }

    // Initialize currency preference
    if (!localStorage.getItem('currency')) {
        localStorage.setItem('currency', 'USD');
    }
}

// Data access functions
function getUsers() {
    return JSON.parse(localStorage.getItem('users') || '[]');
}

function saveUsers(users) {
    localStorage.setItem('users', JSON.stringify(users));
}

function getOrders() {
    return JSON.parse(localStorage.getItem('orders') || '[]');
}

function saveOrders(orders) {
    localStorage.setItem('orders', JSON.stringify(orders));
}

function getCakes() {
    return JSON.parse(localStorage.getItem('cakes') || '[]');
}

function getCurrentUser() {
    return JSON.parse(localStorage.getItem('currentUser') || 'null');
}

function saveCurrentUser(user) {
    localStorage.setItem('currentUser', JSON.stringify(user));
}

function clearCurrentUser() {
    localStorage.removeItem('currentUser');
}

function getNotifications() {
    return JSON.parse(localStorage.getItem('notifications') || '[]');
}

function saveNotifications(notifications) {
    localStorage.setItem('notifications', JSON.stringify(notifications));
}

function getCurrentCurrency() {
    return localStorage.getItem('currency') || 'USD';
}

function saveCurrency(currency) {
    localStorage.setItem('currency', currency);
}

function formatPrice(priceUSD, priceTSH, currency = null) {
    const currentCurrency = currency || getCurrentCurrency();
    if (currentCurrency === 'TSH') {
        return `TSh ${priceTSH.toLocaleString()}`;
    }
    return `$${priceUSD.toFixed(2)}`;
}

function getCakePrice(cake, currency = null) {
    const currentCurrency = currency || getCurrentCurrency();
    return currentCurrency === 'TSH' ? cake.priceTSH : cake.priceUSD;
}

function getCurrencySymbol(currency = null) {
    const currentCurrency = currency || getCurrentCurrency();
    return currentCurrency === 'TSH' ? 'TSh ' : '$';
}

// Initialize data on load
initializeDefaultData();