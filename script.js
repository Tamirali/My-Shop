// Tamir Ali Marketplace - Final Logic
const CONFIG = {
    WHATSAPP_NUMBER: "918797221991",
    ADMIN_PASSWORD: "tamir@lI00769"
};

let state = { products: [], cart: [] };

// 1. Admin Login Function
function checkAdminLogin() {
    const enteredPass = document.getElementById('adminPass').value;
    if (enteredPass === CONFIG.ADMIN_PASSWORD) {
        alert("स्वागत है तामीर अली जी!");
        document.getElementById('adminPanelBody').style.display = 'block';
    } else {
        alert("गलत पासवर्ड! अक्ल का इस्तेमाल करें।");
    }
}

// 2. Load Products with Image Fix
function renderProducts() {
    const grid = document.getElementById('productsGrid');
    if (state.products.length === 0) {
        grid.innerHTML = "<p>कोई सामान नहीं मिला। कृपया Google Sheet जोड़ें।</p>";
        return;
    }
    grid.innerHTML = state.products.map(p => `
        <div class="product-card">
            <div class="product-image">
                <img src="${p.image}" onerror="this.src='https://via.placeholder.com/150?text=No+Image'" style="width:100%; height:200px; object-fit:cover;">
            </div>
            <div class="product-content">
                <h3>${p.name}</h3>
                <p>₹${p.price}</p>
                <button class="btn-add-to-cart" onclick="addToCart(${p.id})">अभी खरीदें</button>
            </div>
        </div>
    `).join('');
}

// 3. Delete Product Function
function deleteProduct(id) {
    if(confirm("तामीर अली जी, क्या आप इस प्रोडक्ट को सच में हटाना चाहते हैं?")) {
        state.products = state.products.filter(p => p.id !== id);
        updateStockList();
        renderProducts();
        alert("प्रोडक्ट सफलतापूर्वक हटा दिया गया है।");
    }
}

// 4. Update Admin Stock List
function updateStockList() {
    const list = document.getElementById('stockList');
    list.innerHTML = state.products.map(p => `
        <div class="stock-item">
            <div class="stock-item-info">
                <strong>${p.name}</strong><br>
                <small>₹${p.price}</small>
            </div>
            <div class="stock-controls">
                <button class="stock-btn minus" onclick="adminUpdateStock(${p.id}, -1)">-</button>
                <span class="stock-qty">${p.stock}</span>
                <button class="stock-btn" onclick="adminUpdateStock(${p.id}, 1)">+</button>
                <button class="btn-delete" onclick="deleteProduct(${p.id})">Delete</button>
            </div>
        </div>
    `).join('');
}

// बाकी फंक्शन (Cart, Sync आदि) यहाँ जोड़ें...
