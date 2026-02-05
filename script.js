// Configuration Constants
const CONFIG = {
    WHATSAPP_NUMBER: "918797221991",
    ADMIN_PASSWORD: "tamir@lI00769",
    GOOGLE_SHEET_API: "YOUR_GOOGLE_SHEET_API_URL_HERE", // Replace with your actual API URL
    CACHE_DURATION: 5 * 60 * 1000, // 5 minutes in milliseconds
    VERSION: "1.0.0"
};

// State Management
let state = {
    products: [],
    cart: JSON.parse(localStorage.getItem('tamirali_cart')) || [],
    adminLoggedIn: false,
    lastSync: localStorage.getItem('tamirali_last_sync') || null,
    filters: {
        search: '',
        category: 'all',
        sort: 'name'
    }
};

// DOM Elements
const elements = {
    productsGrid: document.getElementById('productsGrid'),
    cartCount: document.getElementById('cartCount'),
    cartItems: document.getElementById('cartItems'),
    cartTotal: document.getElementById('cartTotal'),
    cartSidebar: document.getElementById('cartSidebar'),
    cartIcon: document.getElementById('cartIcon'),
    closeCart: document.getElementById('closeCart'),
    checkoutBtn: document.getElementById('checkoutBtn'),
    clearCart: document.getElementById('clearCart'),
    searchBox: document.getElementById('searchBox'),
    categoryFilter: document.getElementById('categoryFilter'),
    sortFilter: document.getElementById('sortFilter'),
    filterInfo: document.getElementById('filterInfo'),
    productCount: document.getElementById('productCount'),
    adminPanel: document.getElementById('adminPanel'),
    closeAdmin: document.getElementById('closeAdmin'),
    whatsappContact: document.getElementById('whatsappContact'),
    apiUrl: document.getElementById('apiUrl'),
    testConnection: document.getElementById('testConnection'),
    whatsappNumber: document.getElementById('whatsappNumber'),
    adminPass: document.getElementById('adminPass'),
    updatePassword: document.getElementById('updatePassword'),
    syncProducts: document.getElementById('syncProducts'),
    exportData: document.getElementById('exportData'),
    clearCache: document.getElementById('clearCache'),
    stockList: document.getElementById('stockList'),
    toast: document.getElementById('toast')
};

// Initialize Application
function init() {
    console.log('🛒 Tamir Ali Marketplace v' + CONFIG.VERSION + ' Initializing...');
    
    // Load products from cache or fetch from API
    loadProducts();
    
    // Setup event listeners
    setupEventListeners();
    
    // Update UI
    updateCartUI();
    updateProductCount();
    
    // Setup admin access point
    setupAdminAccess();
    
    // Show welcome message
    showToast('Tamir Ali Marketplace loaded successfully!', 'success');
}

// Load Products from Google Sheets
async function loadProducts() {
    try {
        // Show loading state
        elements.productsGrid.innerHTML = `
            <div class="loading-products">
                <div class="spinner"></div>
                <p>Loading products from Google Sheet...</p>
            </div>
        `;
        
        // Check if cache is valid
        const cacheKey = 'tamirali_products_cache';
        const cachedData = localStorage.getItem(cacheKey);
        const cacheTime = localStorage.getItem('tamirali_cache_time');
        
        if (cachedData && cacheTime && (Date.now() - parseInt(cacheTime)) < CONFIG.CACHE_DURATION) {
            console.log('📦 Loading products from cache');
            state.products = JSON.parse(cachedData);
            renderProducts();
            return;
        }
        
        // Fetch from Google Sheets API
        console.log('🌐 Fetching products from Google Sheets API');
        
        // Sample data - Replace with actual API call
        // In production, you would fetch from CONFIG.GOOGLE_SHEET_API
        const sampleProducts = [
            {
                id: 1,
                name: "Wireless Bluetooth Headphones",
                description: "High-quality wireless headphones with noise cancellation",
                price: 2499,
                stock: 15,
                category: "electronics",
                image: "🎧"
            },
            {
                id: 2,
                name: "Cotton T-Shirt (Pack of 3)",
                description: "Premium quality cotton t-shirts in various colors",
                price: 899,
                stock: 25,
                category: "clothing",
                image: "👕"
            },
            {
                id: 3,
                name: "Stainless Steel Water Bottle",
                description: "1L insulated stainless steel water bottle",
                price: 499,
                stock: 8,
                category: "home",
                image: "💧"
            },
            {
                id: 4,
                name: "Smartphone Stand",
                description: "Adjustable smartphone stand for desk",
                price: 299,
                stock: 0,
                category: "electronics",
                image: "📱"
            },
            {
                id: 5,
                name: "Ceramic Coffee Mug Set",
                description: "Set of 4 ceramic coffee mugs",
                price: 649,
                stock: 12,
                category: "home",
                image: "☕"
            },
            {
                id: 6,
                name: "Yoga Mat",
                description: "Non-slip premium yoga mat",
                price: 1299,
                stock: 5,
                category: "other",
                image: "🧘"
            }
        ];
        
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        state.products = sampleProducts;
        
        // Cache the products
        localStorage.setItem(cacheKey, JSON.stringify(sampleProducts));
        localStorage.setItem('tamirali_cache_time', Date.now().toString());
        localStorage.setItem('tamirali_last_sync', new Date().toLocaleString());
        
        renderProducts();
        showToast('Products loaded successfully!', 'success');
        
    } catch (error) {
        console.error('Error loading products:', error);
        showToast('Error loading products. Using demo data.', 'error');
        
        // Fallback to demo data
        state.products = getDemoProducts();
        renderProducts();
    }
}

// Render Products to Grid
function renderProducts() {
    const filteredProducts = filterAndSortProducts();
    
    if (filteredProducts.length === 0) {
        elements.productsGrid.innerHTML = `
            <div class="loading-products">
                <i class="fas fa-search" style="font-size: 3rem; color: #95a5a6; margin-bottom: 20px;"></i>
                <p>No products found matching your criteria</p>
            </div>
        `;
        return;
    }
    
    elements.productsGrid.innerHTML = filteredProducts.map(product => `
        <div class="product-card" data-id="${product.id}">
            <div class="product-image">
                ${product.image || '📦'}
            </div>
            <div class="product-content">
                <h3 class="product-title">${product.name}</h3>
                <p class="product-description">${product.description}</p>
                <div class="product-meta">
                    <div class="product-price">₹${product.price}</div>
                    <div class="product-stock ${getStockClass(product.stock)}">
                        ${product.stock > 10 ? 'In Stock' : product.stock > 0 ? 'Low Stock' : 'Out of Stock'}
                    </div>
                </div>
                <div class="product-actions">
                    <div class="quantity-controls">
                        <button class="qty-btn minus" onclick="updateQuantity(${product.id}, -1)">-</button>
                        <span class="quantity" id="qty-${product.id}">${getCartQuantity(product.id)}</span>
                        <button class="qty-btn plus" onclick="updateQuantity(${product.id}, 1)">+</button>
                    </div>
                    <button class="btn-add-to-cart" onclick="addToCart(${product.id})" 
                            ${product.stock === 0 ? 'disabled' : ''}>
                        <i class="fas fa-cart-plus"></i>
                        ${product.stock === 0 ? 'Out of Stock' : 'Add to Cart'}
                    </button>
                </div>
            </div>
        </div>
    `).join('');
    
    updateFilterInfo(filteredProducts.length);
}

// Filter and Sort Products
function filterAndSortProducts() {
    let filtered = [...state.products];
    
    // Apply search filter
    if (state.filters.search) {
        const searchTerm = state.filters.search.toLowerCase();
        filtered = filtered.filter(product => 
            product.name.toLowerCase().includes(searchTerm) ||
            product.description.toLowerCase().includes(searchTerm)
        );
    }
    
    // Apply category filter
    if (state.filters.category !== 'all') {
        filtered = filtered.filter(product => 
            product.category === state.filters.category
        );
    }
    
    // Apply sorting
    switch(state.filters.sort) {
        case 'price-low':
            filtered.sort((a, b) => a.price - b.price);
            break;
        case 'price-high':
            filtered.sort((a, b) => b.price - a.price);
            break;
        case 'stock':
            filtered.sort((a, b) => b.stock - a.stock);
            break;
        default: // 'name'
            filtered.sort((a, b) => a.name.localeCompare(b.name));
    }
    
    return filtered;
}

// Cart Management Functions
function addToCart(productId) {
    const product = state.products.find(p => p.id === productId);
    if (!product || product.stock === 0) return;
    
    const cartItem = state.cart.find(item => item.id === productId);
    
    if (cartItem) {
        if (cartItem.quantity >= product.stock) {
            showToast(`Only ${product.stock} items available in stock`, 'error');
            return;
        }
        cartItem.quantity++;
    } else {
        state.cart.push({
            ...product,
            quantity: 1
        });
    }
    
    saveCart();
    updateCartUI();
    updateProductQuantityDisplay(productId);
    showToast(`${product.name} added to cart`, 'success');
}

function updateQuantity(productId, change) {
    const cartItem = state.cart.find(item => item.id === productId);
    const product = state.products.find(p => p.id === productId);
    
    if (!cartItem && change > 0) {
        addToCart(productId);
        return;
    }
    
    if (cartItem) {
        const newQuantity = cartItem.quantity + change;
        
        if (newQuantity < 1) {
            removeFromCart(productId);
            return;
        }
        
        if (newQuantity > product.stock) {
            showToast(`Only ${product.stock} items available in stock`, 'error');
            return;
        }
        
        cartItem.quantity = newQuantity;
        saveCart();
        updateCartUI();
        updateProductQuantityDisplay(productId);
    }
}

function removeFromCart(productId) {
    state.cart = state.cart.filter(item => item.id !== productId);
    saveCart();
    updateCartUI();
    updateProductQuantityDisplay(productId);
    showToast('Item removed from cart', 'info');
}

function clearCart() {
    state.cart = [];
    saveCart();
    updateCartUI();
    state.products.forEach(product => {
        updateProductQuantityDisplay(product.id);
    });
    showToast('Cart cleared', 'info');
}

function getCartQuantity(productId) {
    const item = state.cart.find(item => item.id === productId);
    return item ? item.quantity : 0;
}

function saveCart() {
    localStorage.setItem('tamirali_cart', JSON.stringify(state.cart));
}

// Update UI Functions
function updateCartUI() {
    // Update cart count
    const totalItems = state.cart.reduce((sum, item) => sum + item.quantity, 0);
    elements.cartCount.textContent = totalItems;
    
    // Update cart items list
    if (state.cart.length === 0) {
        elements.cartItems.innerHTML = '<p class="empty-cart">Your cart is empty</p>';
        elements.cartTotal.textContent = '₹0';
        return;
    }
    
    elements.cartItems.innerHTML = state.cart.map(item => `
        <div class="cart-item">
            <div class="cart-item-image">
                ${item.image || '📦'}
            </div>
            <div class="cart-item-details">
                <div class="cart-item-title">${item.name}</div>
                <div class="cart-item-price">₹${item.price} × ${item.quantity}</div>
            </div>
            <div class="cart-item-qty">
                <button class="qty-btn minus" onclick="updateQuantity(${item.id}, -1)">-</button>
                <span class="quantity">${item.quantity}</span>
                <button class="qty-btn plus" onclick="updateQuantity(${item.id}, 1)">+</button>
                <button class="cart-item-remove" onclick="removeFromCart(${item.id})">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        </div>
    `).join('');
    
    // Update cart total
    const totalAmount = state.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    elements.cartTotal.textContent = `₹${totalAmount}`;
}

function updateProductQuantityDisplay(productId) {
    const qtyElement = document.getElementById(`qty-${productId}`);
    if (qtyElement) {
        qtyElement.textContent = getCartQuantity(productId);
    }
}

function updateProductCount() {
    elements.productCount.textContent = state.products.length;
}

function updateFilterInfo(count) {
    const total = state.products.length;
    elements.filterInfo.textContent = `Showing ${count} of ${total} products`;
}

// Admin Functions
function setupAdminAccess() {
    let clickCount = 0;
    let lastClickTime = 0;
    
    // Add click listener to logo for admin access
    document.querySelector('.logo h1').addEventListener('click', (e) => {
        const currentTime = Date.now();
        
        // Reset count if more than 2 seconds have passed
        if (currentTime - lastClickTime > 2000) {
            clickCount = 0;
        }
        
        clickCount++;
        lastClickTime = currentTime;
        
        // Show hint after 3 clicks
        if (clickCount === 3) {
            document.querySelector('.admin-hint').style.opacity = '1';
            setTimeout(() => {
                document.querySelector('.admin-hint').style.opacity = '0';
            }, 2000);
        }
        
        // Show admin panel after 5 clicks
        if (clickCount === 5) {
            showAdminPanel();
            clickCount = 0;
        }
    });
}

function showAdminPanel() {
    // Fill admin panel with current data
    elements.apiUrl.value = CONFIG.GOOGLE_SHEET_API || '';
    elements.whatsappNumber.value = CONFIG.WHATSAPP_NUMBER;
    elements.adminPass.value = CONFIG.ADMIN_PASSWORD;
    
    // Load stock management list
    updateStockList();
    
    // Show admin panel
    elements.adminPanel.style.display = 'flex';
    document.body.style.overflow = 'hidden';
}

function closeAdminPanel() {
    elements.adminPanel.style.display = 'none';
    document.body.style.overflow = 'auto';
}

function updateStockList() {
    elements.stockList.innerHTML = state.products.map(product => `
        <div class="stock-item">
            <div>
                <strong>${product.name}</strong><br>
                <small>Stock: ${product.stock} | ₹${product.price}</small>
            </div>
            <div class="stock-controls">
                <button class="qty-btn minus" onclick="adminUpdateStock(${product.id}, -1)">-</button>
                <span class="stock-qty">${product.stock}</span>
                <button class="qty-btn plus" onclick="adminUpdateStock(${product.id}, 1)">+</button>
            </div>
        </div>
    `).join('');
}

function adminUpdateStock(productId, change) {
    const product = state.products.find(p => p.id === productId);
    if (product) {
        product.stock = Math.max(0, product.stock + change);
        updateStockList();
        
        // In a real application, you would update Google Sheets here
        showToast(`Stock updated for ${product.name}: ${product.stock}`, 'info');
    }
}

// Checkout Function
function checkout() {
    if (state.cart.length === 0) {
        showToast('Your cart is empty', 'error');
        return;
    }
    
    // Generate WhatsApp message
    let message = `🛒 *New Order from Tamir Ali Marketplace* 🛒\n\n`;
    message += `*Customer Details:*\n`;
    message += `Date: ${new Date().toLocaleString()}\n\n`;
    message += `*Order Items:*\n`;
    
    let totalAmount = 0;
    state.cart.forEach((item, index) => {
        const itemTotal = item.price * item.quantity;
        totalAmount += itemTotal;
        message += `${index + 1}. ${item.name} - ${item.quantity} × ₹${item.price} = ₹${itemTotal}\n`;
    });
    
    message += `\n*Total Amount: ₹${totalAmount}*\n\n`;
    message += `Please confirm this order.`;
    
    // Encode message for WhatsApp URL
    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${CONFIG.WHATSAPP_NUMBER}?text=${encodedMessage}`;
    
    // Open WhatsApp
    window.open(whatsappUrl, '_blank');
    
    // Show confirmation
    showToast('Opening WhatsApp to confirm order...', 'success');
    
    // Clear cart after order
    setTimeout(() => {
        clearCart();
        closeCart();
    }, 2000);
}

// Helper Functions
function getStockClass(stock) {
    if (stock > 10) return 'in-stock';
    if (stock > 0) return 'low-stock';
    return 'out-of-stock';
}

function getDemoProducts() {
    return [
        {
            id: 1,
            name: "Demo Product 1",
            description: "This is a demo product for testing",
            price: 999,
            stock: 10,
            category: "electronics",
            image: "📱"
        },
        {
            id: 2,
            name: "Demo Product 2",
            description: "Another demo product for testing",
            price: 499,
            stock: 5,
            category: "home",
            image: "🏠"
        }
    ];
}

function showToast(message, type = 'info') {
    elements.toast.textContent = message;
    elements.toast.className = `toast ${type}`;
    elements.toast.style.display = 'flex';
    
    // Add icon based on type
    let icon = 'ℹ️';
    if (type === 'success') icon = '✅';
    if (type === 'error') icon = '❌';
    elements.toast.innerHTML = `${icon} ${message}`;
    
    setTimeout(() => {
        elements.toast.style.display = 'none';
    }, 3000);
}

// Cart Sidebar Functions
function openCart() {
    elements.cartSidebar.classList.add('active');
}

function closeCart() {
    elements.cartSidebar.classList.remove('active');
}

// Setup Event Listeners
function setupEventListeners() {
    // Cart events
    elements.cartIcon.addEventListener('click', openCart);
    elements.closeCart.addEventListener('click', closeCart);
    elements.checkoutBtn.addEventListener('click', checkout);
    elements.clearCart.addEventListener('click', clearCart);
    
    // Filter events
    elements.searchBox.addEventListener('input', (e) => {
        state.filters.search = e.target.value;
        renderProducts();
    });
    
    elements.categoryFilter.addEventListener('change', (e) => {
        state.filters.category = e.target.value;
        renderProducts();
    });
    
    elements.sortFilter.addEventListener('change', (e) => {
        state.filters.sort = e.target.value;
        renderProducts();
    });
    
    // Admin events
    elements.closeAdmin.addEventListener('click', closeAdminPanel);
    elements.testConnection.addEventListener('click', () => {
        showToast('Testing Google Sheets connection...', 'info');
        // In production, implement actual API test
        setTimeout(() => showToast('Connection successful!', 'success'), 1000);
    });
    
    elements.updatePassword.addEventListener('click', () => {
        CONFIG.ADMIN_PASSWORD = elements.adminPass.value;
        showToast('Admin password updated', 'success');
    });
    
    elements.syncProducts.addEventListener('click', () => {
        showToast('Syncing products from Google Sheet...', 'info');
        loadProducts();
    });
    
    elements.exportData.addEventListener('click', () => {
        const dataStr = JSON.stringify({
            products: state.products,
            cart: state.cart,
            lastSync: state.lastSync
        }, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
        
        const exportFileDefaultName = `tamirali-data-${new Date().toISOString().split('T')[0]}.json`;
        
        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileDefaultName);
        linkElement.click();
        
        showToast('Data exported successfully', 'success');
    });
    
    elements.clearCache.addEventListener('click', () => {
        localStorage.removeItem('tamirali_products_cache');
        localStorage.removeItem('tamirali_cache_time');
        showToast('Cache cleared successfully', 'success');
        loadProducts();
    });
    
    elements.whatsappContact.addEventListener('click', () => {
        const message = encodeURIComponent("Hello! I'm interested in products from Tamir Ali Marketplace.");
        window.open(`https://wa.me/${CONFIG.WHATSAPP_NUMBER}?text=${message}`, '_blank');
    });
    
    // Close cart when clicking outside
    document.addEventListener('click', (e) => {
        if (!elements.cartSidebar.contains(e.target) && 
            !elements.cartIcon.contains(e.target) &&
            elements.cartSidebar.classList.contains('active')) {
            closeCart();
        }
    });
    
    // Close admin panel on escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeAdminPanel();
            closeCart();
        }
    });
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', init);

// Make functions available globally
window.updateQuantity = updateQuantity;
window.addToCart = addToCart;
window.removeFromCart = removeFromCart;
window.adminUpdateStock = adminUpdateStock;
