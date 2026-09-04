const formulario = document.querySelector('#form-testimonio');
const estrellas = [...document.querySelectorAll('.estrella')];
const calificacion = document.querySelector('#calificacion');
const lista = document.querySelector('#testimonios-publicados');
const mensaje = document.querySelector('#mensaje-formulario');

function pintarEstrellas(valor) {
    estrellas.forEach((estrella) => estrella.classList.toggle('activa', Number(estrella.dataset.valor) <= valor));
}

function tarjeta(testimonio) {
    const item = document.createElement('article');
    item.className = 'testimonio-publicado';
    const inicial = (testimonio.nombre_cliente || 'C').charAt(0).toUpperCase();
    item.innerHTML = `<div class="autor-testimonio"><span class="inicial-autor">${inicial}</span><div><h3></h3><span>Cliente de Mister Club</span></div></div><p class="estrellas-publicadas"></p><p class="texto-testimonio"></p>`;
    item.querySelector('h3').textContent = testimonio.nombre_cliente;
    item.querySelector('.estrellas-publicadas').textContent = '&#9733;'.repeat(testimonio.calificacion) + '&#9734;'.repeat(5 - testimonio.calificacion);
    item.querySelector('.texto-testimonio').textContent = testimonio.comentario;
    return item;
}

async function mostrarTestimonios() {
    try {
        const result = await api('data.php?resource=testimonios');
        lista.replaceChildren(...result.data.slice(0, 6).map(tarjeta));
    } catch (error) { lista.textContent = 'No se pudieron cargar los testimonios.'; }
}

estrellas.forEach((estrella) => estrella.addEventListener('click', () => {
    calificacion.value = estrella.dataset.valor;
    pintarEstrellas(Number(calificacion.value));
}));

formulario?.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (!calificacion.value) { mensaje.textContent = 'Selecciona una calificaci&oacute;n de 1 a 5 estrellas.'; return; }
    const data = new FormData(formulario);
    try {
        await api('data.php?resource=testimonios', { method: 'POST', body: JSON.stringify({ nombre_cliente: data.get('nombre').trim(), comentario: data.get('comentario').trim(), calificacion: Number(calificacion.value) }) });
        formulario.reset(); pintarEstrellas(0);
        mensaje.textContent = 'Gracias. Tu testimonio fue enviado para revisi&oacute;n.';
        mostrarTestimonios();
    } catch (error) { mensaje.textContent = error.message; }
});

mostrarTestimonios();


