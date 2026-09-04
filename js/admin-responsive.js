document.querySelectorAll('.dashboard, .admin').forEach((dashboard) => {
    const sidebar = dashboard.querySelector('.sidebar');
    const encabezado = dashboard.querySelector('.contenido header');

    if (!sidebar) return;

    if (!sidebar.querySelector('.admin-logout')) {
        const salir = document.createElement('button');
        salir.type = 'button';
        salir.className = 'admin-logout';
        salir.innerHTML = '<i class="fa-solid fa-right-from-bracket"></i><span>Cerrar sesion</span>';
        salir.addEventListener('click', async () => {
            try {
                await fetch('../api/auth.php?action=logout', {
                    method: 'POST',
                    credentials: 'same-origin',
                    headers: { 'Content-Type': 'application/json' },
                    body: '{}',
                });
            } finally {
                window.location.href = '../index.html';
            }
        });
        sidebar.append(salir);
    }

    if (!encabezado || encabezado.querySelector('.admin-hamburger')) return;

    const boton = document.createElement('button');
    boton.type = 'button';
    boton.className = 'admin-hamburger';
    boton.setAttribute('aria-label', 'Abrir men&uacute; de administraci&oacute;n');
    boton.setAttribute('aria-expanded', 'false');
    boton.innerHTML = '<i class="fa-solid fa-bars"></i>';

    const capa = document.createElement('button');
    capa.type = 'button';
    capa.className = 'admin-menu-overlay';
    capa.setAttribute('aria-label', 'Cerrar men&uacute;');

    const cerrar = () => {
        sidebar.classList.remove('abierta');
        capa.classList.remove('visible');
        boton.setAttribute('aria-expanded', 'false');
        boton.innerHTML = '<i class="fa-solid fa-bars"></i>';
    };

    boton.addEventListener('click', () => {
        const abierto = sidebar.classList.toggle('abierta');
        capa.classList.toggle('visible', abierto);
        boton.setAttribute('aria-expanded', String(abierto));
        boton.innerHTML = abierto ? '<i class="fa-solid fa-xmark"></i>' : '<i class="fa-solid fa-bars"></i>';
    });
    capa.addEventListener('click', cerrar);
    encabezado.prepend(boton);
    dashboard.append(capa);
});


