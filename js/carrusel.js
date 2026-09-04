let slides = document.querySelectorAll(".slide");
let index = 0;

function showSlide() {
    slides.forEach((s, i) => s.classList.toggle("active", i === index));
}

function nextSlide() {
    index = (index + 1) % slides.length;
    showSlide();
}

function prevSlide() {
    index = (index - 1 + slides.length) % slides.length;
    showSlide();
}

// Cambio autom&aacute;tico cada 4 segundos
let intervalo = setInterval(nextSlide, 4000);

// Reinicia el tiempo cuando el usuario usa las flechas
function reiniciarCarrusel() {
    clearInterval(intervalo);
    intervalo = setInterval(nextSlide, 4000);
}

// Flecha derecha
document.querySelector(".flecha.derecha").addEventListener("click", () => {
    nextSlide();
    reiniciarCarrusel();
});

// Flecha izquierda
document.querySelector(".flecha.izquierda").addEventListener("click", () => {
    prevSlide();
    reiniciarCarrusel();
});
