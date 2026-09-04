const DASHBOARD_API = '../api/data.php?resource=';

async function dashboardFetch(resource) {
    const response = await fetch(`${DASHBOARD_API}${resource}`, { credentials: 'same-origin' });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'No se pudo cargar el dashboard.');
    return data.data || [];
}

function setDashboardCount(name, value) {
    const node = document.querySelector(`[data-dashboard-count="${name}"]`);
    if (node) node.textContent = value;
}

function estadoReserva(estado) {
    const value = String(estado || 'pendiente').toLowerCase();
    if (value.includes('confirm')) return 'Confirmada';
    if (value.includes('cancel')) return 'Cancelada';
    return 'Pendiente';
}

function esHoy(fecha) {
    return fecha === new Date().toISOString().slice(0, 10);
}

function pintarReservasDashboard(reservas) {
    const tbody = document.querySelector('[data-dashboard-reservas]');
    if (!tbody) return;

    const recientes = reservas.slice(0, 5);
    if (!recientes.length) {
        tbody.innerHTML = '<tr><td colspan="3">No hay reservas registradas.</td></tr>';
        return;
    }

    tbody.innerHTML = recientes.map((reserva) => `
        <tr>
            <td>${reserva.nombre_cliente || reserva.usuario_nombre || '-'}</td>
            <td>${reserva.mesa || 'Por asignar'}</td>
            <td>${estadoReserva(reserva.estado)}</td>
        </tr>
    `).join('');
}

function pintarEventosDashboard(eventos) {
    const lista = document.querySelector('[data-dashboard-eventos]');
    if (!lista) return;

    const hoy = new Date().toISOString().slice(0, 10);
    const proximos = eventos
        .filter((evento) => !evento.fecha || evento.fecha >= hoy)
        .sort((a, b) => String(a.fecha || '').localeCompare(String(b.fecha || '')))
        .slice(0, 5);

    if (!proximos.length) {
        lista.innerHTML = '<li>No hay eventos proximos.</li>';
        return;
    }

    lista.innerHTML = proximos.map((evento) => `<li>${evento.titulo || 'Evento sin titulo'}</li>`).join('');
}

async function cargarDashboard() {
    try {
        const [reservas, usuarios, eventos] = await Promise.all([
            dashboardFetch('reservas'),
            dashboardFetch('usuarios'),
            dashboardFetch('eventos'),
        ]);

        setDashboardCount('reservas-hoy', reservas.filter((reserva) => esHoy(reserva.fecha)).length);
        setDashboardCount('usuarios', usuarios.length);
        setDashboardCount('reservas-total', reservas.length);
        setDashboardCount('reservas-pendientes', reservas.filter((reserva) => estadoReserva(reserva.estado) === 'Pendiente').length);
        setDashboardCount('reservas-confirmadas', reservas.filter((reserva) => estadoReserva(reserva.estado) === 'Confirmada').length);
        setDashboardCount('eventos-activos', eventos.filter((evento) => String(evento.estado || '').toLowerCase().includes('activo')).length);

        pintarReservasDashboard(reservas);
        pintarEventosDashboard(eventos);
    } catch (error) {
        const tbody = document.querySelector('[data-dashboard-reservas]');
        const lista = document.querySelector('[data-dashboard-eventos]');
        if (tbody) tbody.innerHTML = `<tr><td colspan="3">${error.message}</td></tr>`;
        if (lista) lista.innerHTML = `<li>${error.message}</li>`;
    }
}

cargarDashboard();
