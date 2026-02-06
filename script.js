// Tamir Ali Marketplace - Google Sheets Auto Sync

const CONFIG = {
    WHATSAPP_NUMBER: "918797221991",
    ADMIN_PASSWORD: "tamir@lI00769",
    // यहाँ अपना Sheety API URL डालें
    GOOGLE_SHEET_API: "https://api.sheety.co/YOUR_API_ID/YOUR_SHEET_NAME/products",
    CACHE_DURATION: 2 * 60 * 1000, // 2 minutes cache
    VERSION: "2.0.0"
};

// State Management
let state = {
    products: [],
    cart: JSON.parse(localStorage.getItem('tamirali_cart')) || [],
    adminLoggedIn: false,
    filters: {
        search: '',
        category: 'all',
        sort: 'name'
    },
    loading: true
};

// Google Sheets से Products Load करना
async function loadProductsFromGoogleSheet() {
    try {
        console.log('📡 Google Sheets से products लोड हो रहे हैं...');
        
        // Loading message show करें
        showLoadingMessage();
        
        // Sheety API से data fetch करें
        const response = await fetch(CONFIG.GOOGLE_SHEET_API);
        
        if (!response.ok) {
            throw new Error(`API Error: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('📊 Google Sheets Data:', data);
        
        // आपके Google Sheet के columns के अनुसार mapping
        // A: Name, B: Price, C: Description, D: Category, E: Image
        if (data.products) {
            state.products = data.products
                .filter(row => row.name && row.price) // Empty rows filter करें
                .map((row, index) => ({
                    id: row.id || index + 1,
                    name: row.name || 'Product',
                    price: parseFloat(row.price) || 0,
                    description: row.description || 'Good quality product',
                    stock: parseInt(row.stock) || (row.stockAvailable === 'TRUE' ? 10 : 0),
                    category: (row.category || 'other').toLowerCase(),
                    image: row.image || 'https://via.placeholder.com/300x200?text=Product+Image'
                }));
            
            console.log(`✅ ${state.products.length} products loaded from Google Sheets`);
            
            // Cache में save करें
            cacheProducts();
            
            // UI update करें
            renderProducts();
            updateStockList();
            updateProductCount();
            
            showToast(`✅ ${state.products.length} products loaded from Google Sheets`, 'success');
        } else {
            throw new Error('Invalid data format from Google Sheets');
        }
        
    } catch (error) {
        console.error('❌ Google Sheets Load Error:', error);
        
        // Fallback: Cache से load करें
        loadFromCache();
        
        showToast('⚠️ Using cached products. Check Google Sheets connection.', 'error');
    } finally {
        state.loading = false;
    }
}

// Cache से products load करना
function loadFromCache() {
    const cached = localStorage.getItem('tamirali_products_cache');
    const cacheTime = localStorage.getItem('tamirali_cache_time');
    
    if (cached && cacheTime) {
        const age = Date.now() - parseInt(cacheTime);
        if (age < CONFIG.CACHE_DURATION) {
            state.products = JSON.parse(cached);
            renderProducts();
            updateProductCount();
            return true;
        }
    }
    return false;
}

// Products को cache में save करना
function cacheProducts() {
    localStorage.setItem('tamirali_products_cache', JSON.stringify(state.products));
    localStorage.setItem('tamirali_cache_time', Date.now().toString());
    localStorage.setItem('tamirali_last_sync', new Date().toLocaleString('en-IN', {
        timeZone: 'Asia/Kolkata'
    }));
}

// Loading message show करना
function showLoadingMessage() {
    const productsGrid = document.getElementById('productsGrid');
    if (productsGrid) {
        productsGrid.innerHTML = `
            <div class="loading-products" style="grid-column: 1/-1; text-align: center; padding: 50px;">
                <div class="spinner" style="border: 4px solid #f3f3f3; border-top: 4px solid #3498db; border-radius: 50%; width: 50px; height: 50px; animation: spin 1s linear infinite; margin: 0 auto 20px;"></div>
                <p style="color: #666; font-size: 1.1rem;">
                    <i class="fas fa-sync-alt fa-spin"></i> 
                    Loading products from Google Sheets...
                </p>
                <p style="color: #999; font-size: 0.9rem; margin-top: 10px;">
                    Real-time inventory from your Google Sheet
                </p>
            </div>
        `;
    }
}

// Initialize Application
async function init() {
    console.log('🛒 Tamir Ali Marketplace v' + CONFIG.VERSION);
    console.log('📊 Google Sheets API:', CONFIG.GOOGLE_SHEET_API);
    
    // Setup event listeners
    setupEventListeners();
    
    // Check cache first
    if (!loadFromCache()) {
        // If no cache or expired, load from Google Sheets
        await loadProductsFromGoogleSheet();
    } else {
        renderProducts();
        updateProductCount();
    }
    
    // Auto-refresh every 5 minutes
    setInterval(loadProductsFromGoogleSheet, 5 * 60 * 1000);
    
    // Update cart UI
    updateCartUI();
    
    showToast('🛍️ Tamir Ali Marketplace Ready!', 'success');
}

// Render Products Function (Google Sheets compatible)
function renderProducts() {
    const container = document.getElementById('productsGrid');
    if (!container) return;
    
    const filteredProducts = filterAndSortProducts();
    
    if (filteredProducts.length === 0) {
        container.innerHTML = `
            <div class="no-products" style="grid-column: 1/-1; text-align: center; padding: 60px 20px;">
                <div style="font-size: 4rem; color: #ddd; margin-bottom: 20px;">
                    📦
                </div>
                <h3 style="color: #666; margin-bottom: 10px;">No Products Found</h3>
                <p style="color: #999;">Try changing your search or filters</p>
                <button onclick="loadProductsFromGoogleSheet()" style="margin-top: 20px; padding: 10px 20px; background: #3498db; color: white; border: none; border-radius: 5px; cursor: pointer;">
                    <i class="fas fa-sync-alt"></i> Reload from Google Sheets
                </button>
            </div>
        `;
        return;
    }
    
    container.innerHTML = filteredProducts.map(product => `
        <div class="product-card" data-id="${product.id}">
            <div class="product-image">
                <img src="${product.image}" 
                     alt="${product.name}"
                     onerror="this.onerror=null; this.src='https://via.placeholder.com/300x200/667eea/ffffff?text=${encodeURIComponent(product.name.substring(0,1))}';"
                     style="width: 100%; height: 200px; object-fit: cover;">
            </div>
            <div class="product-content">
                <h3 class="product-title">${product.name}</h3>
                <p class="product-description">${product.description}</p>
                <div class="product-meta">
                    <div class="product-price">₹${product.price}</div>
                    <div class="product-stock ${getStockClass(product.stock)}">
                        ${getStockText(product.stock)}
                    </div>
                </div>
                <div class="product-actions">
                    <div class="quantity-controls">
                        <button class="qty-btn minus" onclick="updateQuantity(${product.id}, -1)">
                            <i class="fas fa-minus"></i>
                        </button>
                        <span class="quantity" id="qty-${product.id}">${getCartQuantity(product.id)}</span>
                        <button class="qty-btn plus" onclick="updateQuantity(${product.id}, 1)">
                            <i class="fas fa-plus"></i>
                        </button>
                    </div>
                    <button class="btn-add-to-cart" onclick="addToCart(${product.id})" 
                            ${product.stock <= 0 ? 'disabled' : ''}>
                        <i class="fas fa-cart-plus"></i>
                        ${product.stock <= 0 ? 'Out of Stock' : 'Add to Cart'}
                    </button>
                </div>
            </div>
        </div>
    `).join('');
    
    updateFilterInfo(filteredProducts.length);
}

// Helper Functions
function getStockClass(stock) {
    if (stock > 10) return 'in-stock';
    if (stock > 0) return 'low-stock';
    return 'out-of-stock';
}

function getStockText(stock) {
    if (stock > 10) return 'In Stock';
    if (stock > 0) return `Only ${stock} left`;
    return 'Out of Stock';
}

// Real-time Google Sheets Update Functions
async function updateProductInGoogleSheet(productId, updates) {
    try {
        // Sheety API uses PATCH method for updates
        const response = await fetch(`${CONFIG.GOOGLE_SHEET_API}/${productId}`, {
            method: 'PUT', // or 'PATCH' based on Sheety API
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                product: updates
            })
        });
        
        if (response.ok) {
            console.log('✅ Product updated in Google Sheets');
            return true;
        }
        return false;
    } catch (error) {
        console.error('❌ Google Sheets Update Error:', error);
        return false;
    }
}

// Admin Panel - Stock Management for Google Sheets
function updateStockList() {
    const container = document.getElementById('stockList');
    if (!container) return;
    
    container.innerHTML = state.products.map(product => `
        <div class="stock-item" data-id="${product.id}">
            <div class="stock-item-info">
                <strong>${product.name}</strong><br>
                <small>₹${product.price} | ${product.category}</small>
            </div>
            <div class="stock-controls">
                <button class="stock-btn minus" onclick="updateStockInGoogleSheet(${product.id}, -1)">
                    <i class="fas fa-minus"></i>
                </button>
                <span class="stock-qty ${getStockClass(product.stock)}">${product.stock}</span>
                <button class="stock-btn plus" onclick="updateStockInGoogleSheet(${product.id}, 1)">
                    <i class="fas fa-plus"></i>
                </button>
                <button class="btn-delete" onclick="deleteFromGoogleSheet(${product.id})">
                    <i class="fas fa-trash"></i> Delete
                </button>
            </div>
        </div>
    `).join('');
}

// Update Stock in Google Sheets
async function updateStockInGoogleSheet(productId, change) {
    const product = state.products.find(p => p.id === productId);
    if (!product) return;
    
    const newStock = Math.max(0, product.stock + change);
    
    try {
        // Show loading
        showToast(`Updating stock for ${product.name}...`, 'info');
        
        // Update in Google Sheets
        const updated = await updateProductInGoogleSheet(productId, {
            stock: newStock
        });
        
        if (updated) {
            // Update local state
            product.stock = newStock;
            
            // Update UI
            updateStockList();
            renderProducts();
            
            // Update cache
            cacheProducts();
            
            showToast(`✅ Stock updated: ${product.name} = ${newStock}`, 'success');
        } else {
            showToast('⚠️ Could not update Google Sheets. Working offline.', 'warning');
        }
    } catch (error) {
        console.error('Stock update error:', error);
        showToast('❌ Error updating stock', 'error');
    }
}

// Delete from Google Sheets
async function deleteFromGoogleSheet(productId) {
    if (!confirm('Are you sure you want to delete this product from Google Sheets?')) {
        return;
    }
    
    try {
        // Sheety API delete
        const response = await fetch(`${CONFIG.GOOGLE_SHEET_API}/${productId}`, {
            method: 'DELETE'
        });
        
        if (response.ok) {
            // Remove from local state
            state.products = state.products.filter(p => p.id !== productId);
            
            // Update UI
            updateStockList();
            renderProducts();
            updateProductCount();
            
            // Update cache
            cacheProducts();
            
            showToast('✅ Product deleted from Google Sheets', 'success');
        }
    } catch (error) {
        console.error('Delete error:', error);
        showToast('❌ Error deleting product', 'error');
    }
}

// Add to Google Sheets
async function addToGoogleSheet(newProduct) {
    try {
        const response = await fetch(CONFIG.GOOGLE_SHEET_API, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                product: newProduct
            })
        });
        
        if (response.ok) {
            const data = await response.json();
            return data.product;
        }
        return null;
    } catch (error) {
        console.error('Add product error:', error);
        return null;
    }
}

// Auto Sync Status Display
function showSyncStatus() {
    const lastSync = localStorage.getItem('tamirali_last_sync');
    const syncStatus = document.getElementById('syncStatus') || createSyncStatusElement();
    
    if (lastSync) {
        syncStatus.innerHTML = `
            <i class="fas fa-sync-alt"></i>
            Last updated: ${lastSync}
            <button onclick="loadProductsFromGoogleSheet()" style="margin-left: 10px; padding: 5px 10px; background: #2ecc71; color: white; border: none; border-radius: 3px; cursor: pointer; font-size: 0.8rem;">
                <i class="fas fa-redo"></i> Sync Now
            </button>
        `;
    }
}

function createSyncStatusElement() {
    const statusDiv = document.createElement('div');
    statusDiv.id = 'syncStatus';
    statusDiv.style.cssText = `
        position: fixed;
        bottom: 20px;
        left: 20px;
        background: rgba(44, 62, 80, 0.9);
        color: white;
        padding: 10px 15px;
        border-radius: 5px;
        font-size: 0.8rem;
        z-index: 1000;
        backdrop-filter: blur(10px);
    `;
    
    document.body.appendChild(statusDiv);
    return statusDiv;
}

// Cart Functions (same as before, but optimized)
function addToCart(productId) {
    const product = state.products.find(p => p.id === productId);
    if (!product || product.stock <= 0) return;
    
    const cartItem = state.cart.find(item => item.id === productId);
    
    if (cartItem) {
        if (cartItem.quantity >= product.stock) {
            showToast(`Only ${product.stock} items in stock`, 'error');
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
    showToast(`Added ${product.name} to cart`, 'success');
}

function updateCartUI() {
    const cartCount = document.getElementById('cartCount');
    const cartItems = document.getElementById('cartItems');
    const cartTotal = document.getElementById('cartTotal');
    
    if (!cartCount || !cartItems || !cartTotal) return;
    
    const totalItems = state.cart.reduce((sum, item) => sum + item.quantity, 0);
    cartCount.textContent = totalItems;
    
    if (state.cart.length === 0) {
        cartItems.innerHTML = '<p class="empty-cart">Your cart is empty</p>';
        cartTotal.textContent = '₹0';
        return;
    }
    
    cartItems.innerHTML = state.cart.map(item => `
        <div class="cart-item">
            <div class="cart-item-image">
                <img src="${item.image}" alt="${item.name}" style="width: 60px; height: 60px; object-fit: cover; border-radius: 5px;">
            </div>
            <div class="cart-item-details">
                <div class="cart-item-title">${item.name}</div>
                <div class="cart-item-price">₹${item.price} × ${item.quantity}</div>
            </div>
            <div class="cart-item-qty">
                <button class="qty-btn minus" onclick="updateQuantity(${item.id}, -1)">-</button>
                <span>${item.quantity}</span>
                <button class="qty-btn plus" onclick="updateQuantity(${item.id}, 1)">+</button>
                <button onclick="removeFromCart(${item.id})" style="background: #e74c3c; color: white; border: none; width: 30px; height: 30px; border-radius: 50%; cursor: pointer;">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        </div>
    `).join('');
    
    const totalAmount = state.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    cartTotal.textContent = `₹${totalAmount}`;
}

function saveCart() {
    localStorage.setItem('tamirali_cart', JSON.stringify(state.cart));
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', init);

// Make functions available globally
window.updateQuantity = function(productId, change) {
    const cartItem = state.cart.find(item => item.id === productId);
    if (cartItem) {
        const newQuantity = cartItem.quantity + change;
        if (newQuantity < 1) {
            removeFromCart(productId);
        } else {
            cartItem.quantity = newQuantity;
            saveCart();
            updateCartUI();
            updateProductQuantityDisplay(productId);
        }
    }
};

window.removeFromCart = function(productId) {
    state.cart = state.cart.filter(item => item.id !== productId);
    saveCart();
    updateCartUI();
    updateProductQuantityDisplay(productId);
};

window.getCartQuantity = function(productId) {
    const item = state.cart.find(item => item.id === productId);
    return item ? item.quantity : 0;
};

window.updateProductQuantityDisplay = function(productId) {
    const element = document.getElementById(`qty-${productId}`);
    if (element) {
        element.textContent = getCartQuantity(productId);
    }
};

// Toast Notification Function
window.showToast = function(message, type = 'info') {
    const toast = document.getElementById('toast') || createToastElement();
    
    toast.textContent = message;
    toast.className = `toast ${type}`;
    toast.style.display = 'flex';
    
    setTimeout(() => {
        toast.style.display = 'none';
    }, 3000);
};

function createToastElement() {
    const toast = document.createElement('div');
    toast.id = 'toast';
    toast.style.cssText = `
        position: fixed;
        bottom: 30px;
        right: 30px;
        background: #2c3e50;
        color: white;
        padding: 15px 25px;
        border-radius: 10px;
        z-index: 10000;
        display: none;
        align-items: center;
        gap: 10px;
        box-shadow: 0 5px 15px rgba(0,0,0,0.2);
    `;
    document.body.appendChild(toast);
    return toast;
}
