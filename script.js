// WhatsApp Order Logic - Tamir Ali Marketplace
function addToCart(productId) {
    console.log("Order button clicked for ID:", productId); // जांच के लिए
    
    const product = state.products.find(p => p.id === productId);
    
    if (product) {
        const myNumber = "918797221991"; 
        const orderText = `*नया ऑर्डर - 786 तामीर अली स्टोर*\n\n` +
                          `📦 *सामान:* ${product.name}\n` +
                          `💰 *कीमत:* ₹${product.price}\n` +
                          `🔢 *स्टॉक:* ${product.stock}\n\n` +
                          `कृपया मेरी बुकिंग कन्फर्म करें।`;

        const encodedText = encodeURIComponent(orderText);
        const whatsappLink = `https://wa.me/${myNumber}?text=${encodedText}`;
        
        console.log("Opening WhatsApp...");
        window.open(whatsappLink, '_blank');
    } else {
        alert("माफ़ करें, इस सामान की जानकारी नहीं मिली!");
    }
}

// इसे अंत में ज़रूर लिखें ताकि बटन काम करे
window.addToCart = addToCart;
