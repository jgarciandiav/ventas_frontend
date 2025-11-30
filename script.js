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

// ✅ Añadir al carrito con cantidad (corregido para tu modelo)
function addToCart(product) {
    // Verificar stock
    if (product.stock <= 0) {
        alert('❌ Producto agotado');
        return;
    }

    // Solicitar cantidad al usuario
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
        alert(`❌ Stock insuficiente. Solo quedan ${product.stock} unidades disponibles.`);
        return;
    }

    // ✅ Paso 1: Actualizar stock en el backend INMEDIATAMENTE
    const token = localStorage.getItem('auth_token');
    fetch(`http://127.0.0.1:8000/api/almacen/${product.id}/update-stock/`, {
        method: 'PATCH',
        headers: {
            'Authorization': `Token ${token}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ stock: product.stock - quantity })
    })
    .then(response => {
        if (!response.ok) {
            return response.json().then(data => {
                throw new Error(data.error || `HTTP ${response.status}`);
            });
        }
        return response.json();
    })
    .then(data => {
        // ✅ Paso 2: Recargar todos los productos desde el backend
        loadProductsFromAPI(); // ✅ Esto actualizará allProducts con los valores reales
        
        // ✅ Paso 3: Añadir al carrito
        const precio = parseFloat(product.precio) || 0;
        const existingItem = cart.find(item => item.id === product.id);
        
        if (existingItem) {
            existingItem.cantidad += quantity;
            existingItem.subtotal = existingItem.precio * existingItem.cantidad;
            alert(`✅ Se han añadido ${quantity} unidades más de "${product.nombreproducto}".\nTotal en carrito: ${existingItem.cantidad} unidades.`);
        } else {
            cart.push({
                id: product.id,
                name: product.nombreproducto,
                price: `S/ ${precio.toFixed(2)}`,
                image: product.imagen || 'images/default.jpg',
                precio: precio,
                cantidad: quantity,
                subtotal: precio * quantity
            });
            alert(`✅ ${quantity} ${quantity === 1 ? 'unidad' : 'unidades'} de "${product.nombreproducto}" agregadas al carrito.`);
        }
        
        // ✅ Actualizar vista del carrito
        saveCart();
        updateCartDisplay();
        
    })
    .catch(err => {
        alert(`❌ Error al actualizar stock: ${err.message}`);
        console.error('Error al actualizar stock:', err);
    });
}
// ✅ Eliminar del carrito (con restauración de stock)
function removeFromCart(index) {
    const item = cart[index];
    
    // ✅ Preguntar si quiere eliminar parcial o total
    const action = confirm(
        `¿Deseas eliminar TODO "${item.name}" del carrito?\n` +
        `Actualmente tienes ${item.cantidad} unidades.\n\n` +
        `→ Aceptar: Eliminar todas las unidades\n` +
        `→ Cancelar: Eliminar parcialmente`
    );

    if (action) {
        // ✅ Eliminar TOTAL: restaurar todo el stock y eliminar del carrito
        removeFromCartTotal(index, item);
    } else {
        // ✅ Eliminar PARCIAL: preguntar cantidad a devolver
        removeFromCartPartial(index, item);
    }
}

// ✅ Eliminar parcialmente del carrito
function removeFromCartPartial(index, item) {
    const returnQuantity = prompt(
        `¿Cuántas unidades de "${item.name}" deseas eliminar del carrito?\n` +
        `Cantidad actual: ${item.cantidad}`,
        '1'
    );

    if (returnQuantity === null || returnQuantity.trim() === '') return;

    const quantity = parseInt(returnQuantity);
    
    // ✅ Validaciones
    if (isNaN(quantity) || quantity <= 0) {
        alert('❌ Cantidad debe ser un número entero mayor a 0');
        return;
    }
    if (quantity > item.cantidad) {
        alert(`❌ Solo puedes eliminar hasta ${item.cantidad} unidades`);
        return;
    }

    // ✅ Si es igual a la cantidad actual, eliminar total
    if (quantity === item.cantidad) {
        removeFromCartTotal(index, item);
        return;
    }

    // ✅ Actualizar stock en backend
    const token = localStorage.getItem('auth_token');
    fetch(`http://127.0.0.1:8000/api/almacen/${item.id}/update-stock/`, {
        method: 'PATCH',
        headers: {
            'Authorization': `Token ${token}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ stock: getActualStock(item.id) + quantity })
    })
    .then(response => {
        if (!response.ok) {
            return response.json().then(data => {
                throw new Error(data.error || `HTTP ${response.status}`);
            });
        }
        return response.json();
    })
    .then(data => {
        // ✅ Actualizar carrito
        item.cantidad -= quantity;
        item.subtotal = item.precio * item.cantidad;
        
        // Si queda 0, eliminar del carrito
        if (item.cantidad <= 0) {
            cart.splice(index, 1);
        }
        
        saveCart();
        updateCartDisplay();
        loadProductsFromAPI(); // ✅ Recargar productos para actualizar vista
        
        alert(`✅ ${quantity} ${quantity === 1 ? 'unidad' : 'unidades'} de "${item.name}" eliminadas del carrito.`);
        
    })
    .catch(err => {
        alert(`❌ Error al actualizar stock: ${err.message}`);
        console.error('Error al actualizar stock:', err);
    });
}

// ✅ Eliminar totalmente del carrito
function removeFromCartTotal(index, item) {
    // ✅ Actualizar stock en backend (restaurar toda la cantidad)
    const token = localStorage.getItem('auth_token');
    fetch(`http://127.0.0.1:8000/api/almacen/${item.id}/update-stock/`, {
        method: 'PATCH',
        headers: {
            'Authorization': `Token ${token}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ stock: getActualStock(item.id) + item.cantidad })
    })
    .then(response => {
        if (!response.ok) {
            return response.json().then(data => {
                throw new Error(data.error || `HTTP ${response.status}`);
            });
        }
        return response.json();
    })
    .then(data => {
        // ✅ Eliminar del carrito
        cart.splice(index, 1);
        saveCart();
        updateCartDisplay();
        loadProductsFromAPI(); // ✅ Recargar productos para actualizar vista
        
        alert(`✅ ${item.name} eliminado completamente del carrito.`);
        
    })
    .catch(err => {
        alert(`❌ Error al restaurar stock: ${err.message}`);
        console.error('Error al restaurar stock:', err);
    });
}

// ✅ Función auxiliar: obtener stock actual del producto
function getActualStock(productId) {
    const product = allProducts.find(p => p.id === productId);
    return product ? product.stock : 0;
}
// ✅ Mostrar/ocultar carrito
function toggleCart() {
    const modal = document.getElementById('cartModal');
    if (modal) {
        modal.classList.toggle('active');
        updateCartDisplay();
    }
}

// ✅ Actualizar visualización del carrito (corregido para tu modelo)
function updateCartDisplay() {
    const countEl = document.getElementById('cartCount');
    const itemsEl = document.getElementById('cartItems');
    const totalEl = document.getElementById('totalAmount');

    if (countEl) countEl.textContent = cart.reduce((sum, item) => sum + item.cantidad, 0);

    if (!itemsEl || !totalEl) return;

    if (cart.length === 0) {
        itemsEl.innerHTML = `
            <div class="empty-cart">
                <p>Tu carrito está vacío</p>
                <p class="empty-cart-subtitle">Agrega productos para comenzar tu compra</p>
            </div>`;
        totalEl.textContent = 'S/ 0.00';
        return;
    }

    // ✅ Mostrar cantidad y subtotal en cada item (con seguridad para campos undefined)
    const itemsHtml = cart.map((item, i) => `
        <div class="cart-item">
            <img src="${item.image.startsWith('http') ? item.image : 'http://127.0.0.1:8000' + item.image}" 
                alt="${item.name}" class="cart-item-image"
                onerror="this.src='images/default.jpg'">
            <div class="cart-item-info">
                <div class="cart-item-name">${item.name}</div>
                <div class="cart-item-price">S/ ${item.precio.toFixed(2)} × ${item.cantidad}</div>
                <div class="cart-item-subtotal">Subtotal: S/ ${item.subtotal.toFixed(2)}</div>
            </div>
            <div class="cart-item-actions">
                <button class="remove-btn" onclick="removeFromCart(${i})">🗑️ Eliminar</button>
            </div>
        </div>
    `).join('');

    // ✅ Calcular total general CORRECTAMENTE
    const total = cart.reduce((sum, item) => sum + (item.precio || 0) * (item.cantidad || 1), 0);
    itemsEl.innerHTML = itemsHtml;
    totalEl.textContent = `S/ ${total.toFixed(2)}`;
}

// ✅ Proceder al pago (con actualización de stock en backend)
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

    // ✅ Paso 1: Registrar venta en backend
    const ventas = cart.map(item => ({
        producto_id: item.id,
        cantidad: item.cantidad
    }));

    fetch('http://127.0.0.1:8000/api/ventas/', {
        method: 'POST',
        headers: {
            'Authorization': `Token ${token}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ ventas })
    })
    .then(response => {  // ✅ "response" en lugar de "r"
        if (!response.ok) {
            return response.json().then(data => {
                throw new Error(data.error || `HTTP ${response.status}`);
            });
        }
        return response.json();
    })
    .then(data => {
        // ✅ Paso 2: Generar factura PDF
        generateInvoicePDF();
        
        // ✅ Paso 3: Vaciar carrito
        cart = [];
        saveCart();
        updateCartDisplay();
        toggleCart();
        
        alert('✅ ¡Compra registrada!\nLa factura se ha descargado automáticamente.');
        
    })
    .catch(err => {
        alert(`❌ Error al procesar venta: ${err.message}`);
        console.error('Error en checkout:', err);
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

// ✅ Cargar productos desde backend (con URLs correctas para imágenes)
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
        
        // ✅ Forzar actualización de allProducts
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

// ✅ Filtrar productos (con URLs correctas para imágenes)
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

    // ✅ Renderizar con URLs de imagen correctas y campos de tu modelo
    grid.innerHTML = filtered.map(p => {
        // ✅ Seguridad: verificar que precio existe y es número
        const price = p.precio ? parseFloat(p.precio) : 0;
        // ✅ URL correcta para imágenes
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
                <div class="product-price">S/ ${price.toFixed(2)}</div>
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
    }
});

// ✅ Cerrar sesión
function logout() {
    if (confirm('¿Desea cerrar sesión?')) {
        localStorage.clear();
        window.location.href = 'login.html';
    }
}
function generateInvoicePDF() {
    // ✅ Inicializar jsPDF
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    // ✅ Estilos y colores
    const primaryColor = [0, 180, 219]; // #00b4db
    const darkColor = [51, 51, 51];      // #333

    // ✅ Encabezado
    doc.setFontSize(24);
    doc.setTextColor(...primaryColor);
    doc.text('MultiTiendas', 105, 20, { align: 'center' });
    
    doc.setFontSize(12);
    doc.setTextColor(...darkColor);
    doc.text('Tu tienda donde todo lo puedes encontrar', 105, 30, { align: 'center' });
    doc.line(20, 35, 190, 35);

    // ✅ Información de factura
    const now = new Date();
    doc.setFontSize(10);
    doc.text(`Factura #: FT-${now.getTime()}`, 20, 45);
    doc.text(`Fecha: ${now.toLocaleDateString()}`, 160, 45);
    
    // ✅ Datos del cliente
    const username = localStorage.getItem('username') || 'Cliente';
    doc.text('Cliente:', 20, 55);
    doc.setFont('helvetica', 'bold');
    doc.text(username, 20, 62);
    doc.setFont('helvetica', 'normal');

    // ✅ Tabla de productos
    doc.setFontSize(14);
    doc.setTextColor(...primaryColor);
    doc.text('DETALLE DE COMPRA', 20, 75);
    doc.setFontSize(10);
    doc.setTextColor(...darkColor);
    
    // Encabezados de tabla
    doc.setFillColor(...primaryColor);
    doc.setTextColor(255, 255, 255);
    doc.rect(20, 82, 170, 8, 'F');
    doc.text('PRODUCTO', 25, 87);
    doc.text('CANT.', 120, 87);
    doc.text('PRECIO', 145, 87);
    doc.text('SUBTOTAL', 165, 87);

    // ✅ Productos
    let y = 95;
    cart.forEach(item => {
        // Línea de producto
        doc.setTextColor(...darkColor);
        doc.setFont('helvetica', 'normal');
        doc.text(item.name, 25, y, { maxWidth: 90 });
        doc.text(item.cantidad.toString(), 125, y, { align: 'center' });
        doc.text(`S/ ${item.precio.toFixed(2)}`, 145, y, { align: 'right' });
        doc.text(`S/ ${item.subtotal.toFixed(2)}`, 165, y, { align: 'right' });
        
        y += 8;
        
        // Línea divisoria
        if (y < 250) {
            doc.setDrawColor(220, 220, 220);
            doc.line(20, y, 190, y);
            y += 3;
        }
    });

    // ✅ Totales (siempre visibles en la parte inferior)
    const total = cart.reduce((sum, item) => sum + item.subtotal, 0);
    
    // Línea divisoria antes de totales
    doc.setDrawColor(100, 100, 100);
    doc.line(20, 260, 190, 260);
    
    // Totales
    doc.setFont('helvetica', 'bold');
    doc.text('TOTAL:', 145, 270);
    doc.setTextColor(...primaryColor);
    doc.text(`S/ ${total.toFixed(2)}`, 165, 270, { align: 'right' });

    // ✅ Pie de página
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text('Gracias por tu compra. ¡Visítanos pronto!', 105, 285, { align: 'center' });
    doc.text('MultiTiendas - RUC: 12345678901', 105, 292, { align: 'center' });

    // ✅ Descargar PDF
    const filename = `factura_multitiendas_${now.toISOString().split('T')[0]}.pdf`;
    doc.save(filename);
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