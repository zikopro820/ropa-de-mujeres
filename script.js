/* =========================================================
   NARA — Funciones de la tienda
   ⚠️ Ya no se cambian datos aquí: el WhatsApp, los envíos, los
   pagos, los banners y los productos se editan en el PANEL.
   ========================================================= */
let PRODUCTOS = [], CATEGORIAS = {}, AJ = {};

/* ---------- Utilidades ---------- */
const $  = (s, c = document) => c.querySelector(s);
const $$ = (s, c = document) => [...c.querySelectorAll(s)];
const params = new URLSearchParams(location.search);
const TIENDA = () => AJ.nombre || "NARA";
const soles = n => "S/ " + (+n || 0).toFixed(2);
const waLink = txt => "https://wa.me/" + String(AJ.whatsapp || "").replace(/\D/g, "") + "?text=" + encodeURIComponent(txt);
const getProd = id => PRODUCTOS.find(p => String(p.id) === String(id));
const off = p => p.antes && +p.antes > +p.precio ? Math.round((1 - p.precio / p.antes) * 100) : 0;
const rating = p => +p.rating || 4.8;
const stars = r => "★★★★★".slice(0, Math.round(r)) + "☆☆☆☆☆".slice(0, 5 - Math.round(r));
const foto = (p, w) => String(p.foto || "").replace(/([?&])w=\d+/, "$1w=" + w);
const catNombre = k => (CATEGORIAS[k] || {}).nombre || "";
const norm = s => String(s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
const conSpan = t => esc(t || "").replace(/\*(.+?)\*/g, "<b>$1</b>");
/* Tallas y stock: cada producto guarda su stock POR TALLA, ej. { S: 3, M: 5, L: 0 } */
const tallasDe = p => (Array.isArray(p.tallas) && p.tallas.length ? p.tallas : ["Única"]);
const conStock = p => !!p.stock && typeof p.stock === "object";
const stockT = (p, t) => conStock(p) ? Math.max(0, +p.stock[t] || 0) : 999;
const hayStock = p => tallasDe(p).some(t => stockT(p, t) > 0);
const nombreItem = (p, t) => p.nombre + (t && t !== "Única" ? " · Talla " + t : "");
const ICO = {
  bolt: '<svg viewBox="0 0 24 24"><path d="M13 2L4 14h7l-1 8 9-12h-7z"/></svg>',
  cart: '<svg viewBox="0 0 24 24"><path d="M6 6h15l-1.5 9h-12z"/><path d="M6 6L5 3H2"/><circle cx="9" cy="20" r="1.5"/><circle cx="18" cy="20" r="1.5"/></svg>',
  check: '<svg viewBox="0 0 24 24"><path d="M5 12l5 5L20 7"/></svg>',
  down: '<svg viewBox="0 0 24 24"><path d="M12 3v12M7 10l5 5 5-5M4 21h16"/></svg>',
  clock: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>',
  box: '<svg viewBox="0 0 24 24"><path d="M3 7l9-4 9 4v10l-9 4-9-4zM3 7l9 4 9-4M12 11v10"/></svg>',
  truck: '<svg viewBox="0 0 24 24"><path d="M1 4h14v12H1zM15 8h4l3 3v5h-7"/><circle cx="5.5" cy="18.5" r="2"/><circle cx="18.5" cy="18.5" r="2"/></svg>',
  store: '<svg viewBox="0 0 24 24"><path d="M3 9l1.5-5h15L21 9M3 9v11h18V9M3 9h18M9 20v-6h6v6"/></svg>'
};

/* ---------- Carrito (se guarda en el navegador) ---------- */
const CART_KEY = "nara_mk_cart";
let memoryCart = [];
function readCart() { try { return JSON.parse(localStorage.getItem(CART_KEY)) || []; } catch (e) { return memoryCart; } }
function saveCart(cart) { memoryCart = cart; try { localStorage.setItem(CART_KEY, JSON.stringify(cart)); } catch (e) {} updateBadge(); }
const mismo = (i, id, t) => String(i.id) === String(id) && i.talla === t;
function addToCart(id, talla, qty = 1) {
  const p = getProd(id); if (!p) return false;
  const cart = readCart(), it = cart.find(i => mismo(i, id, talla)), ya = it ? it.qty : 0, max = stockT(p, talla);
  if (max <= 0) { toast(`La talla ${talla} está agotada`, true); return false; }
  if (ya + qty > max) { qty = max - ya; if (qty <= 0) { toast(`Solo quedan ${max} en talla ${talla}`, true); return false; } }
  if (it) it.qty += qty; else cart.push({ id: String(id), talla, qty });
  saveCart(cart); toast("✓ Agregado al carrito"); return true;
}
/* Comprar ahora: deja la prenda en el carrito y lleva directo a pagar */
function comprarAhora(id, talla, qty = 1) {
  const p = getProd(id); if (!p || stockT(p, talla) <= 0) return;
  const cart = readCart(), it = cart.find(i => mismo(i, id, talla)), q = Math.max(1, Math.min(qty, stockT(p, talla)));
  if (it) it.qty = Math.max(it.qty, q); else cart.push({ id: String(id), talla, qty: q });
  memoryCart = cart; try { localStorage.setItem(CART_KEY, JSON.stringify(cart)); } catch (e) {}
  location.href = "carrito";
}
const cartValido = () => readCart().filter(i => getProd(i.id) && tallasDe(getProd(i.id)).includes(i.talla));
function updateBadge() { const n = cartValido().reduce((s, i) => s + i.qty, 0); $$(".cart-count").forEach(el => { el.textContent = n || ""; el.dataset.n = n; }); }

/* ---------- Aviso flotante ---------- */
let toastTimer;
function toast(msg, sinLink) {
  let t = $(".toast"); if (!t) { t = document.createElement("div"); t.className = "toast"; t.setAttribute("role", "status"); document.body.appendChild(t); }
  t.innerHTML = "<span></span>" + (sinLink ? "" : "<a href='carrito'>Ver carrito</a>"); t.firstChild.textContent = msg; t.classList.add("show");
  clearTimeout(toastTimer); toastTimer = setTimeout(() => t.classList.remove("show"), 2600);
}

/* ---------- Tarjetas de producto ---------- */
function tagFor(p) {
  if (!hayStock(p)) return `<span class="tag gray">Agotado</span>`;
  if (p.flash) return `<span class="tag red">Flash</span>`;
  if (p.nuevo) return `<span class="tag">Nuevo</span>`;
  if (off(p) >= 40) return `<span class="tag cyan">-${off(p)}% OFF</span>`;
  return off(p) ? `<span class="tag">Oferta</span>` : "";
}
function compraCard(p, txtAdd = "Agregar al carrito") {
  const ts = tallasDe(p), ok = hayStock(p);
  return `${ts.length > 1 ? `<div class="c-sizes" role="group" aria-label="Elige tu talla">${ts.map(t => `<button type="button" class="c-size" data-t="${esc(t)}" ${stockT(p, t) > 0 ? "" : "disabled title='Agotado'"}>${esc(t)}</button>`).join("")}</div><p class="c-warn">Elige tu talla 👆</p>` : ""}
    <button class="btn btn-blue btn-block add" ${ok ? "" : "disabled"}>${ok ? txtAdd : "Agotado"}</button>
    <button class="btn btn-dark btn-block buynow" ${ok ? "" : "disabled"}>${ICO.bolt} Comprar ahora</button>`;
}
function productCard(p) {
  return `
    <article class="card" data-id="${esc(p.id)}">
      <a class="card-img" href="producto?id=${encodeURIComponent(p.id)}">
        ${tagFor(p)}
        <span class="rate-pill">${rating(p).toFixed(1)}</span>
        <img src="${esc(foto(p, 700))}" alt="${esc(p.nombre)}" loading="lazy" onerror="this.style.display='none'">
        ${off(p) ? `<span class="off-bubble">-${off(p)}%</span>` : ""}
      </a>
      <div class="card-body">
        <h3><a href="producto?id=${encodeURIComponent(p.id)}">${esc(p.nombre)}</a></h3>
        <div class="stars">${stars(rating(p))}</div>
        <div class="prices"><strong>${soles(p.precio)}</strong>${p.antes ? `<del>${soles(p.antes)}</del>` : ""}</div>
        ${compraCard(p)}
      </div>
    </article>`;
}
function flashCard(p) {
  const v = Math.min(100, Math.max(0, +p.vendido || 0));
  return `
    <article class="card" data-id="${esc(p.id)}">
      <a class="card-img" href="producto?id=${encodeURIComponent(p.id)}">
        ${hayStock(p) ? `<span class="tag cyan">Flash deal</span>` : `<span class="tag gray">Agotado</span>`}
        <span class="rate-pill">${rating(p).toFixed(1)}</span>
        <img src="${esc(foto(p, 700))}" alt="${esc(p.nombre)}" loading="lazy" onerror="this.style.display='none'">
        ${off(p) ? `<span class="off-bubble">-${off(p)}%</span>` : ""}
      </a>
      <div class="card-body">
        <h3><a href="producto?id=${encodeURIComponent(p.id)}">${esc(p.nombre)}</a></h3>
        <div class="prices"><strong>${soles(p.precio)}</strong>${p.antes ? `<del>${soles(p.antes)}</del>` : ""}</div>
        ${v ? `<div class="sold">${v}% vendido</div><div class="bar"><i style="width:${v}%"></i></div>` : ""}
        ${compraCard(p, "Agregar")}
      </div>
    </article>`;
}
function renderGrid(el, list, fn = productCard) {
  if (!el) return;
  el.innerHTML = list.length ? list.map(fn).join("") : `<div class="empty"><h3>No encontramos productos</h3><p>Prueba con otra búsqueda o quita algún filtro.</p></div>`;
}
/* Clic en tallas y botones de las tarjetas */
document.addEventListener("click", e => {
  const card = e.target.closest(".card[data-id]"); if (!card) return;
  const p = getProd(card.dataset.id); if (!p) return;
  const sz = e.target.closest(".c-size");
  if (sz) { $$(".c-size", card).forEach(b => b.classList.toggle("active", b === sz)); card.classList.remove("need-size"); return; }
  const add = e.target.closest(".add"), buy = e.target.closest(".buynow"); if (!add && !buy) return;
  const ts = tallasDe(p), talla = ts.length === 1 ? ts[0] : ($(".c-size.active", card) || {}).dataset?.t;
  if (!talla) { card.classList.remove("need-size"); void card.offsetWidth; card.classList.add("need-size"); return; }
  if (buy) comprarAhora(p.id, talla, 1); else addToCart(p.id, talla, 1);
});

/* ---------- Marca: logo, textos, menú y banners (se editan en el panel) ---------- */
function aplicarMarca() {
  const nombre = TIENDA();
  document.title = document.title.replace(/NARA/g, nombre);
  $$(".logo").forEach(a => {
    a.setAttribute("aria-label", nombre + " inicio");
    a.innerHTML = AJ.logo ? `<img class="logo-img" src="${esc(AJ.logo)}" alt="${esc(nombre)}">` : `<span class="logo-mark">${esc((AJ.logoLetra || nombre).charAt(0))}</span><span class="logo-text">${esc(nombre)}</span>`;
  });
  if (AJ.logo) { const l = $('link[rel="icon"]'); if (l) { l.href = AJ.logo; l.type = "image/png"; } }
  if (AJ.topbar && $(".topbar .container > span")) $(".topbar .container > span").innerHTML = conSpan(AJ.topbar);
  // Menú y buscador con las categorías del panel
  const cats = Object.entries(CATEGORIAS), actual = params.get("cat"), aqui = location.pathname.split("/").pop().replace(".html", "");
  const menu = $("#menu");
  if (menu) menu.innerHTML = `<li><a href="./"${!aqui || aqui === "index" ? ' class="active"' : ""}>Inicio</a></li>` +
    cats.filter(([, c]) => c.menu !== false).map(([k, c]) => `<li><a href="catalogo?cat=${encodeURIComponent(k)}"${k === actual ? ' class="active"' : ""}>${esc(c.nombre)}</a></li>`).join("") +
    `<li><a href="catalogo?ofertas=1" class="hot">Ofertas</a></li><li class="m-only"><a href="mis-compras">Mis compras</a></li>`;
  const sel = $("#catSelect");
  if (sel) { sel.innerHTML = `<option value="">TODAS LAS CATEGORÍAS</option>` + cats.map(([k, c]) => `<option value="${esc(k)}"${k === actual ? " selected" : ""}>${esc(c.nombre)}</option>`).join(""); }
  // WhatsApp y contacto
  $$(".wa-link").forEach(a => { a.href = waLink(a.dataset.msg || "Hola " + nombre + " 👋 Quiero información sobre sus productos."); a.target = "_blank"; a.rel = "noopener"; });
  $$(".js-tel").forEach(a => a.textContent = (a.dataset.pre || "") + (AJ.telefono || "+" + AJ.whatsapp));
  $$(".js-dir").forEach(x => x.textContent = AJ.direccion || "");
  $$(".js-hor").forEach(x => x.textContent = AJ.horario || "");
  $$(".js-email").forEach(x => x.textContent = AJ.email || "");
  const redes = AJ.redes || {}; let alguna = false;
  $$(".socials a").forEach(a => { const u = redes[(a.getAttribute("aria-label") || "").toLowerCase()]; if (u) { a.href = u; a.target = "_blank"; a.rel = "noopener"; alguna = true; } else a.hidden = true; });
  $$(".socials").forEach(s => { s.hidden = !alguna; const h = s.previousElementSibling; if (h && h.tagName === "H4") h.hidden = !alguna; });
  const metodos = [AJ.pagoYape !== false && `<span class="yape">Yape</span>`, AJ.pagoPlin !== false && `<span class="plin">Plin</span>`, AJ.pagoTransf !== false && (AJ.cuentas || []).length && `<span class="bank">Transferencia</span>`, AJ.contraEntrega !== false && `<span class="ce">Contra entrega</span>`].filter(Boolean);
  $$(".pay-logos").forEach(d => d.innerHTML = metodos.join(""));
  const textoPago = [AJ.pagoYape !== false && "Yape", AJ.pagoPlin !== false && "Plin", AJ.pagoTransf !== false && "transferencia", AJ.contraEntrega !== false && "contra entrega"].filter(Boolean);
  const gratis = AJ.envioGratisDesde ? `Desde ${soles(AJ.envioGratisDesde).replace(".00", "")}` : "A todo el Perú";
  $$(".perk").forEach(pk => { const s = $("strong", pk), sp = $("span", pk); if (!s || !sp) return;
    if (/envío/i.test(s.textContent)) { s.textContent = AJ.envioGratisDesde ? "Envío gratis" : "Envíos"; sp.textContent = gratis; }
    if (/cambios/i.test(s.textContent)) sp.textContent = `Hasta ${AJ.cambiosDias || 15} días`;
    if (/pago/i.test(s.textContent)) sp.textContent = textoPago.slice(0, 3).join(", "); });
  $$(".footer-bottom > div:first-child").forEach(d => d.innerHTML = `© <span class="year">${new Date().getFullYear()}</span> ${esc(nombre)} · Moda para mujer. Precios en soles, incluyen IGV.`);
  $$("footer h4").forEach(h => { if (/Acerca de/.test(h.textContent)) h.textContent = "Acerca de " + nombre; });
  // Portada: banners y categorías favoritas
  $$(".slider .slide").forEach((s, i) => { const d = (AJ.slides || [])[i]; if (!d) return;
    const T = $(".slide-text", s); if (d.sub != null) $("small", T).textContent = d.sub; if (d.tit) $("h1,h2", T).textContent = d.tit; if (d.txt != null) $("p", T).textContent = d.txt;
    const b = $(".btn", T); if (d.btn) b.textContent = d.btn; if (d.link) b.href = d.link;
    const bu = $(".burst", s); if (bu && (d.b1 || d.b2)) { $("span", bu).textContent = d.b1 || ""; $("strong", bu).textContent = d.b2 || ""; } else if (bu && d.b1 === "" && d.b2 === "") bu.hidden = true;
    if (d.foto) { const im = $(".slide-media img", s); im.src = d.foto; im.style.display = ""; } });
  const fav = $(".fav-cats"), conFoto = cats.filter(([, c]) => c.foto);
  if (fav && conFoto.length) fav.innerHTML = conFoto.slice(0, 6).map(([k, c]) => `<a href="catalogo?cat=${encodeURIComponent(k)}" class="fav-cat"><div><img src="${esc(c.foto)}" alt="${esc(c.nombre)}" loading="lazy" onerror="this.style.display='none'"></div><strong>${esc(c.nombre)}</strong></a>`).join("");
}

/* ---------- Encabezado: buscador y categorías ---------- */
$("#catSelect")?.addEventListener("change", e => { location.href = e.target.value ? "catalogo?cat=" + encodeURIComponent(e.target.value) : "catalogo"; });
$("#searchForm")?.addEventListener("submit", e => { e.preventDefault(); const q = $("#q").value.trim(); location.href = "catalogo" + (q ? "?q=" + encodeURIComponent(q) : ""); });

/* ---------- Carrusel ---------- */
const slider = $(".slider");
if (slider) {
  const slides = $$(".slide", slider), dots = $(".dots", slider); let cur = 0, timer;
  dots.innerHTML = slides.map((_, i) => `<button aria-label="Banner ${i + 1}"></button>`).join("");
  const go = i => { cur = (i + slides.length) % slides.length; slides.forEach((s, k) => s.classList.toggle("active", k === cur)); $$("button", dots).forEach((d, k) => d.classList.toggle("active", k === cur)); clearInterval(timer); timer = setInterval(() => go(cur + 1), 5000); };
  dots.addEventListener("click", e => { const i = $$("button", dots).indexOf(e.target); if (i >= 0) go(i); });
  $(".prev", slider).addEventListener("click", () => go(cur - 1)); $(".next", slider).addEventListener("click", () => go(cur + 1));
  go(0);
}

/* ---------- Contador de Ofertas Flash (termina a medianoche) ---------- */
const cd = $("#countdown");
if (cd) {
  const pad = n => String(n).padStart(2, "0"), box = v => pad(v).split("").map(d => `<i>${d}</i>`).join("");
  const tick = () => { const now = new Date(), end = new Date(now); end.setHours(24, 0, 0, 0); let s = Math.max(0, Math.floor((end - now) / 1000)); const h = Math.floor(s / 3600); s %= 3600; const m = Math.floor(s / 60); s %= 60;
    cd.innerHTML = `<div><b>${box(h)}</b><small>horas</small></div><span class="sep">:</span><div><b>${box(m)}</b><small>min</small></div><span class="sep">:</span><div><b>${box(s)}</b><small>seg</small></div>`; };
  tick(); setInterval(tick, 1000);
}

/* ---------- Inicio, catálogo y producto ---------- */
function paginas() {
  const disp = PRODUCTOS.filter(hayStock).concat(PRODUCTOS.filter(p => !hayStock(p)));
  const flash = disp.filter(p => p.flash);
  renderGrid($("#flashRow"), flash, flashCard);
  if ($("#flashRow") && !flash.length) $("#flashRow").closest("section").hidden = true;
  renderGrid($("#recommended"), disp.filter(p => p.antes && hayStock(p)).sort((a, b) => off(b) - off(a)).slice(0, 5));
  const nuevos = disp.filter(p => p.nuevo); renderGrid($("#newest"), (nuevos.length ? nuevos : disp).slice(0, 5));

  const grid = $("#catalogGrid");
  if (grid) {
    const state = { cat: params.get("cat") || "todos", q: params.get("q") || "", max: 0, talla: "", ofertas: params.get("ofertas") === "1", flash: params.get("flash") === "1", order: "relevancia" };
    const tope = Math.max(100, Math.ceil(Math.max(0, ...PRODUCTOS.map(p => +p.precio || 0)) / 10) * 10); state.max = tope;
    const r = $("#maxPrice"); r.max = tope; r.value = tope; $("#maxVal").textContent = "S/ " + tope;
    const cats = $("#catFilters");
    cats.innerHTML = [["todos", "Todas", PRODUCTOS.length]].concat(Object.entries(CATEGORIAS).map(([k, c]) => [k, c.nombre, PRODUCTOS.filter(p => p.cat === k).length]))
      .map(([k, v, n]) => `<label class="filter-opt"><input type="radio" name="cat" value="${esc(k)}"${k === state.cat ? " checked" : ""}> ${esc(v)}<span>${n}</span></label>`).join("");
    const TALLAS = [...new Set(PRODUCTOS.flatMap(tallasDe))];
    if ($("#tallaFilters")) $("#tallaFilters").innerHTML = TALLAS.map(t => `<button type="button" class="size sm" data-ft="${esc(t)}">${esc(t)}</button>`).join("");
    $("#q") && ($("#q").value = state.q);
    $("#onlyOffers").checked = state.ofertas; $("#onlyFlash").checked = state.flash;
    if (CATEGORIAS[state.cat]) $("#pageTitle").textContent = catNombre(state.cat);
    if (state.flash) $("#pageTitle").textContent = "Ofertas Flash";
    if (state.ofertas) $("#pageTitle").textContent = "Ofertas";
    function draw() {
      let list = PRODUCTOS.filter(p => (state.cat === "todos" || p.cat === state.cat) && +p.precio <= state.max && (!state.ofertas || p.antes) && (!state.flash || p.flash) &&
        (!state.talla || (tallasDe(p).includes(state.talla) && stockT(p, state.talla) > 0)) && norm(p.nombre + " " + (p.color || "") + " " + catNombre(p.cat)).includes(norm(state.q)));
      list = list.filter(hayStock).concat(list.filter(p => !hayStock(p)));
      if (state.order === "menor") list.sort((a, b) => a.precio - b.precio);
      if (state.order === "mayor") list.sort((a, b) => b.precio - a.precio);
      if (state.order === "descuento") list.sort((a, b) => off(b) - off(a));
      $("#resultCount").innerHTML = `<b>${list.length}</b> productos` + (state.q ? ` para "<b>${esc(state.q)}</b>"` : "") + (state.talla ? ` en talla <b>${esc(state.talla)}</b>` : "");
      renderGrid(grid, list);
    }
    cats.addEventListener("change", e => { state.cat = e.target.value; $("#pageTitle").textContent = state.cat === "todos" ? "Toda la tienda" : catNombre(state.cat); draw(); });
    $("#tallaFilters")?.addEventListener("click", e => { const b = e.target.closest("[data-ft]"); if (!b) return; state.talla = state.talla === b.dataset.ft ? "" : b.dataset.ft; $$("[data-ft]").forEach(x => x.classList.toggle("active", x.dataset.ft === state.talla)); draw(); });
    r.addEventListener("input", e => { state.max = Number(e.target.value); $("#maxVal").textContent = "S/ " + state.max; draw(); });
    $("#onlyOffers").addEventListener("change", e => { state.ofertas = e.target.checked; draw(); });
    $("#onlyFlash").addEventListener("change", e => { state.flash = e.target.checked; draw(); });
    $("#order").addEventListener("change", e => { state.order = e.target.value; draw(); });
    $("#filterToggle").addEventListener("click", () => $(".filters").classList.toggle("open"));
    draw();
  }

  const pdp = $("#pdp");
  if (pdp) {
    const p = getProd(params.get("id")) || PRODUCTOS[0]; if (!p) return;
    const ts = tallasDe(p); let talla = ts.length === 1 && stockT(p, ts[0]) > 0 ? ts[0] : null, qty = 1;
    document.title = p.nombre + " | " + TIENDA(); $("#crumbName").textContent = p.nombre;
    const pagos = [AJ.pagoYape !== false && "Yape", AJ.pagoPlin !== false && "Plin", AJ.pagoTransf !== false && "transferencia", AJ.contraEntrega !== false && "contra entrega"].filter(Boolean).join(", ");
    pdp.innerHTML = `
      <div class="pdp-gal"><div class="pdp-img" id="galMain" title="Ver en grande">${tagFor(p)}<img id="galImg" src="${esc(foto(p, 1200))}" alt="${esc(p.nombre)}" onerror="this.style.visibility='hidden'">
        ${off(p) ? `<span class="off-bubble">-${off(p)}%</span>` : ""}<button class="gal-nav prev" id="galPrev" aria-label="Foto anterior" hidden>‹</button><button class="gal-nav next" id="galNext" aria-label="Foto siguiente" hidden>›</button><span class="gal-count" id="galCount" hidden></span></div>
        <div class="pdp-thumbs" id="galThumbs"></div></div>
      <div>
        <a class="pdp-cat" href="catalogo?cat=${encodeURIComponent(p.cat)}">${esc(catNombre(p.cat))}</a>
        <h1>${esc(p.nombre)}</h1>
        <div class="stars">${stars(rating(p))} <span>${rating(p).toFixed(1)} de 5</span></div>
        <div class="price-box">
          <div class="prices"><strong>${soles(p.precio)}</strong>${p.antes ? `<del>${soles(p.antes)}</del>` : ""}</div>
          ${p.antes ? `<span class="save">Ahorras ${soles(p.antes - p.precio)}</span>` : ""}
        </div>
        <p class="desc">${esc(p.desc || "")}</p>
        ${p.color ? `<div class="opt-label"><span>Color: ${esc(p.color)}</span></div>` : ""}
        <div class="opt-label"><span>Talla${talla && ts.length === 1 ? ": " + esc(talla) : ""}</span>${ts.length > 1 ? '<a href="guia-de-tallas">Guía de tallas</a>' : ""}</div>
        <div class="sizes">${ts.map(t => { const n = stockT(p, t); return `<button class="size${t === talla ? " active" : ""}${n <= 0 ? " out" : ""}" data-t="${esc(t)}" ${n <= 0 ? "disabled" : ""} title="${n <= 0 ? "Agotado" : ""}">${esc(t)}</button>`; }).join("")}</div>
        <p class="size-warn" id="sizeWarn">Selecciona una talla para continuar.</p>
        <p class="stock-note" id="stockNote">${!hayStock(p) ? "Agotado por ahora. Escríbenos y te avisamos cuando vuelva." : ""}</p>
        <div class="buy-row">
          <div class="qty"><button data-q="-1" aria-label="Menos">−</button><span id="qty">1</span><button data-q="1" aria-label="Más">+</button></div>
          <button class="btn btn-blue" id="addBtn" ${hayStock(p) ? "" : "disabled"}>${ICO.cart} Agregar al carrito</button>
        </div>
        <button class="btn btn-dark btn-block pdp-buy" id="buyNow" ${hayStock(p) ? "" : "disabled"}>${ICO.bolt} Comprar ahora</button>
        <a class="btn btn-green btn-block" id="buyWa" target="_blank" rel="noopener">Consultar por WhatsApp</a>
        <div class="delivery">
          <div>${ICO.truck}<div><b>Envío a domicilio</b><span>${AJ.envioGratisDesde ? `Gratis desde ${soles(AJ.envioGratisDesde)}` : "A todo el Perú"}${AJ.recojo ? " · o recoge en tienda" : ""}</span></div></div>
          <div><svg viewBox="0 0 24 24"><path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5"/></svg><div><b>Cambios fáciles</b><span>Dentro de los ${AJ.cambiosDias || 15} días, sin uso y con etiqueta</span></div></div>
          <div><svg viewBox="0 0 24 24"><rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></svg><div><b>Pago seguro</b><span>${esc(pagos)}</span></div></div>
        </div>
      </div>`;
    const nota = () => { if (!talla) return; const n = stockT(p, talla); $("#stockNote").textContent = conStock(p) && n <= 3 ? `¡Solo quedan ${n} en talla ${talla}!` : ""; };
    const wa = () => $("#buyWa").href = waLink("Hola " + TIENDA() + " 👋 Quiero comprar:\n• " + p.nombre + (p.color ? "\nColor: " + p.color : "") + "\nTalla: " + (talla || "por definir") + "\nCantidad: " + qty + "\nPrecio: " + soles(p.precio * qty));
    wa(); nota();
    $(".sizes", pdp).addEventListener("click", e => { const b = e.target.closest(".size"); if (!b || b.disabled) return; talla = b.dataset.t; $$(".size", pdp).forEach(s => s.classList.toggle("active", s === b)); $("#sizeWarn").style.display = "none";
      qty = Math.min(qty, stockT(p, talla)); $("#qty").textContent = qty; nota(); wa(); });
    $(".qty", pdp).addEventListener("click", e => { const b = e.target.closest("button"); if (!b) return; qty = Math.max(1, Math.min(qty + Number(b.dataset.q), talla ? stockT(p, talla) : 99)); $("#qty").textContent = qty; wa(); });
    const pedirTalla = () => { $("#sizeWarn").style.display = "block"; $(".sizes", pdp).scrollIntoView({ block: "center", behavior: "smooth" }); };
    $("#addBtn").addEventListener("click", () => talla ? addToCart(p.id, talla, qty) : pedirTalla());
    $("#buyNow").addEventListener("click", () => talla ? comprarAhora(p.id, talla, qty) : pedirTalla());
    galeria(p);
    const rel = PRODUCTOS.filter(x => x.cat === p.cat && x.id !== p.id && hayStock(x)).concat(PRODUCTOS.filter(x => x.cat !== p.cat && x.id !== p.id && hayStock(x))).slice(0, 5);
    renderGrid($("#related"), rel);
  }
}

/* ---------- Galería de fotos del producto (hasta 4) ---------- */
async function galeria(p) {
  let l = [foto(p, 1200), ...(await DB.fotosProducto(p.id))].filter(Boolean), i = 0;
  if (l.length < 2) { $("#galThumbs").hidden = true; return; }
  l = l.slice(0, 4);
  const pintar = () => { $("#galImg").src = l[i]; $("#galImg").style.visibility = ""; $("#galCount").textContent = `${i + 1} / ${l.length}`; $$("#galThumbs button").forEach((b, k) => b.classList.toggle("on", k === i)); };
  $("#galThumbs").innerHTML = l.map((f, k) => `<button type="button" aria-label="Foto ${k + 1}"><img src="${esc(f)}" alt="" loading="lazy"></button>`).join("");
  ["galPrev", "galNext", "galCount"].forEach(x => $("#" + x).hidden = false); pintar();
  const mover = d => { i = (i + d + l.length) % l.length; pintar(); };
  $("#galThumbs").addEventListener("click", e => { const b = e.target.closest("button"); if (b) { i = [...b.parentNode.children].indexOf(b); pintar(); } });
  $("#galPrev").addEventListener("click", e => { e.stopPropagation(); mover(-1); }); $("#galNext").addEventListener("click", e => { e.stopPropagation(); mover(1); });
  let x0 = null; const M = $("#galMain");
  M.addEventListener("touchstart", e => x0 = e.touches[0].clientX, { passive: true });
  M.addEventListener("touchend", e => { if (x0 == null) return; const dx = e.changedTouches[0].clientX - x0; if (Math.abs(dx) > 40) mover(dx < 0 ? 1 : -1); x0 = null; });
  M.addEventListener("click", () => {   // pantalla completa
    const g = document.createElement("div"); g.className = "lightbox"; g.setAttribute("role", "dialog"); g.setAttribute("aria-modal", "true");
    const dib = () => g.innerHTML = `<button class="lb-x" aria-label="Cerrar">✕</button><img src="${esc(l[i])}" alt="${esc(p.nombre)}"><button class="lb-p" aria-label="Anterior">‹</button><button class="lb-n" aria-label="Siguiente">›</button><span class="lb-c">${i + 1} / ${l.length}</span>`;
    dib(); document.body.appendChild(g); document.body.style.overflow = "hidden";
    const cerrar = () => { g.remove(); document.body.style.overflow = ""; document.removeEventListener("keydown", kd); pintar(); };
    const kd = e => { if (e.key === "Escape") cerrar(); if (e.key === "ArrowRight") { i = (i + 1) % l.length; dib(); } if (e.key === "ArrowLeft") { i = (i - 1 + l.length) % l.length; dib(); } };
    document.addEventListener("keydown", kd);
    g.addEventListener("click", e => { if (e.target === g || e.target.closest(".lb-x")) return cerrar(); if (e.target.closest(".lb-n")) { i = (i + 1) % l.length; dib(); } if (e.target.closest(".lb-p")) { i = (i - 1 + l.length) % l.length; dib(); } });
    let t0 = null; g.addEventListener("touchstart", e => t0 = e.touches[0].clientX, { passive: true }); g.addEventListener("touchend", e => { if (t0 == null) return; const dx = e.changedTouches[0].clientX - t0; if (Math.abs(dx) > 40) { i = (i + (dx < 0 ? 1 : -1) + l.length) % l.length; dib(); } t0 = null; });
  });
}

/* ---------- Carrito y pago ---------- */
function paginaCarrito() {
  const cartBox = $("#cartBox"); if (!cartBox) return;
  let pago = null;
  const zonas = () => (AJ.zonas || []).filter(z => z && z.n);
  const envioDe = (sub, ent, zona) => { if (ent !== "domicilio") return 0; if (AJ.envioGratisDesde && sub >= +AJ.envioGratisDesde) return 0; const z = zonas().find(x => x.n === zona); return z ? +z.costo || 0 : 0; };
  const estado = () => { const F = $("#checkout"); if (!F) return { ent: "domicilio", zona: "" }; return { ent: (F.querySelector('[name="entrega"]:checked') || {}).value || "domicilio", zona: $("#cZona")?.value || "" }; };
  function totales(cart) {
    const sub = cart.reduce((s, i) => s + getProd(i.id).precio * i.qty, 0), ahorro = cart.reduce((s, i) => { const p = getProd(i.id); return s + (p.antes ? (p.antes - p.precio) * i.qty : 0); }, 0);
    const { ent, zona } = estado(), env = envioDe(sub, ent, zona), G = +AJ.envioGratisDesde || 0, falta = G && ent === "domicilio" ? Math.max(0, G - sub) : 0;
    return { sub, env, total: sub + env, html: `<div class="sum-row"><span>Subtotal (${cart.reduce((s, i) => s + i.qty, 0)} prendas)</span><span>${soles(sub)}</span></div>
      ${ahorro ? `<div class="sum-row save-row"><span>Estás ahorrando</span><span>${soles(ahorro)}</span></div>` : ""}
      <div class="sum-row"><span>Envío</span><span>${ent === "recojo" ? "Gratis (recojo)" : env ? soles(env) : zona || (G && sub >= G) ? "Gratis" : "Elige tu zona"}</span></div>
      ${G && ent === "domicilio" ? `<div class="free-ship">${falta > 0 ? "Te faltan " + soles(falta) + " para el envío gratis" : "¡Tu pedido tiene envío gratis!"}<div class="ship-bar"><i style="width:${Math.min(100, sub / G * 100)}%"></i></div></div>` : ""}
      <div class="sum-row total"><span>Total</span><strong>${soles(sub + env)}</strong></div>` };
  }
  const lista = cart => cart.map((i, idx) => { const p = getProd(i.id), max = stockT(p, i.talla);
    return `<div class="cart-item"><img src="${esc(foto(p, 200))}" alt="${esc(p.nombre)}" onerror="this.style.visibility='hidden'">
      <div><h3><a href="producto?id=${encodeURIComponent(p.id)}">${esc(p.nombre)}</a></h3><small>${p.color ? esc(p.color) + " · " : ""}Talla ${esc(i.talla)} · ${soles(p.precio)} c/u${conStock(p) && max <= 3 ? ` · <b class="low">quedan ${max}</b>` : ""}</small>
        <div class="qty"><button data-idx="${idx}" data-q="-1" aria-label="Menos">−</button><span>${i.qty}</span><button data-idx="${idx}" data-q="1" aria-label="Más">+</button></div></div>
      <div class="cart-right"><strong>${soles(p.precio * i.qty)}</strong><button class="remove" data-rm="${idx}">Eliminar</button></div></div>`; }).join("");
  function drawCart() {
    const cart = cartValido();
    if (!cart.length) { if (!$("#okPedido")) cartBox.innerHTML = `<div class="cart-empty">${ICO.cart}<h2>Tu carrito está vacío</h2><p>Aprovecha nuestras ofertas y encuentra tu próxima prenda favorita.</p><a href="catalogo?ofertas=1" class="btn btn-blue">Ver ofertas</a> <a href="mis-compras" class="btn btn-line">Mis compras</a></div>`; return; }
    if ($("#checkout")) { $("#cartList").innerHTML = lista(cart); const t = totales(cart); $("#cartTotals").innerHTML = t.html; pago && pago.setMonto(t.total); return; }
    const zs = zonas();
    cartBox.innerHTML = `
      <div class="cart-layout">
        <div><div class="cart-list" id="cartList">${lista(cart)}</div><a href="catalogo" class="see-all" style="display:inline-block;margin:14px 4px">← Seguir comprando</a></div>
        <aside class="summary">
          <h2>Resumen de compra</h2>
          <div id="cartTotals"></div>
          <form id="checkout" novalidate style="margin-top:18px">
            <label>Entrega</label>
            <div class="pay-options">
              <label class="pay-opt"><input type="radio" name="entrega" value="domicilio" checked> Envío a domicilio</label>
              ${AJ.recojo ? `<label class="pay-opt"><input type="radio" name="entrega" value="recojo"> Recojo en tienda (gratis)</label>` : ""}
            </div>
            <div id="fDomicilio">
              ${zs.length ? `<label for="cZona">Zona de envío *</label><select id="cZona"><option value="">— Elige tu zona —</option>${zs.map(z => `<option value="${esc(z.n)}">${esc(z.n)} · ${soles(z.costo)}</option>`).join("")}</select>` : ""}
              <label for="cDir">Dirección *</label><input id="cDir" autocomplete="street-address" placeholder="Calle, número, distrito">
              <label for="cRef">Referencia</label><input id="cRef" placeholder="Ej. frente al parque, dpto 302">
            </div>
            <p class="note" id="fRecojo" hidden style="margin:0 0 14px">📍 Recoges en: <b>${esc(AJ.direccion || "")}</b> · ${esc(AJ.horario || "")}</p>
            <div class="form-row"><div><label for="cNombre">Nombre *</label><input id="cNombre" autocomplete="name" placeholder="Tu nombre"></div>
              <div><label for="cCel">Celular (WhatsApp) *</label><input id="cCel" type="tel" inputmode="tel" autocomplete="tel" placeholder="984 713 695"></div></div>
            <div class="form-row"><div><label for="cComp">Comprobante</label><select id="cComp"><option>Boleta</option><option>Factura</option></select></div>
              <div><label for="cDoc">DNI o RUC</label><input id="cDoc" inputmode="numeric" maxlength="11" placeholder="Opcional para boleta"></div></div>
            <label>Forma de pago</label>
            <div id="pagoBox"></div>
            <p class="f-err" id="cErr" role="alert"></p>
            <button class="btn btn-green btn-block" type="submit" id="cBtn">${ICO.check} Confirmar pedido</button>
            <p class="note">Te enviaremos la confirmación por WhatsApp y podrás seguir tu pedido con su código.</p>
          </form>
        </aside>
      </div>`;
    pago = Pago($("#pagoBox"), AJ, { contraEntrega: true });
    const upd = () => { const t = totales(cartValido()); $("#cartTotals").innerHTML = t.html; pago.setMonto(t.total); };
    pago.pintar().then(upd); upd();
    $("#checkout").addEventListener("change", e => {
      if (e.target.name === "entrega") { $("#fDomicilio").hidden = e.target.value !== "domicilio"; $("#fRecojo").hidden = e.target.value !== "recojo"; }
      if (["entrega", "cZona"].includes(e.target.name || e.target.id)) upd();
      if (e.target.id === "cComp") $("#cDoc").placeholder = e.target.value === "Factura" ? "RUC (11 dígitos) *" : "Opcional para boleta";
    });
    $("#checkout").addEventListener("submit", async e => {
      e.preventDefault(); const err = m => { $("#cErr").textContent = m; $("#cErr").scrollIntoView({ block: "center", behavior: "smooth" }); };
      $("#cErr").textContent = "";
      const c = cartValido(); if (!c.length) return err("Tu carrito está vacío.");
      const sin = c.find(i => i.qty > stockT(getProd(i.id), i.talla));
      if (sin) { const p = getProd(sin.id), n = stockT(p, sin.talla); return err(n ? `Solo quedan ${n} de «${p.nombre}» en talla ${sin.talla}. Ajusta la cantidad.` : `«${p.nombre}» en talla ${sin.talla} se agotó. Quítalo del carrito.`); }
      const { ent, zona } = estado(), v = id => ($("#" + id)?.value || "").trim();
      if (ent === "domicilio" && zonas().length && !zona) return err("Elige tu zona de envío.");
      if (ent === "domicilio" && !v("cDir")) return err("Escribe tu dirección.");
      if (!v("cNombre") || v("cCel").replace(/\D/g, "").length < 9) return err("Escribe tu nombre y un celular válido.");
      if (v("cComp") === "Factura" && v("cDoc").replace(/\D/g, "").length !== 11) return err("Para factura escribe tu RUC de 11 dígitos.");
      const t = totales(c); pago.setMonto(t.total); const pe = pago.validar(); if (pe) return err(pe);
      const pd = pago.datos(), cod = codigo("NR"), ce = pd.pago === "Contra entrega";
      const pedido = { codigo: cod, items: c.map(i => { const p = getProd(i.id); return { id: String(p.id), n: nombreItem(p, i.talla), talla: i.talla, color: p.color || "", precio: +p.precio, cant: i.qty }; }),
        subtotal: Math.round(t.sub * 100) / 100, envio: t.env, total: Math.round(t.total * 100) / 100, entrega: ent, zona: ent === "domicilio" ? zona : "", direccion: ent === "domicilio" ? v("cDir").slice(0, 160) : "", referencia: v("cRef").slice(0, 160),
        nombre: v("cNombre").slice(0, 80), celular: v("cCel").slice(0, 20), doc: v("cDoc").slice(0, 11), comprobante: v("cComp"), pago: pd.pago, banco: pd.banco, monto: ce ? t.total : pd.monto, operacion: pd.operacion,
        montoLeido: pd.montoLeido, coincide: pd.coincide, fechaOk: pd.fechaOk, estado: ce ? "nuevo" : "por-validar", origen: "web", creado: new Date().toISOString() };
      const b = $("#cBtn"); b.disabled = true; b.textContent = "Enviando…";
      try { await DB.crearPedido(pedido, pd.captura); } catch (er) { console.error(er); b.disabled = false; b.innerHTML = ICO.check + " Confirmar pedido"; return err("No se pudo enviar tu pedido. Revisa tu conexión e inténtalo otra vez."); }
      try { localStorage.setItem("nara_ultimo", cod); } catch (e2) {}
      MIS.add(cod); RECIBOS[cod] = pedido; saveCart([]);
      const msg = `Hola ${TIENDA()} 👋 Acabo de hacer el pedido *${cod}*\n\n${pedido.items.map(i => `• ${i.n} x${i.cant} = ${soles(i.precio * i.cant)}`).join("\n")}\n\nTOTAL: ${soles(pedido.total)}\nPago: ${pedido.pago}${pedido.banco ? " " + pedido.banco : ""}\nEntrega: ${ent === "domicilio" ? "Envío a " + pedido.direccion : "Recojo en tienda"}`;
      cartBox.innerHTML = `<div class="ok-box" id="okPedido">${ICO.check}<h2>¡Pedido recibido!</h2><p>Tu código es</p><div class="ok-code">${cod}</div>
        <p>${ce ? "Te confirmaremos por WhatsApp cuándo llega tu pedido." : "Estamos validando tu pago. Te avisaremos por WhatsApp apenas lo confirmemos."}</p>
        <div class="ok-acts"><a class="btn btn-green" target="_blank" rel="noopener" href="${waLink(msg)}">Enviar mi pedido por WhatsApp</a><button class="btn btn-yellow" type="button" data-recibo="${cod}">${ICO.down} Descargar recibo PDF</button><a class="btn btn-dark" href="pedido?c=${cod}">Seguir mi pedido</a><a class="btn btn-line" href="mis-compras">Mis compras</a></div>
        <p class="note">Tu compra quedó guardada en <a href="mis-compras"><b>Mis compras</b></a> de este celular.</p></div>`;
      scrollTo({ top: 0, behavior: "smooth" });
    });
  }
  cartBox.addEventListener("click", e => {
    const cart = cartValido(), q = e.target.closest("[data-q]"), rm = e.target.closest("[data-rm]");
    if (q) { const it = cart[+q.dataset.idx], p = getProd(it.id), nv = it.qty + Number(q.dataset.q);
      if (nv > stockT(p, it.talla)) return toast(`Solo quedan ${stockT(p, it.talla)} en talla ${it.talla}`, true);
      it.qty = nv; if (it.qty < 1) cart.splice(+q.dataset.idx, 1); }
    else if (rm) cart.splice(+rm.dataset.rm, 1); else return;
    saveCart(cart); drawCart();
  });
  drawCart();
}

/* ---------- Seguir mi pedido ---------- */
function paginaPedido() {
  const box = $("#trackBox"); if (!box) return;
  let c0 = params.get("c"); try { c0 = c0 || localStorage.getItem("nara_ultimo") || ""; } catch (e) {}
  box.innerHTML = `<form class="track-f panel" id="tf"><label for="tc">Código de tu pedido</label><div><input id="tc" value="${esc(c0)}" placeholder="NR-XXXXXX" maxlength="12"><button class="btn btn-blue">Buscar</button></div></form><div id="tRes" aria-live="polite"></div>`;
  const PASOS = [["por-validar", "Pago en revisión", "clock"], ["nuevo", "Pedido confirmado", "check"], ["preparando", "Preparando", "box"], ["enviado", "En camino", "truck"], ["entregado", "Entregado", "check"]];
  async function ver(c) {
    $("#tRes").innerHTML = `<p class="note">Buscando…</p>`; let p = null; try { p = await DB.pedido(c); } catch (e) {}
    if (!p) { $("#tRes").innerHTML = `<div class="empty"><h3>No encontramos ese pedido</h3><p>Revisa el código e inténtalo otra vez.</p></div>`; return; }
    const malo = ["anulado", "rechazado"].includes(p.estado), idx = PASOS.findIndex(x => x[0] === p.estado), pasos = p.pago === "Contra entrega" ? PASOS.slice(1) : PASOS;
    $("#tRes").innerHTML = `<div class="track panel"><div class="track-h"><div><small>Pedido</small><b>${esc(p.codigo)}</b></div><div><small>Total</small><b>${soles(p.total)}</b></div><div><small>Pago</small><b>${esc(p.pago)}${p.banco ? " " + esc(p.banco) : ""}</b></div><div><small>Entrega</small><b>${entregaTxt(p)}</b></div></div>
      ${malo ? `<div class="track-bad">Este pedido fue ${p.estado === "rechazado" ? "rechazado porque no pudimos validar el pago" : "anulado"}${p.motivo ? ": " + esc(p.motivo) : ""}. Escríbenos por WhatsApp para ayudarte.</div>`
      : `<ol class="steps">${pasos.map(([k, t, ic]) => { const i = PASOS.findIndex(x => x[0] === k), est = i < idx ? "done" : i === idx ? "now" : ""; return `<li class="${est}">${ICO[ic]}<span>${p.entrega === "recojo" && k === "enviado" ? "Listo para recoger" : t}</span></li>`; }).join("")}</ol>`}
      <div class="track-items">${(p.items || []).map(i => `<div><span>${i.cant} × ${esc(i.n)}</span><b>${soles(i.precio * i.cant)}</b></div>`).join("")}${p.envio ? `<div><span>Envío (${esc(p.zona || "")})</span><b>${soles(p.envio)}</b></div>` : ""}</div>
      ${p.boleta ? `<p class="mc-bol">🧾 ${esc(p.comprobante || "Boleta")} electrónica: <b>${esc(p.boleta)}</b></p>` : ""}
      <div class="track-acts"><button class="btn btn-yellow" type="button" data-recibo="${esc(p.codigo)}">${ICO.down} Descargar recibo PDF</button>
      <a class="btn btn-green" target="_blank" rel="noopener" href="${waLink(`Hola ${TIENDA()} 👋 Consulto por mi pedido ${p.codigo}`)}">Consultar por WhatsApp</a></div></div>`;
    RECIBOS[p.codigo] = p; MIS.add(p.codigo);
    history.replaceState(null, "", "?c=" + p.codigo);
  }
  $("#tf").addEventListener("submit", e => { e.preventDefault(); ver($("#tc").value); });
  if (c0) ver(c0);
}

/* ---------- Mis compras: códigos guardados en este celular ---------- */
const MIS = {
  get() { try { const l = JSON.parse(localStorage.getItem("nara_compras")); return Array.isArray(l) ? l : []; } catch (e) { return []; } },
  guardar(l) { try { localStorage.setItem("nara_compras", JSON.stringify(l.slice(0, 60))); } catch (e) {} },
  add(c) { c = String(c || "").trim().toUpperCase(); if (!c) return; const l = MIS.get(); if (!l.includes(c)) { l.unshift(c); MIS.guardar(l); } },
  del(c) { MIS.guardar(MIS.get().filter(x => x !== c)); }
};
const RECIBOS = {};
const EST_TXT = { "por-validar": "Pago en revisión", nuevo: "Confirmado", preparando: "Preparando", enviado: "En camino", entregado: "Entregado", anulado: "Anulado", rechazado: "Rechazado" };
const fechaPE = (s, hora = true) => { const d = new Date(s); if (isNaN(d)) return ""; return d.toLocaleDateString("es-PE", { day: "2-digit", month: "short", year: "numeric" }) + (hora ? " " + d.toLocaleTimeString("es-PE", { hour: "2-digit", minute: "2-digit" }) : ""); };
const entregaTxt = p => p.entrega === "recojo" ? "Recojo en tienda" : p.entrega === "tienda" ? "Compra en tienda" : "Envío a domicilio";

function imgData(src) {   // convierte el logo en imagen para el PDF (si se puede)
  return new Promise(ok => {
    if (!src) return ok(null); const im = new Image(); let listo = false; const fin = v => { if (!listo) { listo = true; ok(v); } };
    if (!src.startsWith("data:")) im.crossOrigin = "anonymous";
    im.onload = () => { try { const k = Math.min(1, 400 / im.naturalWidth), c = document.createElement("canvas"); c.width = im.naturalWidth * k || 200; c.height = im.naturalHeight * k || 200; const x = c.getContext("2d"); x.fillStyle = "#fff"; x.fillRect(0, 0, c.width, c.height); x.drawImage(im, 0, 0, c.width, c.height); fin({ d: c.toDataURL("image/jpeg", .9), w: c.width, h: c.height }); } catch (e) { fin(null); } };
    im.onerror = () => fin(null); setTimeout(() => fin(null), 6000); im.src = src;
  });
}
async function pdfRecibo(p) {
  await cargarScript("https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js");
  const doc = new window.jspdf.jsPDF({ unit: "mm", format: "a5" }), W = 148, H = 210, M = 10, S = n => "S/ " + (+n || 0).toFixed(2);
  const T = (t, x, y, o) => doc.text(String(t ?? ""), x, y, o), F = (b, z, c = 20) => { doc.setFont("helvetica", b ? "bold" : "normal"); doc.setFontSize(z); doc.setTextColor(c); };
  doc.setFillColor(11, 58, 168); doc.rect(0, 0, W, 3, "F"); doc.setFillColor(47, 196, 212); doc.rect(0, 3, W, 1.2, "F");
  let y = 12, tx = M;
  const lg = await imgData(AJ.logo);
  if (lg) { const h = 15, w = Math.min(32, h * lg.w / lg.h); doc.addImage(lg.d, "JPEG", M, y - 4, w, h); tx = M + w + 3; }
  else { doc.setFillColor(11, 58, 168); doc.roundedRect(M, y - 5, 12, 12, 2, 2, "F"); F(1, 12, 255); T((AJ.logoLetra || TIENDA()).charAt(0), M + 6, y + 3.2, { align: "center" }); tx = M + 15; }
  F(1, 13, 20); T(doc.splitTextToSize(TIENDA(), 80 - (tx - M))[0], tx, y);
  F(0, 7.5, 90);
  [AJ.ruc ? "RUC " + AJ.ruc : "", AJ.direccion, [AJ.telefono || AJ.whatsapp, AJ.email].filter(Boolean).join(" · ")].filter(Boolean)
    .forEach((l, i) => T(doc.splitTextToSize(String(l), 84 - (tx - M))[0], tx, y + 4.5 + i * 3.6));
  const bx = W - M - 44; doc.setDrawColor(11, 58, 168); doc.setLineWidth(.4); doc.roundedRect(bx, y - 5, 44, 23, 2, 2);
  F(1, 8.5, 20); T("RECIBO DE COMPRA", bx + 22, y, { align: "center" });
  F(1, 11, 20); T(p.codigo, bx + 22, y + 6.5, { align: "center" });
  F(0, 7, 70); T(fechaPE(p.creado), bx + 22, y + 11.5, { align: "center" }); T("Estado: " + (EST_TXT[p.estado] || p.estado || ""), bx + 22, y + 15.5, { align: "center" });
  y = 36;
  doc.setFillColor(242, 244, 248); doc.roundedRect(M, y, W - 2 * M, 22, 1.5, 1.5, "F");
  F(1, 7, 120); T("CLIENTE", M + 3, y + 4.5); T("ENTREGA", M + 68, y + 4.5);
  F(1, 8.5); T(doc.splitTextToSize(p.nombre || "Cliente", 60)[0], M + 3, y + 9);
  F(0, 7.5, 60); T((p.comprobante || "Boleta") + (p.doc ? " · " + (String(p.doc).length === 11 ? "RUC " : "DNI ") + p.doc : ""), M + 3, y + 13); T(p.celular ? "Cel. " + p.celular : "", M + 3, y + 17);
  F(1, 8.5); T(entregaTxt(p), M + 68, y + 9);
  F(0, 7.5, 60); doc.splitTextToSize(p.entrega === "domicilio" ? [p.direccion, p.zona].filter(Boolean).join(" · ") : p.entrega === "recojo" ? (AJ.direccion || "") : "", 58).slice(0, 2).forEach((l, i) => T(l, M + 68, y + 13 + i * 3.6));
  y += 26;
  if (p.boleta) { doc.setDrawColor(47, 196, 212); doc.setLineWidth(.6); doc.roundedRect(M, y, W - 2 * M, 8, 1.5, 1.5); F(1, 8.5); T(`${p.comprobante || "Boleta"} electrónica N° ${p.boleta}`, W / 2, y + 5.3, { align: "center" }); y += 12; }
  const col = [M, M + 14, W - M - 42, W - M];
  const cab = () => { doc.setFillColor(11, 58, 168); doc.rect(M, y, W - 2 * M, 7, "F"); F(1, 7.5, 255); T("CANT.", col[0] + 2, y + 4.8); T("DESCRIPCIÓN", col[1] + 1, y + 4.8); T("P. UNIT.", col[2] + 18, y + 4.8, { align: "right" }); T("IMPORTE", col[3] - 2, y + 4.8, { align: "right" }); y += 7; };
  cab();
  (p.items || []).forEach((it, i) => {
    const desc = doc.splitTextToSize(it.n + (it.color ? ` (${it.color})` : ""), col[2] - col[1] - 2), h = Math.max(6.5, desc.length * 3.6 + 3);
    if (y + h > H - 50) { doc.addPage(); y = 14; cab(); }
    if (i % 2) { doc.setFillColor(248, 249, 252); doc.rect(M, y, W - 2 * M, h, "F"); }
    F(0, 8); T(it.cant, col[0] + 5, y + 4.4, { align: "center" }); desc.forEach((l, k) => T(l, col[1] + 1, y + 4.4 + k * 3.6));
    T(S(it.precio), col[2] + 18, y + 4.4, { align: "right" }); F(1, 8); T(S(it.precio * it.cant), col[3] - 2, y + 4.4, { align: "right" });
    y += h;
  });
  doc.setDrawColor(200); doc.setLineWidth(.2); doc.line(M, y, W - M, y); y += 5;
  [["Subtotal", p.subtotal ?? p.total], ...(p.descuento ? [["Descuento", -p.descuento]] : []), ...(p.envio ? [["Envío" + (p.zona ? " (" + p.zona + ")" : ""), p.envio]] : [])].forEach(([k, v]) => { F(0, 8, 70); T(k, W - M - 32, y, { align: "right" }); T(S(v), W - M - 2, y, { align: "right" }); y += 4.5; });
  doc.setFillColor(11, 58, 168); doc.roundedRect(W - M - 58, y - 1.5, 58, 8, 1.5, 1.5, "F"); F(1, 10, 255); T("TOTAL", W - M - 32, y + 4, { align: "right" }); T(S(p.total), W - M - 2, y + 4, { align: "right" });
  F(1, 7, 120); T("PAGO", M, y - 4.5); F(0, 8, 40);
  T(`${p.pago || ""}${p.banco ? " · " + p.banco : ""}`, M, y); if (p.operacion) T("Operación: " + p.operacion, M, y + 4);
  F(0, 7.5, 60); T(["por-validar", "rechazado", "anulado"].includes(p.estado) ? "" : p.pago === "Contra entrega" && !p.pagado ? "Se paga al recibir" : "Pagado", M, y + 8);
  y += 16;
  if (y > H - 38) { doc.addPage(); y = 14; }
  try { const q = await qrCanvas(new URL("pedido?c=" + p.codigo, location.href).href, 220, "#0b3aa8"); doc.addImage(q.toDataURL(), "PNG", M, y, 24, 24); } catch (e) {}
  F(1, 8.5, 20); T("¡Gracias por tu compra!", M + 28, y + 5);
  F(0, 7.5, 70); doc.splitTextToSize(`Escanea el código QR para ver el estado de tu pedido en línea. Cambios dentro de los ${AJ.cambiosDias || 15} días, con la prenda sin uso y con etiqueta. Guarda este recibo junto con tu código ${p.codigo}.`, W - 2 * M - 28).forEach((l, i) => T(l, M + 28, y + 9.5 + i * 3.6));
  doc.setDrawColor(220); doc.line(M, H - 14, W - M, H - 14);
  F(1, 7, 90); T("Este recibo no reemplaza la boleta o factura electrónica.", W / 2, H - 9.5, { align: "center" });
  F(0, 6.5, 140); T("Documento generado por " + TIENDA() + " · " + fechaPE(new Date().toISOString()), W / 2, H - 6, { align: "center" });
  doc.save(`Recibo-${p.codigo}.pdf`);
}
document.addEventListener("click", async e => {
  const b = e.target.closest("[data-recibo]"); if (!b) return;
  const c = b.dataset.recibo, html = b.innerHTML; b.disabled = true; b.textContent = "Generando PDF…";
  try { const p = RECIBOS[c] || await DB.pedido(c); if (!p) throw new Error("no existe"); await pdfRecibo(p); }
  catch (er) { console.error(er); toast("No se pudo generar el recibo. Revisa tu conexión.", true); }
  b.disabled = false; b.innerHTML = html;
});

function paginaMisCompras() {
  const box = $("#comprasBox"); if (!box) return;
  try { const u = localStorage.getItem("nara_ultimo"); if (u) MIS.add(u); } catch (e) {}
  box.innerHTML = `<div id="mcList" aria-live="polite"></div>
    <form class="track-f panel mc-add" id="mcF"><label for="mcC">¿Compraste desde otro celular o computadora? Agrega el código de tu pedido</label>
      <div><input id="mcC" placeholder="NR-XXXXXX" maxlength="12"><button class="btn btn-blue">Agregar</button></div><p class="f-err" id="mcErr"></p></form>`;
  async function pintar() {
    const L = $("#mcList"), cods = MIS.get();
    if (!cods.length) { L.innerHTML = `<div class="cart-empty">${ICO.box}<h2>Aún no tienes compras en este celular</h2><p>Cuando compres en la web, tus pedidos y recibos aparecerán aquí.</p><a class="btn btn-blue" href="catalogo">Ver la tienda</a></div>`; return; }
    L.innerHTML = `<p class="note">Cargando tus compras…</p>`;
    const ps = await Promise.all(cods.map(c => RECIBOS[c] ? Promise.resolve(RECIBOS[c]) : DB.pedido(c).catch(() => null)));
    ps.forEach(p => p && (RECIBOS[p.codigo] = p));
    const ok = ps.filter(Boolean).sort((a, b) => String(b.creado || "").localeCompare(String(a.creado || ""))), faltan = cods.filter((c, i) => !ps[i]);
    const validas = ok.filter(p => !["anulado", "rechazado"].includes(p.estado)), gasto = validas.reduce((a, p) => a + (+p.total || 0), 0);
    L.innerHTML = `<div class="mc-sum"><div><small>Compras</small><b>${ok.length}</b></div><div><small>Total comprado</small><b>${soles(gasto)}</b></div><div><small>Última compra</small><b>${ok[0] ? fechaPE(ok[0].creado, false) : "—"}</b></div></div>
      ${ok.map(p => `<article class="mc-card panel">
        <div class="mc-h"><div><small>Pedido</small><b>${esc(p.codigo)}</b><span>${fechaPE(p.creado)}</span></div><span class="mc-est e-${esc(p.estado)}">${esc(EST_TXT[p.estado] || p.estado)}</span></div>
        <div class="track-items">${(p.items || []).map(i => `<div><span>${i.cant} × ${esc(i.n)}</span><b>${soles(i.precio * i.cant)}</b></div>`).join("")}${p.envio ? `<div><span>Envío</span><b>${soles(p.envio)}</b></div>` : ""}</div>
        <div class="mc-tot"><span>${esc(p.pago || "")}${p.banco ? " · " + esc(p.banco) : ""} · ${entregaTxt(p)}</span><b>${soles(p.total)}</b></div>
        ${p.boleta ? `<p class="mc-bol">🧾 ${esc(p.comprobante || "Boleta")} electrónica: <b>${esc(p.boleta)}</b></p>` : ""}
        <div class="mc-acts"><button class="btn btn-yellow" type="button" data-recibo="${esc(p.codigo)}">${ICO.down} Descargar recibo PDF</button><a class="btn btn-dark" href="pedido?c=${encodeURIComponent(p.codigo)}">Ver seguimiento</a><button class="btn btn-line" type="button" data-quitar="${esc(p.codigo)}">Quitar</button></div>
      </article>`).join("")}
      ${faltan.length ? `<p class="note">No encontramos: ${faltan.map(c => `<b>${esc(c)}</b> <button class="lnk" data-quitar="${esc(c)}">quitar</button>`).join(", ")}</p>` : ""}`;
  }
  box.addEventListener("click", e => { const q = e.target.closest("[data-quitar]"); if (q) { MIS.del(q.dataset.quitar); toast("Quitado de tu lista (el pedido sigue existiendo).", true); pintar(); } });
  $("#mcF").addEventListener("submit", async e => {
    e.preventDefault(); const c = $("#mcC").value.trim().toUpperCase(), er = $("#mcErr"); er.textContent = ""; if (!c) return;
    let p = null; try { p = await DB.pedido(c); } catch (x) {}
    if (!p) { er.textContent = "No encontramos ese código. Revísalo e inténtalo otra vez."; return; }
    RECIBOS[p.codigo] = p; MIS.add(p.codigo); $("#mcC").value = ""; toast("✓ Compra agregada", true); pintar();
  });
  pintar();
}

/* ---------- Contacto (guarda la consulta en el panel) y boletín ---------- */
function paginaContacto() {
  const f = $("#contactForm"); if (!f) return;
  f.addEventListener("submit", async e => {
    e.preventDefault();
    const m = { nombre: $("#fNombre").value.trim().slice(0, 80), telefono: ($("#fTel")?.value || "").trim().slice(0, 20), asunto: $("#fAsunto").value, mensaje: $("#fMensaje").value.trim().slice(0, 1500), estado: "nuevo", creado: new Date().toISOString() };
    try { await DB.mensaje(m); } catch (er) { console.warn(er); }
    window.open(waLink("Hola " + TIENDA() + " 👋\nNombre: " + m.nombre + (m.telefono ? "\nCelular: " + m.telefono : "") + "\nAsunto: " + m.asunto + "\nMensaje: " + m.mensaje), "_blank");
    f.reset(); toast("✓ Consulta enviada. Te responderemos pronto.", true);
  });
}
$$(".news-form").forEach(f => f.addEventListener("submit", e => { e.preventDefault(); f.innerHTML = "<p style='padding:10px 12px;color:var(--blue);font-weight:700'>¡Listo! Te avisaremos de las próximas ofertas.</p>"; }));

/* ---------- Menú y año ---------- */
$("#hamburger")?.addEventListener("click", () => $("#menu").classList.toggle("open"));
$$(".year").forEach(el => el.textContent = new Date().getFullYear());

/* ---------- Arranque: carga los datos del panel y dibuja la página ---------- */
(async function () {
  const c = await DB.catalogo();
  AJ = c.aj || {};
  c.cats.filter(x => x.activo !== false).sort((a, b) => (a.orden ?? 99) - (b.orden ?? 99)).forEach(x => CATEGORIAS[x.id] = x);
  PRODUCTOS = c.prods.filter(p => p.activo !== false).sort((a, b) => (a.orden ?? 999) - (b.orden ?? 999));
  aplicarMarca(); paginas(); paginaCarrito(); paginaPedido(); paginaMisCompras(); paginaContacto(); updateBadge();
})();
