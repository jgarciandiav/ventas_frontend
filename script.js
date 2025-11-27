// Carrito
let cart = [];

function loadCart() {
    const saved = localStorage.getItem('cart');
    cart = saved ? JSON.parse(saved) : [];
}

function saveCart() {
    localStorage.setItem('cart', JSON.stringify(cart));
}

function addToCart(product) {
    if (product.stock <= 0) return alert('❌ Producto agotado');
    cart.push({
        id: product.id,
        name: product.nombre,
        price: `S/ ${product.precio_unitario.toFixed(2)}`,
        image: product.imagen || 'images/default.jpg',
        precio_unitario: product.precio_unitario
    });
    saveCart();
    updateCartDisplay();
    alert(`✅ ${product.nombre} agregado`);
}

function removeFromCart(index) {
    cart.splice(index, 1);
    saveCart();
    updateCartDisplay();
}

function toggleCart() {
    document.getElementById('cartModal').classList.toggle('active');
    updateCartDisplay();
}

function updateCartDisplay() {
    const count = document.getElementById('cartCount');
    const items = document.getElementById('cartItems');
    const total = document.getElementById('totalAmount');

    count.textContent = cart.length;

    if (cart.length === 0) {
        items.innerHTML = `
            <div class="empty-cart">
                <p>Tu carrito está vacío</p>
                <p class="empty-cart-subtitle">Agrega productos para comenzar tu compra</p>
            </div>`;
        total.textContent = 'S/ 0.00';
        return;
    }

    items.innerHTML = cart.map((item, i) => `
        <div class="cart-item">
            <img src="${item.image}" alt="${item.name}" class="cart-item-image" onerror="this.src='images/default.jpg'">
            <div class="cart-item-info">
                <div class="cart-item-name">${item.name}</div>
                <div class="cart-item-price">${item.price}</div>
            </div>
            <button class="remove-btn" onclick="removeFromCart(${i})">🗑️</button>
        </div>
    `).join('');

    const suma = cart.reduce((s, item) => s + item.precio_unitario, 0);
    total.textContent = `S/ ${suma.toFixed(2)}`;
}

async function checkout() {
    if (cart.length === 0) return alert('🛒 Carrito vacío');
    const token = localStorage.getItem('auth_token');
    if (!token) return alert('❌ Sesión expirada');

    try {
        const ventas = cart.map(item => ({
            producto_id: item.id,
            cantidad: 1
        }));
        const res = await fetch('http://127.0.0.1:8000/api/ventas/', {
            method: 'POST',
            headers: {
                'Authorization': `Token ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ ventas })
        });
        if (!res.ok) throw new Error(await res.text());
        alert('🎉 ¡Compra registrada!');
        cart = [];
        saveCart();
        updateCartDisplay();
        toggleCart();
    } catch (err) {
        alert(`❌ Error: ${err.message}`);
    }
}

// Cerrar carrito
document.addEventListener('click', e => {
    if (e.target.id === 'cartModal') toggleCart();
});

// Submenús
function toggleSubmenu(id) {
    const el = document.getElementById(id);
    if (el) el.classList.toggle('active');
}

// Cargar productos desde API
let allProducts = [];
async function loadProductsFromAPI() {
    const token = localStorage.getItem('auth_token');
    if (!token) return;
    try {
        const res = await fetch('http://127.0.0.1:8000/api/almacen/', {
            headers: { 'Authorization': `Token ${token}` }
        });
        if (!res.ok) throw new Error(await res.text());
        allProducts = await res.json();
        filterProducts('');
    } catch (err) {
        console.error('Error productos:', err);
        document.getElementById('productsGrid').innerHTML = `<div class="global-error show">❌ ${err.message}</div>`;
    }
}

function filterProducts(category) {
    const grid = document.getElementById('productsGrid');
    const title = document.getElementById('categoryTitle');
    const dropdown = document.getElementById('categoryDropdown');
    
    const names = { electrodomesticos: 'Electrodomésticos', 'articulos-hogar': 'Artículos del Hogar', dulces: 'Dulces', confituras: 'Confituras', regalos: 'Regalos', juguetes: 'Juguetes' };
    if (category) dropdown.value = category;
    title.textContent = names[category] || 'Todos los Productos';

    const filtered = category 
        ? allProducts.filter(p => p.tipo === category) 
        : allProducts;

    grid.innerHTML = filtered.map(p => `
        <div class="product-card">
            <img src="${p.imagen || 'images/default.jpg'}" alt="${p.nombre}" class="product-image" onerror="this.src='images/default.jpg'">
            <div class="product-info">
                <div class="product-name">${p.nombre}</div>
                <div class="product-price">S/ ${p.precio_unitario.toFixed(2)}</div>
                <div class="product-stock ${p.stock < 5 ? 'low' : ''}">Stock: ${p.stock}</div>
                ${p.stock > 0 
                    ? `<button class="buy-btn" onclick="addToCart(${JSON.stringify(p).replace(/"/g, '&quot;')})">🛒 Comprar</button>`
                    : `<button class="buy-btn disabled" disabled>Agotado</button>`
                }
            </div>
        </div>
    `).join('');
}

// Inicializar
document.addEventListener('DOMContentLoaded', loadCart);