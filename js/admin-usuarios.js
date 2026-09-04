const USUARIOS_API = '../api/data.php?resource=usuarios';

async function usuariosRequest(url = USUARIOS_API, options = {}) {
    const response = await fetch(url, {
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
        ...options,
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'No se pudo completar la accion.');
    return data;
}

function rolClase(rol) {
    return String(rol || '').toLowerCase().includes('admin') ? 'confirmada' : 'pendiente';
}

function rolTexto(rol) {
    return String(rol || '').toLowerCase().includes('admin') ? 'Administrador' : 'Cliente';
}

function filtrarUsuarios(usuarios) {
    const texto = document.querySelector('#buscar-usuario')?.value.trim().toLowerCase() || '';
    const rol = document.querySelector('#filtro-rol-usuario')?.value || '';

    return usuarios.filter((usuario) => {
        const rolUsuario = String(usuario.rol || '').toLowerCase();
        const coincideRol = !rol || rolUsuario === rol;
        const busqueda = `${usuario.nombre || ''} ${usuario.correo || ''} ${usuario.telefono || ''}`.toLowerCase();
        return coincideRol && (!texto || busqueda.includes(texto));
    });
}

function pintarUsuarios(usuarios) {
    const tbody = document.querySelector('.tabla-usuarios-admin tbody');
    if (!tbody) return;

    const visibles = filtrarUsuarios(usuarios);
    document.querySelector('[data-usuarios-total]').textContent = usuarios.length;

    if (!visibles.length) {
        tbody.innerHTML = '<tr><td colspan="5">No hay usuarios registrados.</td></tr>';
        return;
    }

    tbody.innerHTML = visibles.map((usuario) => `
        <tr>
            <td>${usuario.nombre || '-'}</td>
            <td>${usuario.correo || '-'}</td>
            <td>${usuario.telefono || '-'}</td>
            <td><span class="estado ${rolClase(usuario.rol)}">${rolTexto(usuario.rol)}</span></td>
            <td class="acciones-reserva">
                <a class="btn-editar-reserva" href="editar-usuario.html?id=${usuario.id}">Editar</a>
                <a class="btn-eliminar-reserva" href="eliminacion-usuario.html?id=${usuario.id}" aria-label="Eliminar usuario"><i class="fas fa-trash"></i></a>
            </td>
        </tr>
    `).join('');
}

async function cargarUsuarios() {
    const tbody = document.querySelector('.tabla-usuarios-admin tbody');
    if (!tbody) return;

    try {
        const result = await usuariosRequest();
        window.__usuariosAdmin = result.data || [];
        pintarUsuarios(window.__usuariosAdmin);
    } catch (error) {
        tbody.innerHTML = `<tr><td colspan="5">${error.message}</td></tr>`;
    }
}

function activarFiltrosUsuarios() {
    const aplicar = () => pintarUsuarios(window.__usuariosAdmin || []);
    document.querySelector('#buscar-usuario')?.addEventListener('input', aplicar);
    document.querySelector('#filtro-rol-usuario')?.addEventListener('change', aplicar);
    document.querySelector('#btn-buscar-usuario')?.addEventListener('click', aplicar);
}

function datosFormularioUsuario() {
    const data = {
        nombre: document.querySelector('#nombre-usuario')?.value.trim() || '',
        correo: document.querySelector('#correo-usuario')?.value.trim() || '',
        telefono: document.querySelector('#telefono-usuario')?.value.trim() || '',
        ciudad: document.querySelector('#ciudad-usuario')?.value.trim() || '',
        rol: document.querySelector('#rol-usuario')?.value || 'cliente',
    };

    const password = document.querySelector('#password-usuario')?.value || '';
    if (password) data.password = password;
    return data;
}

async function activarFormularioUsuario() {
    const form = document.querySelector('.form-usuario-admin');
    if (!form) return;

    const id = new URLSearchParams(location.search).get('id');
    const editando = Boolean(id);

    if (editando) {
        try {
            const result = await usuariosRequest(`${USUARIOS_API}&id=${id}`);
            const usuario = result.data || {};
            if (!usuario.id) {
                alert('No se encontro el usuario.');
                window.location.href = 'usuarios.html';
                return;
            }
            document.querySelector('#nombre-usuario').value = usuario.nombre || '';
            document.querySelector('#correo-usuario').value = usuario.correo || '';
            document.querySelector('#telefono-usuario').value = usuario.telefono || '';
            document.querySelector('#ciudad-usuario').value = usuario.ciudad || '';
            document.querySelector('#rol-usuario').value = rolClase(usuario.rol) === 'confirmada' ? 'administrador' : 'cliente';
        } catch (error) {
            alert(error.message);
        }
    }

    form.addEventListener('submit', async (event) => {
        event.preventDefault();
        try {
            const data = datosFormularioUsuario();
            if (!editando && !data.password) {
                alert('Ingresa una contrasena para el nuevo usuario.');
                return;
            }
            await usuariosRequest(editando ? `${USUARIOS_API}&id=${id}` : USUARIOS_API, {
                method: editando ? 'PUT' : 'POST',
                body: JSON.stringify(data),
            });
            window.location.href = 'usuarios.html';
        } catch (error) {
            alert(error.message);
        }
    });
}

function activarEliminacionUsuario() {
    const eliminar = document.querySelector('.eliminar-usuario-confirmacion');
    if (!eliminar) return;

    const id = new URLSearchParams(location.search).get('id');
    eliminar.addEventListener('click', async (event) => {
        event.preventDefault();
        if (!id) {
            alert('Falta el id del usuario.');
            window.location.href = 'usuarios.html';
            return;
        }
        try {
            await usuariosRequest(`${USUARIOS_API}&id=${id}`, { method: 'DELETE' });
            window.location.href = 'eliminacion-exitosa.html';
        } catch (error) {
            alert(error.message);
        }
    });
}

cargarUsuarios();
activarFiltrosUsuarios();
activarFormularioUsuario();
activarEliminacionUsuario();
