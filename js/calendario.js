const eventos={

1:{

titulo:"D&iacute;a del Trabajador",

fecha:"01 Mayo",

imagen:"img/eventos/trabajador.jpg",

descripcion:"Celebra con la mejor m&uacute;sica, promociones especiales y un ambiente inolvidable.",

lista:[

"DJ Invitado",
"Promoci&oacute;n 2x40",
"Ingreso desde las 7:00 PM"

]

},

10:{

titulo:"Noche Reggaet&oacute;n",

fecha:"10 Mayo",

imagen:"img/eventos/reggaeton.jpg",

descripcion:"Disfruta de la mejor m&uacute;sica urbana junto a nuestros DJs invitados.",

lista:[

"Zona VIP",
"Happy Hour",
"Shows en vivo"

]

},

25:{

titulo:"DJ Internacional",

fecha:"25 Mayo",

imagen:"img/eventos/dj.jpg",

descripcion:"Una noche con invitados especiales y el mejor ambiente.",

lista:[

"Entradas limitadas",
"Show de luces",
"C&oacute;cteles exclusivos"

]

}

};

const dias=document.querySelectorAll(".dia");

const panel=document.getElementById("eventoInfo");

dias.forEach(dia=>{

dia.addEventListener("click",()=>{

dias.forEach(d=>d.classList.remove("activo"));

dia.classList.add("activo");

const numero=dia.dataset.dia;

if(eventos[numero]){

let e=eventos[numero];

panel.innerHTML=`

<img src="${e.imagen}">

<h2>${e.titulo}</h2>

<h3>${e.fecha}</h3>

<p>${e.descripcion}</p>

<ul>

${e.lista.map(item=>`<li>${item}</li>`).join("")}

</ul>

<a href="reservas.html" class="btn-evento">

Reservar Ahora

</a>

`;

}else{

panel.innerHTML=`

<div class="evento-vacio">

<i class="fa-solid fa-calendar-xmark"></i>

<h2>No hay eventos</h2>

<p>

No existe ning&uacute;n evento programado para este d&iacute;a.

Consulta otra fecha o revisa nuestras pr&oacute;ximas celebraciones.

</p>

</div>

`;

}

});

});

