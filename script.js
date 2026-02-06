const CONFIG = {
    WHATSAPP_NUMBER: "918797221991",
    ADMIN_PASSWORD: "tamir@lI00769",
    SHEETY_API_URL: "https://api.sheety.co/fe3c8e6fa84d7f88560b1976c0685f08/myShop/sheet1"
};

let state = { products: [], cart: [] };

async function init() {
    await loadProductsFromSheety();
    updateCartUI();
}

async function loadProductsFromSheety() {
    const statusDiv = document.getElementById('syncStatus');
    statusDiv.style.display = 'block';
    statusDiv.innerHTML = "🔄 Loading from Google Sheets...";

    try {
        const response = await fetch(CONFIG.SHEETY_API_URL);
        const data = await response.json();
        
        // Sheety 'sheet1' के नाम से डेटा भेजता है
        if (data.sheet1) {
            state.products = data.sheet1.map(row => ({
                id: row.id,
                name: row.name || 'No Name',
                price: row.price || 0,
                image: row.image || 'https://via.placeholder.com/150',
                stock: row.stock || 0
            }));
            renderProducts();
            statusDiv.innerHTML = "✅ Updated!";
            setTimeout(() => statusDiv.style.display = 'none', 3000);
        }
    } catch (error) {
        console.error("Error:", error);
        statusDiv.innerHTML = "❌ Connection Failed";
    }
}

function renderProducts() {
    const grid = document.getElementById('productsGrid');
    grid.innerHTML = state.products.map(p => `
        <div class="product-card">
            <div class="product-image"><img src="${p.image}"></div>
            <div class="product-content">
                <h3>${p.name}</h3>
                <p class="product-price">₹${p.price}</p>
                <p>Stock: ${p.stock}</p>
                <button onclick="addToCart(${p.id})" style="background:#2ecc71; color:white; border:none; padding:10px; border-radius:5px; cursor:pointer;">Order Now</button>
            </div>
        </div>
    `).join('');
}

document.addEventListener('DOMContentLoaded', init);
