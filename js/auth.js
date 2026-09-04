async function usuarioActual() {
    const result = await api('auth.php?action=me');
    return result.user;
}

function rutaPerfil() {
    return window.location.pathname.includes('/pages/') ? 'perfil_usuario.html' : 'pages/perfil_usuario.html';
}

function rutaLogin() {
    return window.location.pathname.includes('/pages/') ? 'login.html' : 'pages/login.html';
}

function irSegunRol(user) {
    const rol = String(user.rol || '').toLowerCase();
    window.location.href = ['admin', 'administrador'].includes(rol) ? '../admin/dashboard.html' : rutaPerfil();
}

if (document.querySelector('#form-login')) {
    usuarioActual()
        .then((user) => { if (user) irSegunRol(user); })
        .catch(() => {});
}

document.querySelector('#form-login')?.addEventListener('submit', async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const correo = form.querySelector('input[type="email"]').value.trim();
    const password = form.querySelector('#password').value;

    try {
        const result = await api('auth.php?action=login', { method: 'POST', body: JSON.stringify({ correo, password }) });
        irSegunRol(result.user);
    } catch (error) {
        alert(error.message);
    }
});

document.querySelector('#form-registro')?.addEventListener('submit', async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const nombre = form.elements.nombre.value.trim();
    const correo = form.elements.correo.value.trim();
    const telefono = form.elements.telefono.value.trim();
    const ciudad = form.elements.ciudad.value.trim();
    const password = form.elements.password.value;
    const confirmar = form.elements.confirmar.value;

    if (password !== confirmar) {
        alert('Las contrasenas no coinciden.');
        return;
    }

    try {
        await api('auth.php?action=register', { method: 'POST', body: JSON.stringify({ nombre, correo, telefono, ciudad, password }) });
        window.location.href = 'perfil_usuario.html';
    } catch (error) {
        alert(error.message);
    }
});

async function cargarPerfil() {
    const perfil = document.querySelector('[data-perfil]');
    if (!perfil) return;

    try {
        const user = await usuarioActual();
        if (!user) {
            window.location.href = 'login.html';
            return;
        }

        perfil.querySelector('[data-user="nombre"]').textContent = user.nombre || '-';
        perfil.querySelector('[data-user="correo"]').textContent = user.correo || '-';
        perfil.querySelector('[data-user="telefono"]').textContent = user.telefono || '-';
        perfil.querySelector('[data-user="ciudad"]').textContent = user.ciudad || '-';
    } catch (error) {
        alert(error.message);
        window.location.href = 'login.html';
    }
}

document.querySelector('#btn-logout')?.addEventListener('click', async () => {
    try {
        await api('auth.php?action=logout', { method: 'POST', body: JSON.stringify({}) });
    } catch (error) {
        alert(error.message);
        return;
    }

    window.location.href = rutaLogin();
});

cargarPerfil();
