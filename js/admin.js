// js/admin.js
export async function getUsers() {
    const token = localStorage.getItem('auth_token');
    const res = await fetch('http://127.0.0.1:8000/api/users/', {
        headers: { 'Authorization': `Token ${token}` }
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
}

export async function updateUser(userId, data) {
    const token = localStorage.getItem('auth_token');
    const res = await fetch(`http://127.0.0.1:8000/api/users/${userId}/`, {
        method: 'PUT',
        headers: {
            'Authorization': `Token ${token}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
}

export async function updatePrice(productId, precio_unitario) {
    const token = localStorage.getItem('auth_token');
    const res = await fetch(`http://127.0.0.1:8000/api/almacen/${productId}/update-precio/`, {
        method: 'PATCH',
        headers: {
            'Authorization': `Token ${token}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ precio_unitario })
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
}