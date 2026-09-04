document.querySelectorAll('.navbar').forEach((navbar) => {
    const menu = navbar.querySelector('.menu');
    let boton = navbar.querySelector('.hamburger');

    if (!menu) return;

    if (!boton) {
        boton = document.createElement('button');
        boton.type = 'button';
        boton.className = 'hamburger';
        boton.setAttribute('aria-label', 'Abrir men&uacute; de navegaci&oacute;n');
        boton.setAttribute('aria-expanded', 'false');
        boton.innerHTML = '<i class="fa-solid fa-bars"></i>';
        navbar.append(boton);
    }

    if (boton.dataset.hamburgerReady) return;
    boton.dataset.hamburgerReady = 'true';

    boton.addEventListener('click', () => {
        const abierto = menu.classList.toggle('active');
        boton.setAttribute('aria-expanded', String(abierto));
        boton.setAttribute('aria-label', abierto ? 'Cerrar men&uacute; de navegaci&oacute;n' : 'Abrir men&uacute; de navegaci&oacute;n');
        boton.innerHTML = abierto
            ? '<i class="fa-solid fa-xmark"></i>'
            : '<i class="fa-solid fa-bars"></i>';
    });

    menu.querySelectorAll('a').forEach((enlace) => {
        enlace.addEventListener('click', () => {
            menu.classList.remove('active');
            boton.setAttribute('aria-expanded', 'false');
            boton.setAttribute('aria-label', 'Abrir menu de navegacion');
            boton.innerHTML = '<i class="fa-solid fa-bars"></i>';
        });
    });

    navbar.append(boton);
});

