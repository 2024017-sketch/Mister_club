const GALERIA_API = '../api/data.php?resource=galeria';
let imagenes = [];
let indice = 0;

function rutaImagen(path) {
    const value = String(path || '').trim();
    if (!value) return '';
    if (/^(https?:)?\/\//i.test(value) || value.startsWith('../') || value.startsWith('/')) return value;
    return `../${value}`;
}

async function galeriaRequest(url = GALERIA_API, options = {}) {
    const response = await fetch(url, {
        credentials: 'same-origin',
        ...options,
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'No se pudo completar la accion.');
    return data;
}

async function cargarGaleria() {
    const result = await galeriaRequest();
    return result.data || [];
}

function refrescarImagenesModal() {
    imagenes = [...document.querySelectorAll('.grid-galeria img')];
}

function abrirImagen(img) {
    refrescarImagenesModal();
    indice = imagenes.indexOf(img);
    if (indice < 0) indice = 0;

    const modal = document.getElementById('modalGaleria');
    const grande = document.getElementById('imagenGrande');
    if (!modal || !grande) return;

    modal.style.display = 'flex';
    grande.src = img.src;
}

function cerrarGaleria() {
    const modal = document.getElementById('modalGaleria');
    if (modal) modal.style.display = 'none';
}

function cambiarImagen(direccion) {
    refrescarImagenesModal();
    if (!imagenes.length) return;

    indice += direccion;
    if (indice < 0) indice = imagenes.length - 1;
    if (indice >= imagenes.length) indice = 0;

    const grande = document.getElementById('imagenGrande');
    if (grande) grande.src = imagenes[indice].src;
}

function pintarGaleriaPublica(items) {
    const grid = document.querySelector('.grid-galeria');
    if (!grid) return;

    if (!items.length) {
        grid.innerHTML = '<p class="galeria-vacia">Aun no hay imagenes publicadas.</p>';
        return;
    }

    grid.innerHTML = items.map((foto) => `
        <img src="${rutaImagen(foto.imagen)}" alt="Foto de Mister Club" loading="lazy">
    `).join('');

    grid.querySelectorAll('img').forEach((img) => {
        img.addEventListener('click', () => abrirImagen(img));
    });
    refrescarImagenesModal();
}

function pintarGaleriaAdmin(items) {
    const grid = document.querySelector('.galeria-admin');
    if (!grid) return;

    if (!items.length) {
        grid.innerHTML = '<p class="sin-resultados">No hay imagenes publicadas.</p>';
        return;
    }

    grid.innerHTML = items.map((foto) => `
        <article class="foto-admin">
            <img src="${rutaImagen(foto.imagen)}" alt="Imagen publicada">
            <div class="acciones-foto">
                <button class="btn-eliminar-galeria" type="button" data-id="${foto.id}">
                    Eliminar
                </button>
            </div>
        </article>
    `).join('');
}

function actualizarTotalFotos(total) {
    const totalNode = document.querySelector('[data-galeria-total]');
    if (totalNode) totalNode.textContent = total;
}

async function recargarGaleria() {
    const items = await cargarGaleria();
    pintarGaleriaPublica(items);
    pintarGaleriaAdmin(items);
    actualizarTotalFotos(items.length);
}

function activarSubidaGaleria() {
    const form = document.querySelector('.subir-imagen');
    if (!form) return;

    form.addEventListener('submit', async (event) => {
        event.preventDefault();
        const input = form.querySelector('input[type="file"]');
        const file = input?.files?.[0];
        if (!file) {
            alert('Selecciona una imagen.');
            return;
        }

        const formData = new FormData();
        formData.append('imagen', file);

        try {
            await galeriaRequest(GALERIA_API, { method: 'POST', body: formData });
            form.reset();
            await recargarGaleria();
        } catch (error) {
            alert(error.message);
        }
    });
}

function activarEliminacionGaleria() {
    document.addEventListener('click', async (event) => {
        const boton = event.target.closest('.btn-eliminar-galeria');
        if (!boton) return;

        const id = boton.dataset.id;
        if (!id) return;
        if (!confirm('Deseas eliminar esta imagen?')) return;

        try {
            await galeriaRequest(`${GALERIA_API}&id=${id}`, { method: 'DELETE' });
            await recargarGaleria();
        } catch (error) {
            alert(error.message);
        }
    });
}

window.addEventListener('click', (event) => {
    const modal = document.getElementById('modalGaleria');
    if (modal && event.target === modal) cerrarGaleria();
});

recargarGaleria().catch((error) => {
    const grid = document.querySelector('.grid-galeria') || document.querySelector('.galeria-admin');
    if (grid) grid.innerHTML = `<p class="sin-resultados">${error.message}</p>`;
});
activarSubidaGaleria();
activarEliminacionGaleria();
