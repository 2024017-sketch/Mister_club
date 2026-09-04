const API_URL = window.location.pathname.includes('/pages/') || window.location.pathname.includes('/admin/')
    ? '../api/'
    : 'api/';

async function api(endpoint, options = {}) {
    const response = await fetch(API_URL + endpoint, {
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
        ...options,
    });
    const text = await response.text();
    let data;
    try { data = JSON.parse(text); }
    catch { throw new Error('La API no respondi&oacute; correctamente. Revisa la configuraci&oacute;n PHP del hosting.'); }
    if (!response.ok) throw new Error(data.error || 'Ocurri&oacute; un error.');
    return data;
}

