// js/api.js
const API_BASE = 'http://127.0.0.1:8000/api';

export async function request(endpoint, options = {}) {
    const token = localStorage.getItem('auth_token');
    if (!token) throw new Error('Token no encontrado');

    const config = {
        headers: {
            'Authorization': `Token ${token}`,
            'Content-Type': 'application/json'
        },
        ...options
    };

    const res = await fetch(`${API_BASE}${endpoint}`, config);
    if (!res.ok) throw new Error(await res.text());
    return res.json();
}

export const api = {
    getProducts: () => request('/almacen/'),
    createSale: (data) => request('/ventas/', { method: 'POST', body: JSON.stringify(data) })
};