const EVENTOS_API = location.pathname.includes('/admin/')
    ? '../api/data.php?resource=eventos'
    : '../api/data.php?resource=eventos';
const UPLOAD_API = '../api/upload.php';

function eventoFechaCorta(fecha) {
    if (!fecha) return '-';
    const [year, month, day] = fecha.split('-').map(Number);
    if (!year || !month || !day) return fecha;
    return new Date(year, month - 1, day).toLocaleDateString('es-PE', { day: '2-digit', month: 'long' });
}

function eventoFechaTabla(fecha) {
    if (!fecha) return '-';
    const [year, month, day] = fecha.split('-');
    return `${day}/${month}/${year}`;
}

function eventoHora(hora) {
    if (!hora) return '-';
    const [hours, minutes] = hora.split(':').map(Number);
    if (Number.isNaN(hours) || Number.isNaN(minutes)) return hora;
    const date = new Date();
    date.setHours(hours, minutes, 0, 0);
    return date.toLocaleTimeString('es-PE', { hour: 'numeric', minute: '2-digit' });
}

async function eventosFetch(url = EVENTOS_API, options = {}) {
    const response = await fetch(url, {
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
        ...options,
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'No se pudo completar la accion.');
    return data;
}

async function subirImagenEvento(file) {
    if (!file) return '';
    const formData = new FormData();
    formData.append('imagen', file);
    const response = await fetch(UPLOAD_API, {
        method: 'POST',
        credentials: 'same-origin',
        body: formData,
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'No se pudo subir la imagen.');
    return data.path;
}

function imagenEvento(evento) {
    if (!evento.imagen) return '../img/eventos/dia-padre.jpg';
    if (evento.imagen.startsWith('uploads/')) return `../${evento.imagen}`;
    return evento.imagen;
}

async function cargarEventosPublicos() {
    const grid = document.querySelector('.eventos-grid');
    if (!grid) return;

    try {
        const result = await eventosFetch();
        const eventos = result.data || [];
        if (!eventos.length) {
            grid.innerHTML = '<p class="sin-resultados">No hay eventos publicados.</p>';
            return;
        }

        grid.innerHTML = eventos.map((evento) => `
            <div class="card-evento">
                <div class="imagen-evento">
                    <span class="estado-evento">${evento.estado || 'Proximo evento'}</span>
                    <img src="${imagenEvento(evento)}" alt="${evento.titulo || 'Evento Mister Club'}">
                </div>
                <div class="contenido-evento">
                    <span class="fecha"><i class="fa-solid fa-calendar-days"></i> ${eventoFechaCorta(evento.fecha).toUpperCase()}</span>
                    <h2>${evento.titulo || 'Evento'}</h2>
                    <div class="datos-evento">
                        <p><i class="fa-solid fa-calendar-days"></i> ${eventoFechaCorta(evento.fecha)}</p>
                        <p><i class="fa-solid fa-clock"></i> ${eventoHora(evento.hora)}</p>
                        <p><i class="fa-solid fa-location-dot"></i> ${evento.lugar || 'Mister Club'}</p>
                    </div>
                    <p class="descripcion-evento">${evento.descripcion || ''}</p>
                    <button class="btn-detalle" type="button">VER DETALLE <i class="fa-solid fa-chevron-down"></i></button>
                    <div class="detalle-evento">
                        <h4>&iquest;Que encontraras?</h4>
                        <ul>
                            <li>DJ en vivo</li>
                            <li>Promociones especiales</li>
                            <li>Sorteos durante la noche</li>
                            <li>Ambiente exclusivo</li>
                        </ul>
                        <a href="reservas.html" class="btn-reserva-evento">RESERVAR MESA</a>
                    </div>
                </div>
            </div>
        `).join('');
        activarDetallesEvento();
    } catch (error) {
        grid.innerHTML = `<p class="sin-resultados">${error.message}</p>`;
    }
}

function activarDetallesEvento() {
    document.querySelectorAll('.btn-detalle').forEach((button) => {
        button.addEventListener('click', () => {
            button.closest('.contenido-evento')?.querySelector('.detalle-evento')?.classList.toggle('activo');
        });
    });
}

async function cargarEventosAdmin() {
    const tabla = document.querySelector('.tabla-eventos-admin tbody');
    if (!tabla) return;

    try {
        const result = await eventosFetch();
        const eventos = result.data || [];
        tabla.innerHTML = eventos.map((evento) => `
            <tr>
                <td>${evento.titulo || '-'}</td>
                <td>${eventoFechaTabla(evento.fecha)}</td>
                <td>${eventoHora(evento.hora)}</td>
                <td><span class="estado confirmada">${evento.estado || 'Activo'}</span></td>
                <td>-</td>
                <td class="acciones-reserva">
                    <a class="btn-editar-reserva" href="editar-evento.html?id=${evento.id}">Editar</a>
                    <a class="btn-eliminar-reserva" href="eliminacion-evento.html?id=${evento.id}" aria-label="Eliminar evento"><i class="fas fa-trash"></i></a>
                </td>
            </tr>
        `).join('') || '<tr><td colspan="6">No hay eventos registrados.</td></tr>';
    } catch (error) {
        tabla.innerHTML = `<tr><td colspan="6">${error.message}</td></tr>`;
    }
}

async function guardarFormularioEvento() {
    const form = document.querySelector('.form-evento-admin');
    if (!form) return;

    const params = new URLSearchParams(location.search);
    const id = params.get('id');
    const editando = Boolean(id);

    if (editando) {
        const result = await eventosFetch(`${EVENTOS_API}&id=${id}`);
        const evento = result.data || {};
        document.querySelector('#nombre-evento').value = evento.titulo || '';
        document.querySelector('#descripcion').value = evento.descripcion || '';
        document.querySelector('#fecha-evento').value = evento.fecha || '';
        document.querySelector('#hora-evento').value = (evento.hora || '').slice(0, 5);
        document.querySelector('#lugar-evento').value = evento.lugar || 'Mister Club';
        document.querySelector('#estado-evento').value = evento.estado || 'Activo';
        form.dataset.imagenActual = evento.imagen || '';
    }

    form.addEventListener('submit', async (event) => {
        event.preventDefault();
        try {
            const archivo = document.querySelector('#imagen-evento, #cambiar-imagen')?.files?.[0];
            const imagenSubida = await subirImagenEvento(archivo);
            const payload = {
                titulo: document.querySelector('#nombre-evento').value.trim(),
                descripcion: document.querySelector('#descripcion').value.trim(),
                fecha: document.querySelector('#fecha-evento').value,
                hora: document.querySelector('#hora-evento').value,
                lugar: document.querySelector('#lugar-evento').value.trim(),
                estado: document.querySelector('#estado-evento').value,
                imagen: imagenSubida || form.dataset.imagenActual || '',
            };
            await eventosFetch(editando ? `${EVENTOS_API}&id=${id}` : EVENTOS_API, {
                method: editando ? 'PUT' : 'POST',
                body: JSON.stringify(payload),
            });
            window.location.href = 'eventos.html';
        } catch (error) {
            alert(error.message);
        }
    });
}

function confirmarEliminacionEvento() {
    const eliminar = document.querySelector('.eliminar-confirmacion');
    if (!eliminar) return;

    const id = new URLSearchParams(location.search).get('id');
    eliminar.href = '#';
    eliminar.addEventListener('click', async (event) => {
        event.preventDefault();
        if (!id) {
            alert('Falta el id del evento.');
            window.location.href = 'eventos.html';
            return;
        }

        try {
            await eventosFetch(`${EVENTOS_API}&id=${id}`, { method: 'DELETE' });
            window.location.href = 'eliminacion-exitosa.html';
        } catch (error) {
            alert(error.message);
        }
    });
}
cargarEventosPublicos();
cargarEventosAdmin();
guardarFormularioEvento();
confirmarEliminacionEvento();


