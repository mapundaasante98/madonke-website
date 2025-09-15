// Global variables
let currentUser = null;
let currentChart = null;
let selectedCakes = {};
let notificationDropdownOpen = false;

// Initialize application
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
    setupEventListeners();
});

function initializeApp() {
    currentUser = getCurrentUser();
    initializeCurrency();
    loadNotifications();
    if (currentUser) {
        showMainApp();
    } else {
        showAuthScreen();
    }
}

function initializeCurrency() {
    const currency = getCurrentCurrency();
    document.getElementById('currencySelector').value = currency;
}

function setupEventListeners() {
    // Login form
    document.getElementById('loginForm').addEventListener('submit', handleLogin);
    
    // Register form
    document.getElementById('registerForm').addEventListener('submit', handleRegister);
    
    // New order form (shopkeeper)
    document.getElementById('newOrderForm').addEventListener('submit', handleNewOrder);
    
    // Add user form (admin)
    document.getElementById('addUserForm').addEventListener('submit', handleAddUser);
    
    // Close modals when clicking outside
    window.addEventListener('click', function(event) {
        if (event.target.classList.contains('modal')) {
            event.target.classList.remove('show');
        }
    });

    // Close notification dropdown when clicking outside
    document.addEventListener('click', function(event) {
        if (!event.target.closest('.notification-bell') && !event.target.closest('.notification-dropdown')) {
            closeNotificationDropdown();
        }
    });
}

// Authentication functions
function handleLogin(e) {
    e.preventDefault();
    
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    const errorDiv = document.getElementById('loginError');
    
    errorDiv.classList.remove('show');
    
    if (!email || !password) {
        showError(errorDiv, 'Please fill in all fields');
        return;
    }
    
    const users = getUsers();
    const user = users.find(u => u.email === email && u.password === password);
    
    if (user) {
        currentUser = user;
        saveCurrentUser(user);
        showMainApp();
    } else {
        showError(errorDiv, 'Invalid email or password');
    }
}

function handleRegister(e) {
    e.preventDefault();
    
    const name = document.getElementById('registerName').value;
    const email = document.getElementById('registerEmail').value;
    const role = document.getElementById('registerRole').value;
    const shopName = document.getElementById('registerShopName').value;
    const address = document.getElementById('registerAddress').value;
    const phone = document.getElementById('registerPhone').value;
    const password = document.getElementById('registerPassword').value;
    const confirmPassword = document.getElementById('registerConfirmPassword').value;
    
    const errorDiv = document.getElementById('registerError');
    const successDiv = document.getElementById('registerSuccess');
    
    errorDiv.classList.remove('show');
    successDiv.classList.remove('show');
    
    if (!name || !email || !password) {
        showError(errorDiv, 'Please fill in all required fields');
        return;
    }
    
    if (password !== confirmPassword) {
        showError(errorDiv, 'Passwords do not match');
        return;
    }
    
    if (role === 'shopkeeper' && !shopName) {
        showError(errorDiv, 'Shop name is required for shopkeepers');
        return;
    }
    
    const users = getUsers();
    
    if (users.some(u => u.email === email)) {
        showError(errorDiv, 'Email already exists');
        return;
    }
    
    const newUser = {
        id: Date.now().toString(),
        name,
        email,
        password,
        role,
        shopName: role === 'shopkeeper' ? shopName : undefined,
        address: address || undefined,
        phone: phone || undefined,
        createdAt: new Date().toISOString()
    };
    
    users.push(newUser);
    saveUsers(users);
    
    showSuccess(successDiv, 'Registration successful! You can now sign in.');
    document.getElementById('registerForm').reset();
    document.getElementById('shopFields').style.display = 'none';
}

function logout() {
    currentUser = null;
    clearCurrentUser();
    showAuthScreen();
}

// UI functions
function showAuthScreen() {
    document.getElementById('auth-screen').style.display = 'flex';
    document.getElementById('main-app').style.display = 'none';
}

function showMainApp() {
    document.getElementById('auth-screen').style.display = 'none';
    document.getElementById('main-app').style.display = 'block';
    
    updateNavigation();
    showDashboard();
    loadDashboardData();
}

function updateNavigation() {
    document.getElementById('userName').textContent = currentUser.name;
    document.getElementById('userRole').textContent = currentUser.role;
    updateNotificationBadge();
}

function showDashboard() {
    // Hide all dashboards
    document.querySelectorAll('.dashboard').forEach(d => d.style.display = 'none');
    
    // Show appropriate dashboard
    const dashboardId = `${currentUser.role}-dashboard`;
    const dashboard = document.getElementById(dashboardId);
    if (dashboard) {
        dashboard.style.display = 'block';
    }
}

function toggleAuthMode() {
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    
    if (loginForm.classList.contains('active')) {
        loginForm.classList.remove('active');
        registerForm.classList.add('active');
    } else {
        registerForm.classList.remove('active');
        loginForm.classList.add('active');
    }
}

function toggleShopFields() {
    const role = document.getElementById('registerRole').value;
    const shopFields = document.getElementById('shopFields');
    shopFields.style.display = role === 'shopkeeper' ? 'block' : 'none';
}

function toggleAddUserShopFields() {
    const role = document.getElementById('addUserRole').value;
    const shopFields = document.getElementById('addUserShopFields');
    shopFields.style.display = role === 'shopkeeper' ? 'block' : 'none';
}

function showError(element, message) {
    element.textContent = message;
    element.classList.add('show');
}

function showSuccess(element, message) {
    element.textContent = message;
    element.classList.add('show');
}

// Dashboard functions
function loadDashboardData() {
    if (currentUser.role === 'admin') {
        loadAdminDashboard();
    } else if (currentUser.role === 'shopkeeper') {
        loadShopkeeperDashboard();
    } else if (currentUser.role === 'customer') {
        loadCustomerDashboard();
    }
}

function loadAdminDashboard() {
    const users = getUsers();
    const orders = getOrders();
    const currency = getCurrentCurrency();
    
    const shopkeepers = users.filter(u => u.role === 'shopkeeper');
    const customers = users.filter(u => u.role === 'customer');
    const completedOrders = orders.filter(o => o.status === 'completed');
    const totalRevenue = currency === 'TSH' 
        ? completedOrders.reduce((sum, order) => sum + (order.totalAmountTSH || order.totalAmount * 2500), 0)
        : completedOrders.reduce((sum, order) => sum + (order.totalAmountUSD || order.totalAmount), 0);
    
    document.getElementById('totalShopkeepers').textContent = shopkeepers.length;
    document.getElementById('totalCustomers').textContent = customers.length;
    document.getElementById('totalOrders').textContent = orders.length;
    document.getElementById('totalRevenue').textContent = currency === 'TSH' 
        ? `TSh ${totalRevenue.toLocaleString()}` 
        : `$${totalRevenue.toFixed(2)}`;
    
    loadRecentOrders();
    loadTodaySummary();
    loadUsersTable();
    loadOrdersTable();
    updateReports();
}

function loadShopkeeperDashboard() {
    const orders = getOrders();
    const myOrders = orders.filter(o => o.shopkeeperId === currentUser.id);
    const currency = getCurrentCurrency();
    
    const pendingOrders = myOrders.filter(o => o.status === 'pending').length;
    const completedOrders = myOrders.filter(o => o.status === 'completed').length;
    const completedMyOrders = myOrders.filter(o => o.status === 'completed');
    const totalRevenue = currency === 'TSH'
        ? completedMyOrders.reduce((sum, order) => sum + (order.totalAmountTSH || order.totalAmount * 2500), 0)
        : completedMyOrders.reduce((sum, order) => sum + (order.totalAmountUSD || order.totalAmount), 0);
    
    document.getElementById('shopkeeperWelcome').textContent = `Welcome, ${currentUser.shopName || currentUser.name}`;
    document.getElementById('shopkeeperTotalOrders').textContent = myOrders.length;
    document.getElementById('shopkeeperPendingOrders').textContent = pendingOrders;
    document.getElementById('shopkeeperCompletedOrders').textContent = completedOrders;
    document.getElementById('shopkeeperRevenue').textContent = currency === 'TSH'
        ? `TSh ${totalRevenue.toLocaleString()}`
        : `$${totalRevenue.toFixed(2)}`;
    
    loadShopkeeperOrdersTable();
}

function loadCustomerDashboard() {
    const orders = getOrders();
    const myOrders = orders.filter(o => o.customerId === currentUser.id);
    const currency = getCurrentCurrency();
    
    const pendingOrders = myOrders.filter(o => o.status === 'pending').length;
    const completedOrders = myOrders.filter(o => o.status === 'completed').length;
    const completedMyOrders = myOrders.filter(o => o.status === 'completed');
    const totalSpent = currency === 'TSH'
        ? completedMyOrders.reduce((sum, order) => sum + (order.totalAmountTSH || order.totalAmount * 2500), 0)
        : completedMyOrders.reduce((sum, order) => sum + (order.totalAmountUSD || order.totalAmount), 0);
    
    document.getElementById('customerWelcome').textContent = `Welcome, ${currentUser.name}`;
    document.getElementById('customerTotalOrders').textContent = myOrders.length;
    document.getElementById('customerPendingOrders').textContent = pendingOrders;
    document.getElementById('customerCompletedOrders').textContent = completedOrders;
    document.getElementById('customerTotalSpent').textContent = currency === 'TSH'
        ? `TSh ${totalSpent.toLocaleString()}`
        : `$${totalSpent.toFixed(2)}`;
    
    loadCustomerOrdersTable();
}

function loadRecentOrders() {
    const orders = getOrders();
    const recentOrders = orders.slice(-5).reverse();
    const container = document.getElementById('recentOrders');
    const currency = getCurrentCurrency();
    
    container.innerHTML = recentOrders.map(order => `
        <div class="order-item">
            <div class="order-info">
                <h4>#${order.id}</h4>
                <p>${order.customerName}</p>
            </div>
            <div class="order-details">
                <div class="order-amount">${currency === 'TSH' 
                    ? `TSh ${(order.totalAmountTSH || order.totalAmount * 2500).toLocaleString()}` 
                    : `$${(order.totalAmountUSD || order.totalAmount).toFixed(2)}`}</div>
                <span class="status-badge status-${order.status}">${order.status}</span>
            </div>
        </div>
    `).join('');
}

function loadTodaySummary() {
    const orders = getOrders();
    const today = new Date().toDateString();
    const todayOrders = orders.filter(order => new Date(order.orderDate).toDateString() === today);
    const currency = getCurrentCurrency();
    const todayRevenue = currency === 'TSH'
        ? todayOrders.reduce((sum, order) => sum + (order.totalAmountTSH || order.totalAmount * 2500), 0)
        : todayOrders.reduce((sum, order) => sum + (order.totalAmountUSD || order.totalAmount), 0);
    const pendingOrders = orders.filter(order => order.status === 'pending').length;
    const completedOrders = orders.filter(order => order.status === 'completed').length;
    
    document.getElementById('todaySummary').innerHTML = `
        <div class="summary-item">
            <span class="summary-label">Today's Orders:</span>
            <span class="summary-value">${todayOrders.length}</span>
        </div>
        <div class="summary-item">
            <span class="summary-label">Today's Revenue:</span>
            <span class="summary-value">${currency === 'TSH'
                ? `TSh ${todayRevenue.toLocaleString()}`
                : `$${todayRevenue.toFixed(2)}`}</span>
        </div>
        <div class="summary-item">
            <span class="summary-label">Pending Orders:</span>
            <span class="summary-value">${pendingOrders}</span>
        </div>
        <div class="summary-item">
            <span class="summary-label">Completed Orders:</span>
            <span class="summary-value">${completedOrders}</span>
        </div>
    `;
}

function loadUsersTable() {
    const users = getUsers();
    const tbody = document.querySelector('#usersTable tbody');
    
    tbody.innerHTML = users.map(user => `
        <tr>
            <td>
                <div>
                    <div style="font-weight: 600;">${user.name}</div>
                    <div style="color: #6b7280; font-size: 14px;">${user.email}</div>
                    ${user.shopName ? `<div style="color: #3b82f6; font-size: 14px;">${user.shopName}</div>` : ''}
                </div>
            </td>
            <td><span class="role-badge role-${user.role}">${user.role}</span></td>
            <td>
                <div>${user.phone || 'N/A'}</div>
                <div style="color: #6b7280; font-size: 14px;">${user.address || 'N/A'}</div>
            </td>
            <td>${new Date(user.createdAt).toLocaleDateString()}</td>
            <td>
                <button class="action-btn btn-edit" onclick="editUser('${user.id}')">Edit</button>
                ${user.role !== 'admin' ? `<button class="action-btn btn-delete" onclick="deleteUser('${user.id}')">Delete</button>` : ''}
            </td>
        </tr>
    `).join('');
}

function loadOrdersTable() {
    const orders = getOrders();
    const tbody = document.querySelector('#ordersTable tbody');
    const currency = getCurrentCurrency();
    
    tbody.innerHTML = orders.map(order => `
        <tr>
            <td style="font-weight: 600;">#${order.id}</td>
            <td>
                <div>${order.customerName}</div>
                ${order.shopName ? `<div style="color: #6b7280; font-size: 14px;">${order.shopName}</div>` : ''}
            </td>
            <td>${currency === 'TSH'
                ? `TSh ${(order.totalAmountTSH || order.totalAmount * 2500).toLocaleString()}`
                : `$${(order.totalAmountUSD || order.totalAmount).toFixed(2)}`}</td>
            <td>
                <select onchange="updateOrderStatus('${order.id}', this.value)" class="status-badge status-${order.status}" style="border: none; background: transparent;">
                    <option value="pending" ${order.status === 'pending' ? 'selected' : ''}>Pending</option>
                    <option value="approved" ${order.status === 'approved' ? 'selected' : ''}>Approved</option>
                    <option value="in-progress" ${order.status === 'in-progress' ? 'selected' : ''}>In Progress</option>
                    <option value="completed" ${order.status === 'completed' ? 'selected' : ''}>Completed</option>
                    <option value="cancelled" ${order.status === 'cancelled' ? 'selected' : ''}>Cancelled</option>
                </select>
            </td>
            <td>${new Date(order.orderDate).toLocaleDateString()}</td>
            <td>
                <div style="font-size: 12px;">Items: ${order.items.length}</div>
            </td>
        </tr>
    `).join('');
}

function loadShopkeeperOrdersTable() {
    const orders = getOrders();
    const myOrders = orders.filter(o => o.shopkeeperId === currentUser.id);
    const tbody = document.querySelector('#shopkeeperOrdersTable tbody');
    const currency = getCurrentCurrency();
    
    tbody.innerHTML = myOrders.map(order => `
        <tr>
            <td style="font-weight: 600;">#${order.id}</td>
            <td>
                ${order.items.map(item => `<div style="font-size: 12px;">${item.cakeName} x${item.quantity}</div>`).join('')}
            </td>
            <td>${currency === 'TSH'
                ? `TSh ${(order.totalAmountTSH || order.totalAmount * 2500).toLocaleString()}`
                : `$${(order.totalAmountUSD || order.totalAmount).toFixed(2)}`}</td>
            <td><span class="status-badge status-${order.status}">${order.status}</span></td>
            <td>${new Date(order.orderDate).toLocaleDateString()}</td>
        </tr>
    `).join('');
}

function loadCustomerOrdersTable() {
    const orders = getOrders();
    const myOrders = orders.filter(o => o.customerId === currentUser.id);
    const tbody = document.querySelector('#customerOrdersTable tbody');
    const currency = getCurrentCurrency();
    
    tbody.innerHTML = myOrders.map(order => `
        <tr>
            <td style="font-weight: 600;">#${order.id}</td>
            <td>
                ${order.items.map(item => `<div style="font-size: 12px;">${item.cakeName} x${item.quantity}</div>`).join('')}
            </td>
            <td>${currency === 'TSH'
                ? `TSh ${(order.totalAmountTSH || order.totalAmount * 2500).toLocaleString()}`
                : `$${(order.totalAmountUSD || order.totalAmount).toFixed(2)}`}</td>
            <td><span class="status-badge status-${order.status}">${order.status}</span></td>
            <td>${new Date(order.orderDate).toLocaleDateString()}</td>
        </tr>
    `).join('');
}

// Tab functions
function switchTab(tabName) {
    // Update tab buttons
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');
    
    // Update tab content
    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
    document.getElementById(`${tabName}-tab`).classList.add('active');
    
    // Load specific data if needed
    if (tabName === 'reports') {
        updateReports();
    }
}

// Order functions
function updateOrderStatus(orderId, status) {
    const orders = getOrders();
    const orderIndex = orders.findIndex(o => o.id === orderId);
    
    if (orderIndex !== -1) {
        const order = orders[orderIndex];
        const oldStatus = order.status;
        orders[orderIndex].status = status;
        saveOrders(orders);
        
        // Send notification about status change
        if (oldStatus !== status) {
            const statusMessages = {
                'approved': 'Your order has been approved and is being prepared.',
                'in-progress': 'Your order is now in progress.',
                'completed': 'Your order has been completed and is ready!',
                'cancelled': 'Your order has been cancelled.'
            };
            
            if (statusMessages[status]) {
                sendNotification(order.customerId, 'Order Status Update', `Order #${orderId}: ${statusMessages[status]}`);
                
                // Also notify shopkeeper if exists
                if (order.shopkeeperId) {
                    sendNotification(order.shopkeeperId, 'Order Status Updated', `Order #${orderId} status changed to ${status}`);
                }
            }
        }
        
        loadDashboardData();
    }
}

function showNewOrderModal() {
    document.getElementById('newOrderModal').classList.add('show');
    document.getElementById('orderItems').innerHTML = '';
    addOrderItem();
}

function addOrderItem() {
    const container = document.getElementById('orderItems');
    const cakes = getCakes();
    const itemDiv = document.createElement('div');
    itemDiv.className = 'order-item-row';
    
    const cakeOptions = cakes.map(cake => `<option value="${cake.id}">${cake.name} - ${formatPrice(cake.priceUSD, cake.priceTSH)}</option>`).join('');
    
    itemDiv.innerHTML = `
        <select class="cake-select">
            ${cakeOptions}
        </select>
        <input type="number" min="1" value="1" class="quantity-input" placeholder="Qty">
        <button type="button" class="btn-remove" onclick="removeOrderItem(this)">Remove</button>
    `;
    
    container.appendChild(itemDiv);
}

function removeOrderItem(button) {
    button.parentElement.remove();
}

function handleNewOrder(e) {
    e.preventDefault();
    
    const itemRows = document.querySelectorAll('.order-item-row');
    const notes = document.getElementById('orderNotes').value;
    
    if (itemRows.length === 0) {
        alert('Please add at least one item to your order');
        return;
    }
    
    const items = [];
    const cakes = getCakes();
    
    itemRows.forEach(row => {
        const cakeId = row.querySelector('.cake-select').value;
        const quantity = parseInt(row.querySelector('.quantity-input').value);
        const cake = cakes.find(c => c.id === cakeId);
        const price = getCakePrice(cake);
        
        if (cake && quantity > 0) {
            items.push({
                cakeId,
                cakeName: cake.name,
                quantity,
                priceUSD: cake.priceUSD,
                priceTSH: cake.priceTSH,
                price: price
            });
        }
    });

    const totalAmountUSD = items.reduce((sum, item) => sum + (item.priceUSD * item.quantity), 0);
    const totalAmountTSH = items.reduce((sum, item) => sum + (item.priceTSH * item.quantity), 0);
    const totalAmount = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    const order = {
        id: Date.now().toString(),
        customerId: currentUser.id,
        shopkeeperId: currentUser.id,
        customerName: currentUser.name,
        shopName: currentUser.shopName,
        items,
        totalAmountUSD,
        totalAmountTSH,
        totalAmount,
        status: 'pending',
        orderDate: new Date().toISOString(),
        notes: notes || undefined
    };
    
    const orders = getOrders();
    orders.push(order);
    saveOrders(orders);

    // Send notification to admin
    sendNotification('admin', 'New Order Placed', `Order #${order.id} has been placed by ${currentUser.name} (${currentUser.shopName}) for ${formatPrice(totalAmountUSD, totalAmountTSH)}`);
    
    closeModal('newOrderModal');
    loadDashboardData();
}

function showOrderCakesModal() {
    document.getElementById('orderCakesModal').classList.add('show');
    loadCakesGrid();
    selectedCakes = {};
    updateOrderTotal();
}

function loadCakesGrid() {
    const cakes = getCakes();
    const container = document.getElementById('cakesGrid');
    const currency = getCurrentCurrency();
    
    container.innerHTML = cakes.map(cake => `
        <div class="cake-card">
            <img src="${cake.image}" alt="${cake.name}" class="cake-image">
            <h3 class="cake-name">${cake.name}</h3>
            <p class="cake-description">${cake.description}</p>
            <p class="cake-price">${formatPrice(cake.priceUSD, cake.priceTSH)}</p>
            <div class="quantity-control">
                <label>Quantity:</label>
                <input type="number" min="0" value="0" onchange="updateCakeQuantity('${cake.id}', this.value)">
            </div>
        </div>
    `).join('');
}

function updateCakeQuantity(cakeId, quantity) {
    const qty = parseInt(quantity) || 0;
    if (qty <= 0) {
        delete selectedCakes[cakeId];
    } else {
        selectedCakes[cakeId] = qty;
    }
    updateOrderTotal();
}

function updateOrderTotal() {
    const cakes = getCakes();
    const totalUSD = Object.entries(selectedCakes).reduce((sum, [cakeId, quantity]) => {
        const cake = cakes.find(c => c.id === cakeId);
        return sum + (cake ? cake.priceUSD * quantity : 0);
    }, 0);
    
    const totalTSH = Object.entries(selectedCakes).reduce((sum, [cakeId, quantity]) => {
        const cake = cakes.find(c => c.id === cakeId);
        return sum + (cake ? cake.priceTSH * quantity : 0);
    }, 0);
    
    const currency = getCurrentCurrency();
    const total = currency === 'TSH' ? totalTSH : totalUSD;
    
    document.getElementById('orderTotalCurrency').textContent = getCurrencySymbol();
    document.getElementById('orderTotal').textContent = currency === 'TSH' ? totalTSH.toLocaleString() : totalUSD.toFixed(2);
}

function submitCustomerOrder() {
    if (Object.keys(selectedCakes).length === 0) {
        alert('Please select at least one cake');
        return;
    }
    
    const cakes = getCakes();
    const items = Object.entries(selectedCakes).map(([cakeId, quantity]) => {
        const cake = cakes.find(c => c.id === cakeId);
        return {
            cakeId,
            cakeName: cake.name,
            quantity,
            priceUSD: cake.priceUSD,
            priceTSH: cake.priceTSH,
            price: getCakePrice(cake)
        };
    });
    
    const totalAmountUSD = items.reduce((sum, item) => sum + (item.priceUSD * item.quantity), 0);
    const totalAmountTSH = items.reduce((sum, item) => sum + (item.priceTSH * item.quantity), 0);
    const totalAmount = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    const order = {
        id: Date.now().toString(),
        customerId: currentUser.id,
        customerName: currentUser.name,
        items,
        totalAmountUSD,
        totalAmountTSH,
        totalAmount,
        status: 'pending',
        orderDate: new Date().toISOString()
    };
    
    const orders = getOrders();
    orders.push(order);
    saveOrders(orders);

    // Send notification to admin and shopkeepers
    sendNotification('admin', 'New Customer Order', `Customer ${currentUser.name} placed order #${order.id} for ${formatPrice(totalAmountUSD, totalAmountTSH)}`);
    
    // Send notification to customer
    sendNotification(currentUser.id, 'Order Placed Successfully', `Your order #${order.id} has been placed successfully for ${formatPrice(totalAmountUSD, totalAmountTSH)}. We'll notify you when it's processed.`);
    
    closeModal('orderCakesModal');
    loadDashboardData();
}

// User management functions
function showAddUserModal() {
    document.getElementById('addUserModal').classList.add('show');
    document.getElementById('addUserForm').reset();
    document.getElementById('addUserShopFields').style.display = 'none';
    document.getElementById('addUserError').classList.remove('show');
}

function handleAddUser(e) {
    e.preventDefault();
    
    const name = document.getElementById('addUserName').value;
    const email = document.getElementById('addUserEmail').value;
    const role = document.getElementById('addUserRole').value;
    const shopName = document.getElementById('addUserShopName').value;
    const password = document.getElementById('addUserPassword').value;
    
    const errorDiv = document.getElementById('addUserError');
    errorDiv.classList.remove('show');
    
    if (!name || !email || !password) {
        showError(errorDiv, 'Please fill in all required fields');
        return;
    }
    
    if (role === 'shopkeeper' && !shopName) {
        showError(errorDiv, 'Shop name is required for shopkeepers');
        return;
    }
    
    const users = getUsers();
    
    if (users.some(u => u.email === email)) {
        showError(errorDiv, 'Email already exists');
        return;
    }
    
    const newUser = {
        id: Date.now().toString(),
        name,
        email,
        password,
        role,
        shopName: role === 'shopkeeper' ? shopName : undefined,
        createdAt: new Date().toISOString()
    };
    
    users.push(newUser);
    saveUsers(users);
    
    closeModal('addUserModal');
    loadUsersTable();
    loadDashboardData();
}

function editUser(userId) {
    // For simplicity, we'll just show an alert
    // In a real application, you'd open an edit modal
    alert('Edit functionality would be implemented here');
}

function deleteUser(userId) {
    if (confirm('Are you sure you want to delete this user?')) {
        const users = getUsers();
        const updatedUsers = users.filter(user => user.id !== userId);
        saveUsers(updatedUsers);
        loadUsersTable();
        loadDashboardData();
    }
}

// Modal functions
function closeModal(modalId) {
    document.getElementById(modalId).classList.remove('show');
}

// Reports functions
function updateReports() {
    const period = document.getElementById('reportPeriod').value;
    const orders = getOrders();
    const currency = getCurrentCurrency();
    
    // Update report stats
    const completedOrders = orders.filter(o => o.status === 'completed');
    const totalRevenue = currency === 'TSH'
        ? completedOrders.reduce((sum, order) => sum + (order.totalAmountTSH || order.totalAmount * 2500), 0)
        : completedOrders.reduce((sum, order) => sum + (order.totalAmountUSD || order.totalAmount), 0);
    const avgOrderValue = completedOrders.length > 0 ? totalRevenue / completedOrders.length : 0;
    
    document.getElementById('reportTotalRevenue').textContent = currency === 'TSH'
        ? `TSh ${totalRevenue.toLocaleString()}`
        : `$${totalRevenue.toFixed(2)}`;
    document.getElementById('reportTotalOrders').textContent = orders.length;
    document.getElementById('reportAvgOrder').textContent = currency === 'TSH'
        ? `TSh ${avgOrderValue.toLocaleString()}`
        : `$${avgOrderValue.toFixed(2)}`;
    
    // Update status summary
    updateStatusSummary();
    
    // Update chart
    updateChart(period);
}

function updateStatusSummary() {
    const orders = getOrders();
    const statuses = ['pending', 'approved', 'in-progress', 'completed', 'cancelled'];
    const statusLabels = ['Pending', 'Approved', 'In Progress', 'Completed', 'Cancelled'];
    const statusColors = ['status-pending', 'status-approved', 'status-in-progress', 'status-completed', 'status-cancelled'];
    
    const container = document.getElementById('statusSummary');
    
    container.innerHTML = statuses.map((status, index) => {
        const count = orders.filter(o => o.status === status).length;
        const percentage = orders.length > 0 ? (count / orders.length) * 100 : 0;
        
        return `
            <div class="status-item">
                <span class="status-badge ${statusColors[index]}">${statusLabels[index]}</span>
                <div class="status-item-info">
                    <div class="status-count">${count}</div>
                    <div class="status-percentage">${percentage.toFixed(1)}%</div>
                </div>
            </div>
        `;
    }).join('');
}

function switchChart(type) {
    document.querySelectorAll('.chart-btn').forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');
    
    const period = document.getElementById('reportPeriod').value;
    updateChart(period, type);
}

function updateChart(period, chartType = 'bar') {
    const orders = getOrders();
    const { labels, revenueData, orderCountData } = getChartData(orders, period);
    
    const ctx = document.getElementById('reportsChart').getContext('2d');
    
    if (currentChart) {
        currentChart.destroy();
    }
    
    if (chartType === 'pie') {
        const statuses = ['pending', 'approved', 'in-progress', 'completed', 'cancelled'];
        const statusLabels = ['Pending', 'Approved', 'In Progress', 'Completed', 'Cancelled'];
        const statusData = statuses.map(status => orders.filter(o => o.status === status).length);
        
        currentChart = new Chart(ctx, {
            type: 'pie',
            data: {
                labels: statusLabels,
                datasets: [{
                    data: statusData,
                    backgroundColor: [
                        '#F59E0B',
                        '#8B5CF6',
                        '#3B82F6',
                        '#10B981',
                        '#EF4444'
                    ],
                    borderWidth: 2,
                    borderColor: '#ffffff'
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: { position: 'bottom' },
                    title: { display: true, text: 'Order Status Distribution' }
                }
            }
        });
    } else {
        const datasets = chartType === 'line' ? 
            [{
                label: 'Revenue ($)',
                data: revenueData,
                fill: false,
                borderColor: '#3B82F6',
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                tension: 0.1
            }] :
            [
                {
                    label: 'Revenue ($)',
                    data: revenueData,
                    backgroundColor: 'rgba(59, 130, 246, 0.8)',
                    borderColor: '#3B82F6',
                    borderWidth: 1
                },
                {
                    label: 'Orders Count',
                    data: orderCountData,
                    backgroundColor: 'rgba(16, 185, 129, 0.8)',
                    borderColor: '#10B981',
                    borderWidth: 1
                }
            ];
        
        currentChart = new Chart(ctx, {
            type: chartType,
            data: { labels, datasets },
            options: {
                responsive: true,
                plugins: {
                    legend: { position: 'top' },
                    title: { 
                        display: true, 
                        text: `Sales Report - ${period.charAt(0).toUpperCase() + period.slice(1)}` 
                    }
                },
                scales: {
                    y: { beginAtZero: true }
                }
            }
        });
    }
}

function getChartData(orders, period) {
    const now = new Date();
    const labels = [];
    const revenueData = [];
    const orderCountData = [];
    const currency = getCurrentCurrency();
    
    let periods = 12;
    if (period === 'daily') periods = 7;
    if (period === 'weekly') periods = 12;
    if (period === 'yearly') periods = 5;
    
    for (let i = periods - 1; i >= 0; i--) {
        let startDate, endDate, label;
        
        switch (period) {
            case 'daily':
                startDate = new Date(now);
                startDate.setDate(startDate.getDate() - i);
                startDate.setHours(0, 0, 0, 0);
                endDate = new Date(startDate);
                endDate.setHours(23, 59, 59, 999);
                label = startDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
                break;
            case 'weekly':
                startDate = new Date(now);
                startDate.setDate(startDate.getDate() - (i * 7));
                startDate.setDate(startDate.getDate() - startDate.getDay());
                startDate.setHours(0, 0, 0, 0);
                endDate = new Date(startDate);
                endDate.setDate(endDate.getDate() + 6);
                endDate.setHours(23, 59, 59, 999);
                label = `Week of ${startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
                break;
            case 'monthly':
                startDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
                endDate = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
                endDate.setHours(23, 59, 59, 999);
                label = startDate.toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
                break;
            case 'yearly':
                const year = now.getFullYear() - i;
                startDate = new Date(year, 0, 1);
                endDate = new Date(year, 11, 31, 23, 59, 59, 999);
                label = year.toString();
                break;
        }
        
        const periodOrders = orders.filter(order => {
            const orderDate = new Date(order.orderDate);
            return orderDate >= startDate && orderDate <= endDate && order.status === 'completed';
        });
        
        labels.push(label);
        const revenue = currency === 'TSH'
            ? periodOrders.reduce((sum, order) => sum + (order.totalAmountTSH || order.totalAmount * 2500), 0)
            : periodOrders.reduce((sum, order) => sum + (order.totalAmountUSD || order.totalAmount), 0);
        revenueData.push(revenue);
        orderCountData.push(periodOrders.length);
    }
    
    return { labels, revenueData, orderCountData };
}

// Notification System
function sendNotification(userId, title, message, type = 'info') {
    const notifications = getNotifications();
    const notification = {
        id: Date.now().toString(),
        userId: userId,
        title: title,
        message: message,
        type: type,
        read: false,
        timestamp: new Date().toISOString()
    };
    
    notifications.push(notification);
    saveNotifications(notifications);
    
    // Show toast notification if it's for current user
    if (currentUser && (userId === currentUser.id || userId === 'admin' && currentUser.role === 'admin')) {
        showToastNotification(title, message, type);
        updateNotificationBadge();
    }
}

function showToastNotification(title, message, type = 'info') {
    const container = document.getElementById('notificationContainer');
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    
    notification.innerHTML = `
        <div class="notification-header">
            <div class="notification-title">${title}</div>
            <button class="notification-close" onclick="this.parentElement.parentElement.remove()">&times;</button>
        </div>
        <div class="notification-message">${message}</div>
        <div class="notification-time">${new Date().toLocaleTimeString()}</div>
    `;
    
    container.appendChild(notification);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        if (notification.parentElement) {
            notification.remove();
        }
    }, 5000);
}

function loadNotifications() {
    if (!currentUser) return;
    
    updateNotificationBadge();
}

function updateNotificationBadge() {
    if (!currentUser) return;
    
    const notifications = getNotifications();
    const userNotifications = notifications.filter(n => 
        (n.userId === currentUser.id || (n.userId === 'admin' && currentUser.role === 'admin')) && !n.read
    );
    
    const badge = document.getElementById('notificationBadge');
    if (userNotifications.length > 0) {
        badge.textContent = userNotifications.length;
        badge.style.display = 'flex';
    } else {
        badge.style.display = 'none';
    }
}

function toggleNotifications() {
    // This would open a notification dropdown - simplified for this implementation
    const unreadCount = getNotifications().filter(n => 
        (n.userId === currentUser.id || (n.userId === 'admin' && currentUser.role === 'admin')) && !n.read
    ).length;
    
    if (unreadCount > 0) {
        showToastNotification('Notifications', `You have ${unreadCount} unread notifications`, 'info');
        
        // Mark notifications as read
        const notifications = getNotifications();
        notifications.forEach(n => {
            if (n.userId === currentUser.id || (n.userId === 'admin' && currentUser.role === 'admin')) {
                n.read = true;
            }
        });
        saveNotifications(notifications);
        updateNotificationBadge();
    } else {
        showToastNotification('Notifications', 'No new notifications', 'info');
    }
}

function closeNotificationDropdown() {
    notificationDropdownOpen = false;
}

// Currency Functions
function changeCurrency() {
    const currency = document.getElementById('currencySelector').value;
    saveCurrency(currency);
    
    // Reload all data with new currency
    if (currentUser) {
        loadDashboardData();
        if (document.getElementById('orderCakesModal').classList.contains('show')) {
            loadCakesGrid();
            updateOrderTotal();
        }
    }
}