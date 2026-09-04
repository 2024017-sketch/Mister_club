const RESERVA_BORRADOR = 'misterclub_reserva_borrador';
const RESERVA_CONFIRMADA = 'misterclub_reserva_confirmada';

function reservaEsPaginaInterna() {
    return window.location.pathname.includes('/pages/');
}

function reservaApiUrl() {
    return reservaEsPaginaInterna() ? '../api/data.php?resource=reservas' : 'api/data.php?resource=reservas';
}

function reservaAuthUrl() {
    return reservaEsPaginaInterna() ? '../api/auth.php?action=me' : 'api/auth.php?action=me';
}

function reservaLoginUrl() {
    return reservaEsPaginaInterna() ? 'login.html' : 'pages/login.html';
}

async function reservaUsuarioActual() {
    const response = await fetch(reservaAuthUrl(), { credentials: 'same-origin' });
    const data = await response.json();
    return data.user || null;
}

async function reservaRequiereSesion() {
    const user = await reservaUsuarioActual();
    if (user) return user;
    alert('Debes iniciar sesion antes de realizar una reserva.');
    window.location.href = reservaLoginUrl();
    return null;
}

function reservaPaginaFormulario() {
    return reservaEsPaginaInterna() ? 'reservas.html' : 'pages/reservas.html';
}

function reservaPaginaConfirmada() {
    return reservaEsPaginaInterna() ? 'reserva-confirmada.html' : 'pages/reserva-confirmada.html';
}

function reservaGuardar(key, data) {
    sessionStorage.setItem(key, JSON.stringify(data));
}

function reservaLeer(key) {
    try {
        return JSON.parse(sessionStorage.getItem(key) || '{}');
    } catch {
        return {};
    }
}

function reservaFormData(form) {
    return {
        nombre: form.elements.nombre?.value.trim() || '',
        fecha: form.elements.fecha?.value || '',
        personas: form.elements.personas?.value || '',
        mesa: form.elements.mesa?.value || '',
        telefono: form.elements.telefono?.value.trim() || '',
        hora: form.elements.hora?.value || '',
        mensaje: form.elements.mensaje?.value.trim() || '',
    };
}

function reservaAplicarData(form, data) {
    Object.entries(data).forEach(([key, value]) => {
        if (form.elements[key] && value) form.elements[key].value = value;
    });
}

function reservaDesdeInicio() {
    const form = document.querySelector('.reservas .form-reserva');
    const boton = document.querySelector('#btn-reserva-inicio');
    if (!form || !boton) return;

    boton.addEventListener('click', async (event) => {
        event.preventDefault();
        const user = await reservaRequiereSesion();
        if (!user) return;
        const data = reservaFormData(form);
        if (!data.nombre || !data.fecha || !data.personas || !data.mesa) {
            alert('Completa nombre, fecha, personas y mesa.');
            return;
        }
        reservaGuardar(RESERVA_BORRADOR, data);
        window.location.href = reservaPaginaFormulario();
    });
}

function reservaFormularioPrincipal() {
    const form = document.querySelector('#form-reserva');
    if (!form) return;

    reservaUsuarioActual().then((user) => {
        if (!user) return;
        if (form.elements.nombre && !form.elements.nombre.value) form.elements.nombre.value = user.nombre || '';
        if (form.elements.telefono && !form.elements.telefono.value) form.elements.telefono.value = user.telefono || '';
    }).catch(() => {});
    reservaAplicarData(form, reservaLeer(RESERVA_BORRADOR));

    form.addEventListener('submit', async (event) => {
        event.preventDefault();
        const user = await reservaRequiereSesion();
        if (!user) return;
        const data = reservaFormData(form);
        if (!data.nombre || !data.fecha || !data.personas || !data.mesa || !data.telefono || !data.hora) {
            alert('Completa nombre, fecha, personas, mesa, telefono y hora.');
            return;
        }

        const payload = {
            nombre_cliente: data.nombre,
            telefono: data.telefono,
            fecha: data.fecha,
            hora: data.hora,
            mesa: data.mesa,
            cantidad_personas: data.personas,
            mensaje: data.mensaje,
        };

        try {
            const response = await fetch(reservaApiUrl(), {
                method: 'POST',
                credentials: 'same-origin',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
            const result = await response.json();
            if (!response.ok) throw new Error(result.error || 'No se pudo registrar la reserva.');

            reservaGuardar(RESERVA_CONFIRMADA, { ...data, id: result.id || '' });
            sessionStorage.removeItem(RESERVA_BORRADOR);
            window.location.href = reservaPaginaConfirmada();
        } catch (error) {
            alert(error.message);
        }
    });
}

function reservaFechaBonita(value) {
    if (!value) return '-';
    const [year, month, day] = value.split('-').map(Number);
    if (!year || !month || !day) return value;
    return new Date(year, month - 1, day).toLocaleDateString('es-PE', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
    });
}

function reservaHoraBonita(value) {
    if (!value) return '-';
    const [hours, minutes] = value.split(':').map(Number);
    if (Number.isNaN(hours) || Number.isNaN(minutes)) return value;
    const date = new Date();
    date.setHours(hours, minutes, 0, 0);
    return date.toLocaleTimeString('es-PE', { hour: 'numeric', minute: '2-digit' });
}

function reservaConfirmada() {
    const detalle = document.querySelector('.detalle-reserva');
    if (!detalle) return;

    const data = reservaLeer(RESERVA_CONFIRMADA);
    const values = {
        nombre: data.nombre || '-',
        fecha: reservaFechaBonita(data.fecha),
        hora: reservaHoraBonita(data.hora),
        mesa: data.mesa || '-',
        personas: data.personas || '-',
        telefono: data.telefono || '-',
        mensaje: data.mensaje || '-',
    };

    Object.entries(values).forEach(([key, value]) => {
        const node = document.querySelector(`[data-reserva="${key}"]`);
        if (node) node.textContent = value;
    });
}

reservaDesdeInicio();
reservaFormularioPrincipal();
reservaConfirmada();
