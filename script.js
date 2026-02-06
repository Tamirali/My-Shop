const CONFIG = {
    WHATSAPP_NUMBER: "918797221991",
    SHEETY_API_URL: "https://api.sheety.co/fe3c8e6fa84d7f88560b1976c0685f08/myShop/sheet1"
};

let state = { products: [] };

async function init() {
    await loadProducts();
}

async function loadProducts() {
    try {
        const response = await fetch(CONFIG.SHEETY_API_URL);
        const data = await response.json();
        
        if (data.sheet1) {
            state.products = data.sheet1;
            renderProducts();
        }
    } catch (error) {
        console.error("Error loading products:", error);
    }
}

function renderProducts() {
    const grid = document.getElementById('productsGrid');
    if (!grid) return;

    grid.innerHTML = state.products.map(p => `
        <div class="product-card" style="border:1px solid #ddd; padding:15px; border-radius:10px; margin:10px; text-align:center; background:white;">
            <img src="${p.image || 'https://via.placeholder.com/150'}" style="width:100%; border-radius:8px;">
            <h3>${p.name}</h3>
            <p style="color:#2ecc71; font-weight:bold; font-size:1.2rem;">₹${p.price}</p>
            <p>Stock: ${p.stock}</p>
            <button onclick="sendOrder('${p.name}', '${p.price}')" style="background:#2ecc71; color:white; border:none; padding:10px 20px; border-radius:5px; cursor:pointer; font-weight:bold;">Order Now</button>
        </div>
    `).join('');
}

function sendOrder(name, price) {
    const message = `नमस्ते तामीर अली जी, मुझे यह खरीदना है:\n📦 सामान: ${name}\n💰 कीमत: ₹${price}`;
    const whatsappUrl = `https://wa.me/${CONFIG.WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
}

// Window object से जोड़ना ताकि बटन काम करे
window.sendOrder = sendOrder;

document.addEventListener('DOMContentLoaded', init);
