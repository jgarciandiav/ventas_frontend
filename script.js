// script.js
// ✅ Carrito y productos globales
let cart = [];
let allProducts = [];

// ✅ Cargar carrito al iniciar
function loadCart() {
    const saved = localStorage.getItem('cart');
    cart = saved ? JSON.parse(saved) : [];
}

// ✅ Guardar carrito
function saveCart() {
    localStorage.setItem('cart', JSON.stringify(cart));
}

// ✅ Añadir al carrito (ahora con campos correctos de TU MODELO)
function addToCart(product) {
    if (product.stock <= 0) {
        alert('❌ Producto agotado');
        return;
    }

    let quantity = prompt(
        `¿Cuántas unidades de "${product.nombreproducto}" deseas comprar?\nStock disponible: ${product.stock}`,
        '1'
    );
    if (quantity === null || quantity.trim() === '') return;

    quantity = parseInt(quantity);
    if (isNaN(quantity) || quantity <= 0) {
        alert('❌ Cantidad debe ser un número entero mayor a 0');
        return;
    }
    if (quantity > product.stock) {
        alert(`❌ Stock insuficiente. Solo quedan ${product.stock} unidades.`);
        return;
    }

    // ✅ Usar "precio" (tu modelo) en lugar de "precio_unitario"
    const precio = parseFloat(product.precio) || 0;
    const existingItem = cart.find(item => item.id === product.id);
    
    if (existingItem) {
        existingItem.cantidad += quantity;
        existingItem.subtotal = existingItem.precio * existingItem.cantidad; // ✅ "precio"
        alert(`✅ Se han añadido ${quantity} unidades más.`);
    } else {
        cart.push({
            id: product.id,
            name: product.nombreproducto,
            price: `S/ ${precio.toFixed(2)}`,
            image: product.imagen || 'images/default.jpg',
            precio: precio,  // ✅ SOLO "precio", no "precio_unitario"
            cantidad: quantity,
            subtotal: precio * quantity
        });
        alert(`✅ ${quantity} unidades agregadas.`);
    }

    // ✅ Restar stock visualmente
    product.stock -= quantity;
    saveCart();
    updateCartDisplay();
    filterProducts(document.getElementById('categoryDropdown').value);
}
// ✅ Eliminar del carrito
function removeFromCart(index) {
    const item = cart[index];
    const product = allProducts.find(p => p.id === item.id);
    
    if (product) {
        product.stock += item.cantidad; // ✅ Restaurar stock
        filterProducts(document.getElementById('categoryDropdown').value);
    }
    
    cart.splice(index, 1);
    saveCart();
    updateCartDisplay();
    alert(`🗑️ ${item.name} eliminado.`);
}
// ✅ Mostrar/ocultar carrito
function toggleCart() {
    const modal = document.getElementById('cartModal');
    if (modal) {
        modal.classList.toggle('active');
        updateCartDisplay();
    }
}

// ✅ Actualizar visualización del carrito
function updateCartDisplay() {
    const countEl = document.getElementById('cartCount');
    const itemsEl = document.getElementById('cartItems');
    const totalEl = document.getElementById('totalAmount');

    if (countEl) countEl.textContent = cart.reduce((sum, item) => sum + item.cantidad, 0);
    if (!itemsEl || !totalEl) return;

    if (cart.length === 0) {
        itemsEl.innerHTML = `<div class="empty-cart"><p>Tu carrito está vacío</p></div>`;
        totalEl.textContent = 'S/ 0.00';
        return;
    }

    // ✅ Usa "precio" (no "precio_unitario") y manejo seguro
    const itemsHtml = cart.map((item, i) => {
        const precio = item.precio || 0; // ✅ Seguridad
        const cantidad = item.cantidad || 1;
        const subtotal = precio * cantidad;
        
        return `
        <div class="cart-item">
            <img src="${item.image.startsWith('http') ? item.image : 'http://127.0.0.1:8000' + item.image}" 
                 alt="${item.name}" class="cart-item-image"
                 onerror="this.src='images/default.jpg'">
            <div class="cart-item-info">
                <div class="cart-item-name">${item.name}</div>
                <div class="cart-item-price">S/ ${precio.toFixed(2)} × ${cantidad}</div>
                <div class="cart-item-subtotal">Subtotal: S/ ${subtotal.toFixed(2)}</div>
            </div>
            <button class="remove-btn" onclick="removeFromCart(${i})">🗑️</button>
        </div>
        `;
    }).join('');

    const total = cart.reduce((sum, item) => sum + (item.precio || 0) * (item.cantidad || 1), 0);
    itemsEl.innerHTML = itemsHtml;
    totalEl.textContent = `S/ ${total.toFixed(2)}`;
}
// ✅ Proceder al pago (frontend-only por ahora)
function checkout() {
    if (cart.length === 0) {
        alert('🛒 Tu carrito está vacío');
        return;
    }

    const token = localStorage.getItem('auth_token');
    if (!token) {
        alert('❌ Sesión expirada. Por favor, inicia sesión de nuevo.');
        window.location.href = 'login.html';
        return;
    }

    // ✅ Preparar datos para el backend
    const ventas = cart.map(item => ({
        producto_id: item.id,
        cantidad: 1,  // Simplificado para este ejemplo
        precio_unitario: item.precio_unitario
    }));

    fetch('http://127.0.0.1:8000/api/ventas/', {
        method: 'POST',
        headers: {
            'Authorization': `Token ${token}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ ventas })
    })
    .then(r => r.json())
    .then(data => {
        if (r.ok) {
            alert('🎉 ¡Venta registrada exitosamente!');
            cart = [];
            saveCart();
            updateCartDisplay();
            toggleCart();
        } else {
            throw new Error(data.error || 'Error al registrar venta');
        }
    })
    .catch(err => {
        alert(`❌ Error: ${err.message}. La compra se procesó en el frontend pero no se guardó en el backend.`);
        console.error(err);
    });
}

// ✅ Cerrar carrito al hacer clic fuera
document.addEventListener('click', (e) => {
    const modal = document.getElementById('cartModal');
    if (modal && e.target === modal) toggleCart();
});

// ✅ Toggle submenu (sin cambios)
function toggleSubmenu(id) {
    const el = document.getElementById(id);
    if (el) el.classList.toggle('active');
}

// ✅ Cargar productos desde backend (con URL correcta para imágenes)
async function loadProductsFromAPI() {
    const token = localStorage.getItem('auth_token');
    if (!token) return;

    try {
        const res = await fetch('http://127.0.0.1:8000/api/almacen/', {
            headers: { 'Authorization': `Token ${token}` }
        });
        
        if (!res.ok) {
            throw new Error(await res.text());
        }
        
        allProducts = await res.json();
        console.log('✅ Productos cargados:', allProducts);
        
        // ✅ Si estamos en dashboard, mostrar productos
        if (typeof filterProducts === 'function') {
            filterProducts('');
        }
        
    } catch (err) {
        console.error('❌ Error al cargar productos:', err);
        alert(`❌ ${err.message}`);
        
        // ✅ Fallback: mostrar mensaje en la UI
        const grid = document.getElementById('productsGrid');
        if (grid) {
            grid.innerHTML = `<div class="error-message show">❌ Error al cargar productos. Intenta más tarde.</div>`;
        }
    }
}

// ✅ Filtrar productos (reutilizable en dashboard, admin, etc.)
function filterProducts(category) {
    const grid = document.getElementById('productsGrid');
    const title = document.getElementById('categoryTitle');
    const dropdown = document.getElementById('categoryDropdown');

    if (!grid || !title) return;

    // Actualizar dropdown
    if (category && dropdown) dropdown.value = category;

    // Mapeo de nombres
    const names = {
        'electrodomesticos': 'Electrodomésticos',
        'articulos-hogar': 'Artículos del Hogar',
        'dulces': 'Dulces',
        'confituras': 'Confituras',
        'regalos': 'Regalos',
        'juguetes': 'Juguetes'
    };

    title.textContent = names[category] || 'Todos los Productos';

    // Filtrar
    let filtered = category 
        ? allProducts.filter(p => p.tipoproducto === category) 
        : allProducts;

    if (filtered.length === 0) {
        grid.innerHTML = '<div class="no-products">No hay productos disponibles</div>';
        return;
    }

    // ✅ Renderizar con URLs de imagen correctas
   grid.innerHTML = filtered.map(p => {
        // ✅ Corrección de URL para imágenes
        const imageUrl = p.imagen 
            ? (p.imagen.startsWith('http') ? p.imagen : `http://127.0.0.1:8000${p.imagen}`)
            : 'images/default.jpg';
            
        return `
        <div class="product-card">
            <img src="${imageUrl}" 
                 alt="${p.nombreproducto}" class="product-image"
                 onerror="this.src='images/default.jpg'">
            <div class="product-info">
                <div class="product-name">${p.nombreproducto}</div>
                <div class="product-price">S/ ${parseFloat(p.precio || 0).toFixed(2)}</div>
                <div class="product-stock ${p.stock < 5 ? 'low' : ''}">Stock: ${p.stock}</div>
                ${p.stock > 0 
                    ? `<button class="buy-btn" onclick="addToCart(${JSON.stringify(p).replace(/"/g, '&quot;')})">🛒 Comprar</button>`
                    : `<button class="buy-btn disabled" disabled>Agotado</button>`
                }
            </div>
        </div>
        `;
    }).join('');
}

// ✅ Inicializar
document.addEventListener('DOMContentLoaded', () => {
    loadCart();
    
    // ✅ Solo cargar productos si hay token
    const token = localStorage.getItem('auth_token');
    if (token) {
        loadProductsFromAPI();
    } else {
        console.log('❌ Sin token de autenticación. Redirigiendo a login...');
        // No redirigir automáticamente - ya se maneja en cada página HTML
    }
    
    // ✅ Evento para Enter en búsqueda (si existe el elemento)
    const searchInput = document.querySelector('.search-input');
    if (searchInput) {
        searchInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                const category = this.value.toLowerCase().replace(' ', '-');
                filterProducts(category);
            }
        });
    }
});

// ✅ Cerrar sesión
function logout() {
    if (confirm('¿Desea cerrar sesión?')) {
        localStorage.clear();
        window.location.href = 'login.html';
    }
}

// ✅ Cargar productos por defecto si estamos en una página que los necesita
if (document.getElementById('productsGrid')) {
    const token = localStorage.getItem('auth_token');
    if (token) {
        setTimeout(loadProductsFromAPI, 100); // Pequeño delay para asegurar DOM listo
    }
}
function addToCartById(productId) {
    const product = allProducts.find(p => p.id === productId);
    if (product) addToCart(product);
}
// ✅ Exportar para módulos (si se usa)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { 
        addToCart, 
        loadProductsFromAPI, 
        filterProducts,
        updateCartDisplay,
        toggleCart,
        checkout,
        logout,
        cart,
        allProducts
    };
}