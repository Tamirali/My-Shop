// Tamir Ali Marketplace - Fixed Sheety API Integration
// तामीर अली मार्केटप्लेस - शीटी एपीआई इंटीग्रेशन

const CONFIG = {
    WHATSAPP_NUMBER: "918797221991",
    ADMIN_PASSWORD: "tamir@lI00769",
    // ✅ सही Sheety API URL
    SHEETY_API_URL: "https://api.sheety.co/fe3c8e6fa84d7f88560b1976c0685f08/myShop/sheet1",
    CACHE_DURATION: 2 * 60 * 1000, // 2 minutes cache
    VERSION: "3.1.0"
};

// State Management
let state = {
    products: [],
    cart: JSON.parse(localStorage.getItem('tamirali_cart')) || [],
    isOnline: true,
    sheetConnected: false,
    loading: true
};

// ✅ Sheety API से Data Fetch करना (FIXED)
async function loadProductsFromGoogleSheet() {
    try {
        console.log('📡 Sheety API से डेटा लोड हो रहा है...');
        console.log('🔗 API URL:', CONFIG.SHEETY_API_URL);
        
        // Loading message show करें
        showLoadingMessage();
        
        // Sheety API से data fetch करें
        const response = await fetch(CONFIG.SHEETY_API_URL, {
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            mode: 'cors'
        });
        
        if (!response.ok) {
            throw new Error(`API Error: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log('📊 Sheety API Response:', data);
        
        // ✅ FIX: data.sheet1 check करें (data.products नहीं)
        if (data.sheet1 && Array.isArray(data.sheet1)) {
            state.products = data.sheet1
                .filter(row => row.name || row.Name) // Empty rows filter करें
                .map((row, index) => {
                    // Sheety डेटा मैपिंग
                    return {
                        id: row.id || index + 1,
                        rowId: row.id, // Sheety row ID (DELETE के लिए जरूरी)
                        name: row.name || row.Name || 'Product',
                        price: parseFloat(row.price || row.Price || 0),
                        description: row.description || row.Description || 'Good quality product',
                        stock: parseInt(row.stock || row.Stock || row.quantity || 10) || 10,
                        category: (row.category || row.Category || 'clothing').toLowerCase(),
                        image: row.image || row.Image || getDefaultImage(row.category || row.Category),
                        createdAt: row.createdAt || new Date().toISOString()
                    };
                });
            
            console.log(`✅ ${state.products.length} products loaded from Google Sheets`);
            
            state.sheetConnected = true;
            state.loading = false;
            
            // Cache में save करें
            cacheProducts();
            
            // UI update करें
            renderProducts();
            updateProductCount();
            
            showToast(`✅ ${state.products.length} products loaded successfully!`, 'success');
            
        } else {
            console.warn('⚠️ No sheet1 data found:', data);
            throw new Error('Invalid data format from Sheety API');
        }
        
    } catch (error) {
        console.error('❌ Sheety API Load Error:', error);
        state.sheetConnected = false;
        state.loading = false;
        
        // Fallback: Cache से load करें
        if (loadFromCache()) {
            showToast('⚠️ Using cached products. Check Google Sheets connection.', 'warning');
        } else {
            showToast('❌ No products available. Check API connection.', 'error');
            // Show demo products
            state.products = getDemoProducts();
            renderProducts();
        }
    }
}

// ✅ Default image function
function getDefaultImage(category) {
    const categories = {
        'clothing': 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80',
        'electronics': 'https://images.unsplash.com/photo-1498049794561-7780e7231661?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80',
        'home': 'https://images.unsplash.com/photo-1556228453-efd6c1ff04f6?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80',
        'other': 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80'
    };
    
    return categories[category?.toLowerCase()] || categories['other'];
}

// ✅ Cache Functions
function cacheProducts() {
    localStorage.setItem('tamirali_products_cache', JSON.stringify(state.products));
    localStorage.setItem('tamirali_cache_time', Date.now().toString());
    localStorage.setItem('tamirali_last_sync', new Date().toLocaleString('en-IN', {
        timeZone: 'Asia/Kolkata'
    }));
}

function loadFromCache() {
    const cacheKey = 'tamirali_products_cache';
    const cacheTime = localStorage.getItem('tamirali_cache_time');
    
    const cachedData = localStorage.getItem(cacheKey);
    if (cachedData && cacheTime) {
        const age = Date.now() - parseInt(cacheTime);
        if (age < CONFIG.CACHE_DURATION) {
            state.products = JSON.parse(cachedData);
            renderProducts();
            updateProductCount();
            return true;
        }
    }
    return false;
}

// ✅ Demo Products (Fallback)
function getDemoProducts() {
    return [
        {
            id: 1,
            name: "Coat Pant",
            description: "Good quality clothing",
            price: 999,
            stock: 10,
            category: "clothing",
            image: "https://i.postimg.cc/fR6PZNJ5/hero-banner-2.webp"
        },
        {
            id: 2,
            name: "Wireless Headphones",
            description: "Premium sound quality",
            price: 2499,
            stock: 5,
            category: "electronics",
            image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80"
        }
    ];
}

// ✅ Loading Message
function showLoadingMessage() {
    const container = document.getElementById('productsGrid');
    if (container) {
        container.innerHTML = `
            <div style="grid-column: 1/-1; text-align: center; padding: 60px 20px;">
                <div class="spinner" style="border: 5px solid #f3f3f3; border-top: 5px solid #3498db; border-radius: 50%; width: 60px; height: 60px; animation: spin 1s linear infinite; margin: 0 auto 20px;"></div>
                <h3 style="color: #2c3e50; margin-bottom: 10px;">Loading Products...</h3>
                <p style="color: #7f8c8d;">Fetching data from Google Sheets via Sheety API</p>
                <p style="color: #95a5a6; font-size: 0.9rem; margin-top: 20px;">
                    <i class="fas fa-sync-alt fa-spin"></i> Connecting to: ${CONFIG.SHEETY_API_URL}
                </p>
            </div>
        `;
    }
}

// ✅ Render Products Function
function renderProducts() {
    const container = document.getElementById('productsGrid');
    if (!container) {
        console.error('❌ productsGrid element not found!');
        return;
    }
    
    if (state.products.length === 0) {
        container.innerHTML = `
            <div style="grid-column: 1/-1; text-align: center; padding: 60px 20px;">
                <div style="font-size: 4rem; color: #ddd; margin-bottom: 20px;">📦</div>
                <h3 style="color: #666; margin-bottom: 10px;">No Products Available</h3>
                <p style="color: #999; margin-bottom: 20px;">Add products to your Google Sheet</p>
                <button onclick="loadProductsFromGoogleSheet()" style="padding: 12px 24px; background: #3498db; color: white; border: none; border-radius: 8px; cursor: pointer; font-size: 1rem;">
                    <i class="fas fa-sync-alt"></i> Reload Products
                </button>
            </div>
        `;
        return;
    }
    
    container.innerHTML = state.products.map(product => {
        const inCart = getCartQuantity(product.id);
        const isOutOfStock = product.stock <= 0;
        
        return `
        <div class="product-card" data-id="${product.id}">
            <div class="product-image">
                <img src="${product.image}" 
                     alt="${product.name}"
                     onerror="this.onerror=null; this.src='${getDefaultImage(product.category)}';"
                     loading="lazy">
                ${isOutOfStock ? '<div class="out-of-stock-badge">Out of Stock</div>' : ''}
            </div>
            <div class="product-content">
                <div class="product-header">
                    <h3 class="product-title">${product.name}</h3>
                    <span class="product-category">${product.category}</span>
                </div>
                <p class="product-description">${product.description}</p>
                
                <div class="product-footer">
                    <div class="price-section">
                        <div class="product-price">₹${product.price}</div>
                        <div class="product-stock ${getStockClass(product.stock)}">
                            ${getStockText(product.stock)}
                        </div>
                    </div>
                    
                    <div class="product-actions">
                        ${!isOutOfStock ? `
                        <div class="quantity-controls">
                            <button class="qty-btn minus" onclick="updateQuantity(${product.id}, -1)" ${inCart === 0 ? 'disabled' : ''}>
                                <i class="fas fa-minus"></i>
                            </button>
                            <span class="quantity" id="qty-${product.id}">${inCart}</span>
                            <button class="qty-btn plus" onclick="updateQuantity(${product.id}, 1)" ${inCart >= product.stock ? 'disabled' : ''}>
                                <i class="fas fa-plus"></i>
                            </button>
                        </div>
                        <button class="btn-add-to-cart" onclick="addToCart(${product.id})" ${inCart >= product.stock ? 'disabled' : ''}>
                            <i class="fas fa-cart-plus"></i> Add to Cart
                        </button>
                        ` : `
                        <button class="btn-out-of-stock" disabled>
                            <i class="fas fa-ban"></i> Out of Stock
                        </button>
                        `}
                    </div>
                </div>
            </div>
        </div>
        `;
    }).join('');
    
    updateFilterInfo(state.products.length);
}

// ✅ Stock Helper Functions
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

// ✅ Cart Management
function addToCart(productId) {
    const product = state.products.find(p => p.id === productId);
    if (!product || product.stock <= 0) return;
    
    const cartItem = state.cart.find(item => item.id === productId);
    
    if (cartItem) {
        if (cartItem.quantity >= product.stock) {
            showToast(`Only ${product.stock} items available in stock`, 'error');
            return;
        }
        cartItem.quantity++;
    } else {
        state.cart.push({
            id: product.id,
            name: product.name,
            price: product.price,
            image: product.image,
            quantity: 1
        });
    }
    
    saveCart();
    updateCartUI();
    updateProductQuantityDisplay(productId);
    showToast(`✅ ${product.name} added to cart`, 'success');
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
    if (state.cart.length === 0) return;
    
    if (confirm('Are you sure you want to clear your cart?')) {
        state.cart = [];
        saveCart();
        updateCartUI();
        state.products.forEach(product => {
            updateProductQuantityDisplay(product.id);
        });
        showToast('Cart cleared', 'info');
    }
}

function getCartQuantity(productId) {
    const item = state.cart.find(item => item.id === productId);
    return item ? item.quantity : 0;
}

function saveCart() {
    localStorage.setItem('tamirali_cart', JSON.stringify(state.cart));
}

function updateProductQuantityDisplay(productId) {
    const qtyElement = document.getElementById(`qty-${productId}`);
    if (qtyElement) {
        qtyElement.textContent = getCartQuantity(productId);
    }
}

// ✅ Cart UI Update
function updateCartUI() {
    const cartCount = document.getElementById('cartCount');
    const cartItems = document.getElementById('cartItems');
    const cartTotal = document.getElementById('cartTotal');
    
    if (cartCount) {
        const totalItems = state.cart.reduce((sum, item) => sum + item.quantity, 0);
        cartCount.textContent = totalItems;
        cartCount.style.display = totalItems > 0 ? 'flex' : 'none';
    }
    
    if (cartItems) {
        if (state.cart.length === 0) {
            cartItems.innerHTML = '<p class="empty-cart">Your cart is empty</p>';
            if (cartTotal) cartTotal.textContent = '₹0';
            return;
        }
        
        cartItems.innerHTML = state.cart.map(item => {
            const product = state.products.find(p => p.id === item.id);
            const maxStock = product ? product.stock : 10;
            
            return `
            <div class="cart-item">
                <div class="cart-item-image">
                    <img src="${item.image}" alt="${item.name}" 
                         onerror="this.src='${getDefaultImage(product?.category)}'">
                </div>
                <div class="cart-item-details">
                    <div class="cart-item-title">${item.name}</div>
                    <div class="cart-item-price">₹${item.price} × ${item.quantity}</div>
                </div>
                <div class="cart-item-qty">
                    <button class="qty-btn minus" onclick="updateQuantity(${item.id}, -1)" ${item.quantity <= 1 ? 'disabled' : ''}>-</button>
                    <span>${item.quantity}</span>
                    <button class="qty-btn plus" onclick="updateQuantity(${item.id}, 1)" ${item.quantity >= maxStock ? 'disabled' : ''}>+</button>
                    <button class="cart-item-remove" onclick="removeFromCart(${item.id})">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
            `;
        }).join('');
        
        if (cartTotal) {
            const totalAmount = state.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
            cartTotal.textContent = `₹${totalAmount}`;
        }
    }
}

// ✅ Checkout Function
function checkout() {
    if (state.cart.length === 0) {
        showToast('Your cart is empty', 'error');
        return;
    }
    
    // Generate WhatsApp message
    let message = `🛒 *New Order - Tamir Ali Marketplace* 🛒\n\n`;
    message += `*Date:* ${new Date().toLocaleString('en-IN')}\n\n`;
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
    
    // Clear cart after order (optional)
    setTimeout(() => {
        state.cart = [];
        saveCart();
        updateCartUI();
        closeCart();
    }, 2000);
}

// ✅ Admin Functions - Sheety Integration
async function updateProductInSheety(productId, updates) {
    try {
        const product = state.products.find(p => p.id === productId);
        if (!product || !product.rowId) {
            console.error('Product or rowId not found');
            return false;
        }
        
        const response = await fetch(`${CONFIG.SHEETY_API_URL}/${product.rowId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer your_bearer_token_if_any'
            },
            body: JSON.stringify({
                sheet1: updates
            })
        });
        
        if (response.ok) {
            console.log('✅ Product updated in Google Sheets');
            return true;
        } else {
            const errorText = await response.text();
            console.error('❌ Update failed:', errorText);
            return false;
        }
    } catch (error) {
        console.error('❌ Sheety Update Error:', error);
        return false;
    }
}

async function deleteProductFromSheety(productId) {
    try {
        const product = state.products.find(p => p.id === productId);
        if (!product || !product.rowId) {
            console.error('Product or rowId not found');
            return false;
        }
        
        const response = await fetch(`${CONFIG.SHEETY_API_URL}/${product.rowId}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        return response.ok;
    } catch (error) {
        console.error('Delete error:', error);
        return false;
    }
}

// ✅ Toast Notification
function showToast(message, type = 'info') {
    // Remove existing toast
    const existingToast = document.getElementById('tamirali-toast');
    if (existingToast) {
        existingToast.remove();
    }
    
    // Create new toast
    const toast = document.createElement('div');
    toast.id = 'tamirali-toast';
    toast.className = `toast ${type}`;
    
    let icon = 'ℹ️';
    if (type === 'success') icon = '✅';
    if (type === 'error') icon = '❌';
    if (type === 'warning') icon = '⚠️';
    
    toast.innerHTML = `
        <div class="toast-content">
            <span class="toast-icon">${icon}</span>
            <span class="toast-message">${message}</span>
        </div>
    `;
    
    document.body.appendChild(toast);
    
    // Show toast
    setTimeout(() => {
        toast.classList.add('show');
    }, 10);
    
    // Hide after 3 seconds
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => {
            if (toast.parentNode) {
                toast.remove();
            }
        }, 300);
    }, 3000);
}

// ✅ Initialize Application
function init() {
    console.log('🚀 Tamir Ali Marketplace v' + CONFIG.VERSION + ' Initializing...');
    console.log('🔗 Sheety API:', CONFIG.SHEETY_API_URL);
    
    // Check for elements
    if (!document.getElementById('productsGrid')) {
        console.error('❌ Critical: productsGrid element not found!');
        showToast('Website configuration error. Please check HTML structure.', 'error');
        return;
    }
    
    // Setup event listeners
    setupEventListeners();
    
    // Load products
    loadProductsFromGoogleSheet();
    
    // Update cart UI
    updateCartUI();
    
    // Show welcome message
    setTimeout(() => {
        if (state.loading) {
            showToast('Loading products from Google Sheets...', 'info');
        }
    }, 1000);
}

// ✅ Event Listeners Setup
function setupEventListeners() {
    // Cart events
    const cartIcon = document.getElementById('cartIcon');
    const closeCart = document.getElementById('closeCart');
    const checkoutBtn = document.getElementById('checkoutBtn');
    const clearCartBtn = document.getElementById('clearCart');
    
    if (cartIcon) {
        cartIcon.addEventListener('click', openCart);
    }
    
    if (closeCart) {
        closeCart.addEventListener('click', closeCartSidebar);
    }
    
    if (checkoutBtn) {
        checkoutBtn.addEventListener('click', checkout);
    }
    
    if (clearCartBtn) {
        clearCartBtn.addEventListener('click', clearCart);
    }
    
    // Search functionality
    const searchBox = document.getElementById('searchBox');
    if (searchBox) {
        searchBox.addEventListener('input', (e) => {
            const searchTerm = e.target.value.toLowerCase();
            const container = document.getElementById('productsGrid');
            
            if (searchTerm === '') {
                renderProducts();
                return;
            }
            
            const filtered = state.products.filter(product => 
                product.name.toLowerCase().includes(searchTerm) ||
                product.description.toLowerCase().includes(searchTerm) ||
                product.category.toLowerCase().includes(searchTerm)
            );
            
            if (container && filtered.length === 0) {
                container.innerHTML = `
                    <div style="grid-column: 1/-1; text-align: center; padding: 40px 20px;">
                        <i class="fas fa-search" style="font-size: 3rem; color: #ddd; margin-bottom: 20px;"></i>
                        <h3 style="color: #666;">No products found</h3>
                        <p style="color: #999;">Try a different search term</p>
                    </div>
                `;
            } else if (container) {
                // Temporarily show filtered products
                container.innerHTML = filtered.map(product => {
                    const inCart = getCartQuantity(product.id);
                    return `
                    <div class="product-card">
                        <div class="product-image">
                            <img src="${product.image}" alt="${product.name}">
                        </div>
                        <div class="product-content">
                            <h3>${product.name}</h3>
                            <p>${product.description}</p>
                            <div class="price-section">
                                <span class="price">₹${product.price}</span>
                                <span class="stock ${getStockClass(product.stock)}">
                                    ${getStockText(product.stock)}
                                </span>
                            </div>
                            <button onclick="addToCart(${product.id})" class="add-to-cart-btn" ${product.stock <= 0 ? 'disabled' : ''}>
                                ${product.stock <= 0 ? 'Out of Stock' : 'Add to Cart'}
                            </button>
                        </div>
                    </div>
                    `;
                }).join('');
            }
        });
    }
    
    // Close cart when clicking outside
    document.addEventListener('click', (e) => {
        const cartSidebar = document.getElementById('cartSidebar');
        const cartIcon = document.getElementById('cartIcon');
        
        if (cartSidebar && cartSidebar.classList.contains('active') &&
            !cartSidebar.contains(e.target) &&
            !cartIcon.contains(e.target)) {
            closeCartSidebar();
        }
    });
    
    // Admin access (5 clicks on logo)
    let adminClickCount = 0;
    let lastAdminClick = 0;
    const logo = document.querySelector('.logo h1');
    
    if (logo) {
        logo.addEventListener('click', () => {
            const now = Date.now();
            if (now - lastAdminClick > 2000) {
                adminClickCount = 0;
            }
            
            adminClickCount++;
            lastAdminClick = now;
            
            if (adminClickCount >= 5) {
                showAdminPanel();
                adminClickCount = 0;
            }
        });
    }
}

// ✅ Cart Sidebar Functions
function openCart() {
    const cartSidebar = document.getElementById('cartSidebar');
    if (cartSidebar) {
        cartSidebar.classList.add('active');
    }
}

function closeCartSidebar() {
    const cartSidebar = document.getElementById('cartSidebar');
    if (cartSidebar) {
        cartSidebar.classList.remove('active');
    }
}

// ✅ Admin Panel Functions
function showAdminPanel() {
    const password = prompt('Enter Admin Password:');
    if (password === CONFIG.ADMIN_PASSWORD) {
        alert('Admin Access Granted!\n\nNote: For full admin features (add/edit/delete products), you need to:\n1. Enable PUT and DELETE methods in Sheety dashboard\n2. Add authentication if required\n\nCurrent API: ' + CONFIG.SHEETY_API_URL);
        
        // Show admin interface
        const adminHTML = `
            <div id="adminModal" style="position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.8); z-index:9999; display:flex; align-items:center; justify-content:center;">
                <div style="background:white; padding:30px; border-radius:15px; max-width:500px; width:90%; max-height:80vh; overflow-y:auto;">
                    <h2 style="color:#2c3e50; margin-bottom:20px; display:flex; align-items:center; gap:10px;">
                        <i class="fas fa-lock"></i> Admin Panel
                    </h2>
                    
                    <div style="margin-bottom:20px;">
                        <h4><i class="fas fa-link"></i> API Status</h4>
                        <p style="word-break:break-all; background:#f8f9fa; padding:10px; border-radius:5px; font-family:monospace; font-size:0.9rem;">
                            ${CONFIG.SHEETY_API_URL}
                        </p>
                        <p>Status: <span style="color:${state.sheetConnected ? '#27ae60' : '#e74c3c'}">${state.sheetConnected ? 'Connected' : 'Disconnected'}</span></p>
                    </div>
                    
                    <div style="margin-bottom:20px;">
                        <h4><i class="fas fa-cog"></i> Actions</h4>
                        <button onclick="loadProductsFromGoogleSheet()" style="width:100%; padding:12px; background:#3498db; color:white; border:none; border-radius:8px; margin-bottom:10px; cursor:pointer;">
                            <i class="fas fa-sync-alt"></i> Refresh Products
                        </button>
                        <button onclick="clearLocalStorage()" style="width:100%; padding:12px; background:#e74c3c; color:white; border:none; border-radius:8px; cursor:pointer;">
                            <i class="fas fa-trash"></i> Clear Cache
                        </button>
                    </div>
                    
                    <div style="margin-bottom:20px;">
                        <h4><i class="fas fa-info-circle"></i> Instructions</h4>
                        <ol style="padding-left:20px; color:#666; font-size:0.9rem;">
                            <li>Enable PUT/DELETE in Sheety dashboard</li>
                            <li>Google Sheet columns: Name, Price, Description, Category, Image, Stock</li>
                            <li>Save changes in Sheet → Refresh website</li>
                        </ol>
                    </div>
                    
                    <button onclick="document.getElementById('adminModal').remove()" style="width:100%; padding:12px; background:#95a5a6; color:white; border:none; border-radius:8px; cursor:pointer;">
                        <i class="fas fa-times"></i> Close Admin Panel
                    </button>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', adminHTML);
    } else if (password !== null) {
        alert('Incorrect password!');
    }
}

function clearLocalStorage() {
    if (confirm('Clear all cached data?')) {
        localStorage.removeItem('tamirali_cart');
        localStorage.removeItem('tamirali_products_cache');
        localStorage.removeItem('tamirali_cache_time');
        localStorage.removeItem('tamirali_last_sync');
        
        state.cart = [];
        state.products = [];
        
        updateCartUI();
        renderProducts();
        
        showToast('Cache cleared successfully', 'success');
        
        // Reload products
        setTimeout(() => loadProductsFromGoogleSheet(), 1000);
    }
}

// ✅ Update Product Count
function updateProductCount() {
    const countElement = document.getElementById('productCount');
    if (countElement) {
        countElement.textContent = state.products.length;
    }
}

// ✅ Update Filter Info
function updateFilterInfo(count) {
    const filterInfo = document.getElementById('filterInfo');
    if (filterInfo) {
        filterInfo.textContent = `Showing ${count} products`;
    }
}

// ✅ Auto-refresh products every 5 minutes
setInterval(() => {
    if (state.sheetConnected && !state.loading) {
        console.log('🔄 Auto-refreshing products...');
        loadProductsFromGoogleSheet();
    }
}, 5 * 60 * 1000);

// ✅ Initialize when DOM is loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

// ✅ Make functions globally available
window.updateQuantity = updateQuantity;
window.addToCart = addToCart;
window.removeFromCart = removeFromCart;
window.openCart = openCart;
window.closeCartSidebar = closeCartSidebar;
window.checkout = checkout;
window.clearCart = clearCart;
window.loadProductsFromGoogleSheet = loadProductsFromGoogleSheet;
window.showAdminPanel = showAdminPanel;
