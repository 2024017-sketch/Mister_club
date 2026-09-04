const botones = document.querySelectorAll(".btn-detalle");

botones.forEach((boton) => {

    boton.addEventListener("click", () => {

        boton.classList.toggle("activo");

        boton.nextElementSibling.classList.toggle("activo");

    });

});