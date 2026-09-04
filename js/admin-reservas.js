const ADMIN_RESERVAS_API = '../api/data.php?resource=reservas';

function reservaEstadoClase(estado) {
    const value = String(estado || 'pendiente').toLowerCase();
    if (value.includes('confirm')) return 'confirmada';
    if (value.includes('cancel')) return 'cancelada';
    return 'pendiente';
}

function reservaEstadoTexto(estado) {
    const value = String(estado || 'pendiente').toLowerCase();
    if (value.includes('confirm')) return 'Confirmada';
    if (value.includes('cancel')) return 'Cancelada';
    return 'Pendiente';
}

function reservaFechaTabla(fecha) {
    if (!fecha) return '-';
    const [year, month, day] = fecha.split('-');
    return `${day}/${month}/${year}`;
}

function reservaHoraTabla(hora) {
    if (!hora) return '-';
    const [hours, minutes] = hora.split(':').map(Number);
    if (Number.isNaN(hours) || Number.isNaN(minutes)) return hora;
    const date = new Date();
    date.setHours(hours, minutes, 0, 0);
    return date.toLocaleTimeString('es-PE', { hour: 'numeric', minute: '2-digit' });
}

async function reservasRequest(url = ADMIN_RESERVAS_API, options = {}) {
    const response = await fetch(url, {
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
        ...options,
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'No se pudo completar la accion.');
    return data;
}

function reservaNormalizada(reserva) {
    return {
        ...reserva,
        cliente: reserva.nombre_cliente || reserva.usuario_nombre || '-',
        correo: reserva.usuario_correo || '-',
        telefono: reserva.telefono || '-',
        personas: reserva.cantidad_personas || '-',
        mensaje: reserva.mensaje || '-',
        estadoTexto: reservaEstadoTexto(reserva.estado),
        estadoClase: reservaEstadoClase(reserva.estado),
    };
}

function setSelectValue(select, value) {
    if (!select) return;
    const text = String(value || '').trim();
    if (!text) {
        select.value = '';
        return;
    }
    const exists = [...select.options].some((option) => option.value === text || option.textContent.trim() === text);
    if (!exists) select.add(new Option(text, text));
    select.value = text;
}

function actualizarContadores(reservas) {
    const hoy = new Date().toISOString().slice(0, 10);
    const valores = {
        hoy: reservas.filter((r) => r.fecha === hoy).length,
        confirmadas: reservas.filter((r) => reservaEstadoClase(r.estado) === 'confirmada').length,
        pendientes: reservas.filter((r) => reservaEstadoClase(r.estado) === 'pendiente').length,
        canceladas: reservas.filter((r) => reservaEstadoClase(r.estado) === 'cancelada').length,
    };

    document.querySelector('[data-reservas-count="hoy"]').textContent = valores.hoy;
    document.querySelector('[data-reservas-count="confirmadas"]').textContent = valores.confirmadas;
    document.querySelector('[data-reservas-count="pendientes"]').textContent = valores.pendientes;
    document.querySelector('[data-reservas-count="canceladas"]').textContent = valores.canceladas;
}

function filtrarReservas(reservas) {
    const busqueda = document.querySelector('#buscar-reserva')?.value.trim().toLowerCase() || '';
    const estado = document.querySelector('#filtro-estado-reserva')?.value || '';
    return reservas.filter((reserva) => {
        const item = reservaNormalizada(reserva);
        const texto = `${item.cliente} ${item.correo} ${item.telefono} ${item.mesa} ${item.mensaje}`.toLowerCase();
        const coincideTexto = !busqueda || texto.includes(busqueda);
        const coincideEstado = !estado || item.estadoClase === estado;
        return coincideTexto && coincideEstado;
    });
}

function pintarTablaReservas(reservas) {
    const tbody = document.querySelector('.tabla-reservas tbody');
    if (!tbody) return;

    const visibles = filtrarReservas(reservas);
    tbody.innerHTML = visibles.map((reserva) => {
        const item = reservaNormalizada(reserva);
        return `
            <tr>
                <td class="celda-cliente"><strong>${item.cliente}</strong><small>${item.correo}</small></td>
                <td>${item.telefono}</td>
                <td><strong>${reservaFechaTabla(item.fecha)}</strong><small>${reservaHoraTabla(item.hora)}</small></td>
                <td><strong>${item.mesa || '-'}</strong><small>${item.personas} persona(s)</small></td>
                <td class="celda-mensaje">${item.mensaje}</td>
                <td class="celda-estado"><span class="estado ${item.estadoClase}">${item.estadoTexto}</span></td>
                <td class="acciones-reserva">
                    <a class="btn-editar-reserva" href="editar-reserva.html?id=${item.id}">Editar</a>
                    <a class="btn-eliminar-reserva" href="eliminacion-reserva.html?id=${item.id}" aria-label="Eliminar reserva"><i class="fas fa-trash"></i></a>
                </td>
            </tr>
        `;
    }).join('') || '<tr><td colspan="7">No hay reservas registradas.</td></tr>';
}

async function cargarReservasAdmin() {
    const tbody = document.querySelector('.tabla-reservas tbody');
    if (!tbody) return;

    try {
        const result = await reservasRequest();
        const reservas = result.data || [];
        window.__reservasAdmin = reservas;
        actualizarContadores(reservas);
        pintarTablaReservas(reservas);
    } catch (error) {
        tbody.innerHTML = `<tr><td colspan="7">${error.message}</td></tr>`;
    }
}

function activarFiltrosReservas() {
    const buscar = document.querySelector('#buscar-reserva');
    const estado = document.querySelector('#filtro-estado-reserva');
    const boton = document.querySelector('#btn-buscar-reserva');
    const aplicar = () => pintarTablaReservas(window.__reservasAdmin || []);
    buscar?.addEventListener('input', aplicar);
    estado?.addEventListener('change', aplicar);
    boton?.addEventListener('click', aplicar);
}

function formReservaData() {
    return {
        nombre_cliente: document.querySelector('#cliente')?.value.trim() || '',
        telefono: document.querySelector('#telefono')?.value.trim() || '',
        fecha: document.querySelector('#fecha')?.value || '',
        hora: document.querySelector('#hora')?.value || '',
        mesa: document.querySelector('#mesa')?.value || '',
        cantidad_personas: document.querySelector('#personas')?.value || '',
        mensaje: document.querySelector('#mensaje')?.value.trim() || '',
        estado: document.querySelector('#estado-reserva')?.value || 'pendiente',
    };
}

async function activarFormularioReserva() {
    const form = document.querySelector('.form-reserva-admin');
    if (!form) return;
    const id = new URLSearchParams(location.search).get('id');
    const editando = Boolean(id);

    if (editando) {
        try {
            const result = await reservasRequest(`${ADMIN_RESERVAS_API}&id=${id}`);
            const reserva = result.data || {};
            if (!reserva.id) {
                alert('No se encontro la reserva.');
                window.location.href = 'reservas.html';
                return;
            }
            document.querySelector('#cliente').value = reserva.nombre_cliente || reserva.usuario_nombre || '';
            document.querySelector('#correo').value = reserva.usuario_correo || '';
            document.querySelector('#telefono').value = reserva.telefono || '';
            document.querySelector('#fecha').value = reserva.fecha || '';
            document.querySelector('#hora').value = (reserva.hora || '').slice(0, 5);
            setSelectValue(document.querySelector('#mesa'), reserva.mesa || '');
            document.querySelector('#personas').value = reserva.cantidad_personas || '';
            document.querySelector('#mensaje').value = reserva.mensaje || '';
            setSelectValue(document.querySelector('#estado-reserva'), reservaEstadoClase(reserva.estado));
        } catch (error) {
            alert('No se pudieron cargar los datos de la reserva: ' + error.message);
            return;
        }
    }

    form.addEventListener('submit', async (event) => {
        event.preventDefault();
        try {
            await reservasRequest(editando ? `${ADMIN_RESERVAS_API}&id=${id}` : ADMIN_RESERVAS_API, {
                method: editando ? 'PUT' : 'POST',
                body: JSON.stringify(formReservaData()),
            });
            window.location.href = 'reservas.html';
        } catch (error) {
            alert(error.message);
        }
    });
}

function activarEliminacionReserva() {
    const eliminar = document.querySelector('.eliminar-confirmacion');
    if (!eliminar) return;
    const id = new URLSearchParams(location.search).get('id');
    eliminar.href = '#';
    eliminar.addEventListener('click', async (event) => {
        event.preventDefault();
        if (!id) {
            alert('Falta el id de la reserva.');
            window.location.href = 'reservas.html';
            return;
        }
        try {
            await reservasRequest(`${ADMIN_RESERVAS_API}&id=${id}`, { method: 'DELETE' });
            window.location.href = 'eliminacion-exitosa.html';
        } catch (error) {
            alert(error.message);
        }
    });
}

cargarReservasAdmin();
activarFiltrosReservas();
activarFormularioReserva();
activarEliminacionReserva();
