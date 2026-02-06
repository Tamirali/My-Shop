const CONFIG = {
    WHATSAPP_NUMBER: "918797221991",
    // यह लिंक आपकी शीट से जुड़ा है
    SHEETY_API_URL: "https://api.sheety.co/fe3c8e6fa84d7f88560b1976c0685f08/myShop/sheet1"
};

let state = { products: [] };

async function loadProducts() {
    try {
        const response = await fetch(CONFIG.SHEETY_API_URL);
        const data = await response.json();
        
        // Sheety डेटा को 'sheet1' के अंदर भेजता है
        if (data && data.sheet1) {
            state.products = data.sheet1;
            renderProducts();
        }
    } catch (error) {
        console.error("Data load nahi hua:", error);
    }
}

function renderProducts() {
    const grid = document.getElementById('productsGrid');
    if (!grid) return;

    grid.innerHTML = state.products.map(p => `
        <div class="product-card" style="border:1px solid #ddd; padding:15px; border-radius:10px; margin:10px; text-align:center; background:white; box-shadow: 0 2px 5px rgba(0,0,0,0.1);">
            <img src="${p.image || 'https://via.placeholder.com/150'}" style="width:100%; max-height:200px; object-fit:contain; border-radius:8px;">
            <h3 style="margin:10px 0;">${p.name || 'No Name'}</h3>
            <p style="color:#2ecc71; font-weight:bold; font-size:1.2rem; margin:5px 0;">₹${p.price || '0'}</p>
            <p style="color:#666;">स्टॉक में उपलब्ध: ${p.stock || '0'}</p>
            <button onclick="sendWhatsAppOrder('${p.name}', '${p.price}')" style="background:#2ecc71; color:white; border:none; padding:10px 20px; border-radius:5px; cursor:pointer; font-weight:bold; width:100%; margin-top:10px;">Order Now</button>
        </div>
    `).join('');
}

function sendWhatsAppOrder(name, price) {
    const text = `नमस्ते तामीर अली जी, मुझे यह सामान खरीदना है:\n📦 *सामान:* ${name}\n💰 *कीमत:* ₹${price}\n\nकृपया बुकिंग कन्फर्म करें।`;
    const url = `https://wa.me/${CONFIG.WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
}

// फंक्शन को ग्लोबल बनाना ताकि बटन काम करे
window.sendWhatsAppOrder = sendWhatsAppOrder;

// पेज लोड होते ही डेटा लाओ
document.addEventListener('DOMContentLoaded', loadProducts);
