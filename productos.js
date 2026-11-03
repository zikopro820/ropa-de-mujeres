/* =========================================================
   NARA Atelier — LISTA DE PRODUCTOS
   Aquí agregas, quitas o cambias productos. Cada producto
   aparece solo en la tienda, en su página y en el carrito.

   Campos:
   id      → número único (no repetir)
   nombre  → nombre del producto
   cat     → vestidos | tops | sastreria | abrigos | accesorios
   precio  → precio en soles (usa punto para decimales)
   antes   → precio anterior si está en oferta (o null)
   foto    → enlace de la foto
   badge   → "Nuevo", "Oferta", "Más vendido" o ""
   tallas  → lista de tallas disponibles
   color   → color de la prenda
   desc    → descripción
   ========================================================= */
const FOTO = id => "https://images.unsplash.com/photo-" + id + "?auto=format&fit=crop&w=900&q=80";
const TALLAS = ["XS", "S", "M", "L", "XL"];

const CATEGORIAS = {
  vestidos:   "Vestidos",
  tops:       "Blusas y tops",
  sastreria:  "Sastrería",
  abrigos:    "Abrigos",
  accesorios: "Accesorios"
};

const PRODUCTOS = [
  { id: 1, nombre: "Vestido satinado Caramelo", cat: "vestidos", precio: 189, antes: null, color: "Caramelo",
    foto: FOTO("1704775990154-b87562565d4c"), badge: "Nuevo", tallas: TALLAS,
    desc: "Vestido midi de satén con caída fluida y tirantes finos. Brillo suave que funciona de día con sandalias y de noche con tacos." },
  { id: 2, nombre: "Vestido fruncido Cacao", cat: "vestidos", precio: 169, antes: null, color: "Cacao",
    foto: FOTO("1704775991121-a7c5423ef8d3"), badge: "Más vendido", tallas: TALLAS,
    desc: "Vestido ceñido con fruncido lateral que estiliza la figura. Tela con elasticidad para moverte con total comodidad." },
  { id: 3, nombre: "Vestido de volantes Arena", cat: "vestidos", precio: 159, antes: 199, color: "Arena",
    foto: FOTO("1785348056988-c4d7c2248248"), badge: "Oferta", tallas: ["S", "M", "L"],
    desc: "Vestido largo de capas con volantes y lazos en los hombros. Ligero, fresco y romántico." },
  { id: 4, nombre: "Vestido de gala Marfil", cat: "vestidos", precio: 349, antes: null, color: "Marfil",
    foto: FOTO("1776841818483-700f88aace44"), badge: "", tallas: ["XS", "S", "M", "L"],
    desc: "Vestido largo de noche con silueta envolvente. Pensado para matrimonios, galas y ocasiones especiales." },
  { id: 5, nombre: "Vestido Granate", cat: "vestidos", precio: 179, antes: null, color: "Granate",
    foto: FOTO("1764265148862-7ee72a4fb367"), badge: "Nuevo", tallas: TALLAS,
    desc: "Vestido en tono granate profundo, de corte limpio y elegante. Un básico de temporada que no pasa de moda." },
  { id: 6, nombre: "Vestido bicolor manga larga", cat: "vestidos", precio: 199, antes: null, color: "Negro y blanco",
    foto: FOTO("1601597565151-70c4020dc0e1"), badge: "", tallas: TALLAS,
    desc: "Vestido de manga larga con contraste blanco y negro. Sofisticado para la oficina o una cena." },
  { id: 7, nombre: "Vestido negro Esencial", cat: "vestidos", precio: 149, antes: 179, color: "Negro",
    foto: FOTO("1586079615844-c0abfb04dc79"), badge: "Oferta", tallas: TALLAS,
    desc: "El vestido negro que toda mujer necesita: sin mangas, línea recta y tela de excelente caída." },
  { id: 8, nombre: "Top sin mangas Blanco", cat: "tops", precio: 79, antes: null, color: "Blanco",
    foto: FOTO("1509631179647-0177331693ae"), badge: "", tallas: TALLAS,
    desc: "Top de algodón pima sin mangas, de cuello alto y calce perfecto. Combínalo con sastrería o jeans." },
  { id: 9, nombre: "Blusa manga larga Noir", cat: "tops", precio: 99, antes: null, color: "Negro",
    foto: FOTO("1590131222139-91ba5992e4ed"), badge: "Más vendido", tallas: TALLAS,
    desc: "Blusa negra de manga larga con tela suave y opaca. Elegante y fácil de combinar." },
  { id: 10, nombre: "Blazer clásico Negro", cat: "sastreria", precio: 259, antes: null, color: "Negro",
    foto: FOTO("1612731486606-2614b4d74921"), badge: "Nuevo", tallas: TALLAS,
    desc: "Blazer de corte recto con hombros estructurados y forro interior. La pieza clave de un clóset elegante." },
  { id: 11, nombre: "Traje sastre Oxford", cat: "sastreria", precio: 329, antes: 389, color: "Gris",
    foto: FOTO("1613915617430-8ab0fd7c6baf"), badge: "Oferta", tallas: ["S", "M", "L", "XL"],
    desc: "Conjunto de blazer y pantalón recto de tiro alto. Se pueden usar juntos o por separado." },
  { id: 12, nombre: "Blazer oversize Ciudad", cat: "sastreria", precio: 279, antes: null, color: "Negro",
    foto: FOTO("1610765431323-d88c88a2b2c8"), badge: "", tallas: TALLAS,
    desc: "Blazer amplio de inspiración masculina, con bolsillos con tapa. Moderno y con mucha actitud." },
  { id: 13, nombre: "Abrigo largo Noche", cat: "abrigos", precio: 389, antes: 449, color: "Negro",
    foto: FOTO("1731589802397-6a1088d63630"), badge: "Oferta", tallas: ["S", "M", "L"],
    desc: "Abrigo largo de paño con solapa ancha y cinturón. Abriga sin perder elegancia." },
  { id: 14, nombre: "Set de pulseras doradas", cat: "accesorios", precio: 89, antes: null, color: "Dorado",
    foto: FOTO("1675113627456-c280ed77fdb9"), badge: "", tallas: ["Única"],
    desc: "Tres pulseras de cadena con baño de oro, para usar juntas o por separado. Resistentes al agua." },
  { id: 15, nombre: "Anillos dorados Statement", cat: "accesorios", precio: 69, antes: null, color: "Dorado",
    foto: FOTO("1764181237984-70ac5f211b06"), badge: "Nuevo", tallas: ["Única"],
    desc: "Set de anillos gruesos con baño de oro, ajustables. El detalle que transforma cualquier look." },
  { id: 16, nombre: "Aretes de perla Aurora", cat: "accesorios", precio: 79, antes: null, color: "Dorado y perla",
    foto: FOTO("1770721478216-3e5dbbe8dcc2"), badge: "", tallas: ["Única"],
    desc: "Aretes dorados con perlas de agua dulce. Clásicos, delicados y perfectos para regalar." }
];
