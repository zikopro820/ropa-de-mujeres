/* =========================================================
   NARA — Funciones de la tienda (demo de ziko.pro)
   ⚠️ CAMBIA AQUÍ TUS DATOS
   ========================================================= */
const WHATSAPP     = "51999999999"; // código de país + número, sin + ni espacios
const COSTO_ENVIO  = 12;            // costo de envío en soles
const ENVIO_GRATIS = 199;           // envío gratis desde este monto
const TIENDA       = "NARA";

/* ---------- Utilidades ---------- */
const $  = (s, c = document) => c.querySelector(s);
const $$ = (s, c = document) => [...c.querySelectorAll(s)];
const soles = n => "S/ " + n.toFixed(2);
const waLink = txt => "https://wa.me/" + WHATSAPP + "?text=" + encodeURIComponent(txt);
const getProd = id => (typeof PRODUCTOS !== "undefined" ? PRODUCTOS : []).find(p => p.id === Number(id));
const off = p => p.antes ? Math.round((1 - p.precio / p.antes) * 100) : 0;
const stars = r => "★★★★★".slice(0, Math.round(r)) + "☆☆☆☆☆".slice(0, 5 - Math.round(r));

/* ---------- Carrito (se guarda en el navegador) ---------- */
let memoryCart = [];
function readCart() {
  try { return JSON.parse(localStorage.getItem("nara_mk_cart")) || []; } catch (e) { return memoryCart; }
}
function saveCart(cart) {
  memoryCart = cart;
  try { localStorage.setItem("nara_mk_cart", JSON.stringify(cart)); } catch (e) {}
  updateBadge();
}
function addToCart(id, talla, qty = 1) {
  const cart = readCart();
  const item = cart.find(i => i.id === id && i.talla === talla);
  if (item) item.qty += qty; else cart.push({ id, talla, qty });
  saveCart(cart);
  toast("✓ Agregado al carrito");
}
function updateBadge() {
  const n = readCart().reduce((s, i) => s + i.qty, 0);
  $$(".cart-count").forEach(el => { el.textContent = n || ""; el.dataset.n = n; });
}

/* ---------- Aviso flotante ---------- */
let toastTimer;
function toast(msg) {
  let t = $(".toast");
  if (!t) { t = document.createElement("div"); t.className = "toast"; document.body.appendChild(t); }
  t.innerHTML = "<span></span><a href='carrito'>Ver carrito</a>";
  t.firstChild.textContent = msg;
  t.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove("show"), 2600);
}

/* ---------- Tarjetas de producto ---------- */
function tagFor(p) {
  if (p.flash) return `<span class="tag red">Flash</span>`;
  if (p.nuevo) return `<span class="tag">Nuevo</span>`;
  if (off(p) >= 40) return `<span class="tag cyan">-${off(p)}% OFF</span>`;
  return off(p) ? `<span class="tag">Oferta</span>` : "";
}
function productCard(p) {
  return `
    <article class="card">
      <a class="card-img" href="producto?id=${p.id}">
        ${tagFor(p)}
        <span class="rate-pill">${p.rating.toFixed(1)}</span>
        <img src="${p.foto}" alt="${p.nombre}" loading="lazy" onerror="this.style.display='none'">
        ${off(p) ? `<span class="off-bubble">-${off(p)}%</span>` : ""}
      </a>
      <div class="card-body">
        <h3><a href="producto?id=${p.id}">${p.nombre}</a></h3>
        <div class="stars">${stars(p.rating)}</div>
        <div class="prices"><strong>${soles(p.precio)}</strong>${p.antes ? `<del>${soles(p.antes)}</del>` : ""}</div>
        <button class="btn btn-blue btn-block buy" data-id="${p.id}">${p.tallas.length > 1 ? "Elegir talla" : "Agregar"}</button>
      </div>
    </article>`;
}
function flashCard(p) {
  return `
    <article class="card">
      <a class="card-img" href="producto?id=${p.id}">
        <span class="tag cyan">Flash deal</span>
        <span class="rate-pill">${p.rating.toFixed(1)}</span>
        <img src="${p.foto}" alt="${p.nombre}" loading="lazy" onerror="this.style.display='none'">
        <span class="off-bubble">-${off(p)}%</span>
      </a>
      <div class="card-body">
        <h3><a href="producto?id=${p.id}">${p.nombre}</a></h3>
        <div class="prices"><strong>${soles(p.precio)}</strong><del>${soles(p.antes)}</del></div>
        <div class="sold">${p.vendido}% vendido</div>
        <div class="bar"><i style="width:${p.vendido}%"></i></div>
        <button class="btn btn-blue btn-block buy" data-id="${p.id}">Comprar</button>
      </div>
    </article>`;
}
function renderGrid(el, list, fn = productCard) {
  if (!el) return;
  el.innerHTML = list.length ? list.map(fn).join("") :
    `<div class="empty"><h3>No encontramos productos</h3><p>Prueba con otra búsqueda o quita algún filtro.</p></div>`;
}
document.addEventListener("click", e => {
  const b = e.target.closest(".buy");
  if (!b) return;
  const p = getProd(b.dataset.id);
  if (p.tallas.length > 1) { location.href = "producto?id=" + p.id; return; }
  addToCart(p.id, p.tallas[0], 1);
});

/* ---------- Encabezado: buscador y categorías ---------- */
const catSelect = $("#catSelect");
if (catSelect) catSelect.addEventListener("change", () => {
  location.href = catSelect.value ? "catalogo?cat=" + catSelect.value : "catalogo";
});
const searchForm = $("#searchForm");
if (searchForm) searchForm.addEventListener("submit", e => {
  e.preventDefault();
  const q = $("#q").value.trim();
  location.href = "catalogo" + (q ? "?q=" + encodeURIComponent(q) : "");
});

/* ---------- Carrusel ---------- */
const slider = $(".slider");
if (slider) {
  const slides = $$(".slide", slider);
  const dots = $(".dots", slider);
  let cur = 0, timer;
  dots.innerHTML = slides.map((_, i) => `<button aria-label="Banner ${i + 1}"></button>`).join("");
  const go = i => {
    cur = (i + slides.length) % slides.length;
    slides.forEach((s, k) => s.classList.toggle("active", k === cur));
    $$("button", dots).forEach((d, k) => d.classList.toggle("active", k === cur));
    clearInterval(timer);
    timer = setInterval(() => go(cur + 1), 5000);
  };
  dots.addEventListener("click", e => { const i = $$("button", dots).indexOf(e.target); if (i >= 0) go(i); });
  $(".prev", slider).addEventListener("click", () => go(cur - 1));
  $(".next", slider).addEventListener("click", () => go(cur + 1));
  go(0);
}

/* ---------- Contador de Ofertas Flash (termina a medianoche) ---------- */
const cd = $("#countdown");
if (cd) {
  const pad = n => String(n).padStart(2, "0");
  const box = v => pad(v).split("").map(d => `<i>${d}</i>`).join("");
  const tick = () => {
    const now = new Date(), end = new Date(now);
    end.setHours(24, 0, 0, 0);
    let s = Math.max(0, Math.floor((end - now) / 1000));
    const h = Math.floor(s / 3600); s %= 3600;
    const m = Math.floor(s / 60); s %= 60;
    cd.innerHTML = `<div><b>${box(h)}</b><small>horas</small></div><span class="sep">:</span>
      <div><b>${box(m)}</b><small>min</small></div><span class="sep">:</span>
      <div><b>${box(s)}</b><small>seg</small></div>`;
  };
  tick(); setInterval(tick, 1000);
}

/* ---------- Inicio ---------- */
renderGrid($("#flashRow"), PRODUCTOS.filter(p => p.flash), flashCard);
renderGrid($("#recommended"), [...PRODUCTOS].filter(p => p.antes).sort((a, b) => off(b) - off(a)).slice(0, 5));
renderGrid($("#newest"), PRODUCTOS.filter(p => p.nuevo).slice(0, 5));

/* ---------- Catálogo ---------- */
const grid = $("#catalogGrid");
if (grid) {
  const params = new URLSearchParams(location.search);
  const state = {
    cat: params.get("cat") || "todos",
    q: params.get("q") || "",
    max: 500,
    ofertas: params.get("ofertas") === "1",
    flash: params.get("flash") === "1",
    order: "relevancia"
  };
  const cats = $("#catFilters");
  cats.innerHTML = [["todos", "Todas", PRODUCTOS.length]]
    .concat(Object.entries(CATEGORIAS).map(([k, v]) => [k, v, PRODUCTOS.filter(p => p.cat === k).length]))
    .map(([k, v, n]) => `<label class="filter-opt"><input type="radio" name="cat" value="${k}"${k === state.cat ? " checked" : ""}> ${v}<span>${n}</span></label>`).join("");
  $("#q") && ($("#q").value = state.q);
  $("#onlyOffers").checked = state.ofertas;
  $("#onlyFlash").checked = state.flash;
  if (state.cat !== "todos" && CATEGORIAS[state.cat]) $("#pageTitle").textContent = CATEGORIAS[state.cat];
  if (state.flash) $("#pageTitle").textContent = "Ofertas Flash";
  if (state.ofertas) $("#pageTitle").textContent = "Ofertas";

  function draw() {
    let list = PRODUCTOS.filter(p =>
      (state.cat === "todos" || p.cat === state.cat) &&
      p.precio <= state.max &&
      (!state.ofertas || p.antes) &&
      (!state.flash || p.flash) &&
      (p.nombre + " " + p.color + " " + CATEGORIAS[p.cat]).toLowerCase().includes(state.q.toLowerCase()));
    if (state.order === "menor") list.sort((a, b) => a.precio - b.precio);
    if (state.order === "mayor") list.sort((a, b) => b.precio - a.precio);
    if (state.order === "descuento") list.sort((a, b) => off(b) - off(a));
    $("#resultCount").innerHTML = `<b>${list.length}</b> productos` + (state.q ? ` para "<b>${state.q.replace(/</g, "")}</b>"` : "");
    renderGrid(grid, list);
  }
  cats.addEventListener("change", e => { state.cat = e.target.value; draw(); });
  $("#maxPrice").addEventListener("input", e => { state.max = Number(e.target.value); $("#maxVal").textContent = "S/ " + state.max; draw(); });
  $("#onlyOffers").addEventListener("change", e => { state.ofertas = e.target.checked; draw(); });
  $("#onlyFlash").addEventListener("change", e => { state.flash = e.target.checked; draw(); });
  $("#order").addEventListener("change", e => { state.order = e.target.value; draw(); });
  $("#filterToggle").addEventListener("click", () => $(".filters").classList.toggle("open"));
  draw();
}

/* ---------- Página de producto ---------- */
const pdp = $("#pdp");
if (pdp) {
  const p = getProd(new URLSearchParams(location.search).get("id")) || PRODUCTOS[0];
  document.title = p.nombre + " | " + TIENDA;
  $("#crumbName").textContent = p.nombre;
  let talla = p.tallas.length === 1 ? p.tallas[0] : null;
  let qty = 1;
  pdp.innerHTML = `
    <div class="pdp-img">
      ${tagFor(p)}
      <img src="${p.foto.replace("w=700", "w=1200")}" alt="${p.nombre}" onerror="this.style.display='none'">
      ${off(p) ? `<span class="off-bubble">-${off(p)}%</span>` : ""}
    </div>
    <div>
      <a class="pdp-cat" href="catalogo?cat=${p.cat}">${CATEGORIAS[p.cat]}</a>
      <h1>${p.nombre}</h1>
      <div class="stars">${stars(p.rating)} <span>${p.rating.toFixed(1)} de 5</span></div>
      <div class="price-box">
        <div class="prices"><strong>${soles(p.precio)}</strong>${p.antes ? `<del>${soles(p.antes)}</del>` : ""}</div>
        ${p.antes ? `<span class="save">Ahorras ${soles(p.antes - p.precio)}</span>` : ""}
      </div>
      <p class="desc">${p.desc}</p>
      <div class="opt-label"><span>Color: ${p.color}</span></div>
      <div class="opt-label"><span>Talla</span>${p.tallas.length > 1 ? '<a href="guia-de-tallas">Guía de tallas</a>' : ""}</div>
      <div class="sizes">${p.tallas.map(t => `<button class="size${t === talla ? " active" : ""}" data-t="${t}">${t}</button>`).join("")}</div>
      <p class="size-warn" id="sizeWarn">Selecciona una talla para continuar.</p>
      <div class="buy-row">
        <div class="qty"><button data-q="-1" aria-label="Menos">−</button><span id="qty">1</span><button data-q="1" aria-label="Más">+</button></div>
        <button class="btn btn-blue" id="addBtn">
          <svg viewBox="0 0 24 24"><path d="M6 6h15l-1.5 9h-12z"/><path d="M6 6L5 3H2"/><circle cx="9" cy="20" r="1.5"/><circle cx="18" cy="20" r="1.5"/></svg>
          Agregar al carrito
        </button>
      </div>
      <a class="btn btn-green btn-block" id="buyWa" target="_blank" rel="noopener">Comprar ahora por WhatsApp</a>
      <div class="delivery">
        <div><svg viewBox="0 0 24 24"><path d="M1 4h14v12H1zM15 8h4l3 3v5h-7"/><circle cx="5.5" cy="18.5" r="2"/><circle cx="18.5" cy="18.5" r="2"/></svg><div><b>Envío a domicilio</b><span>Lima en 24–48 h · Gratis desde S/ ${ENVIO_GRATIS}</span></div></div>
        <div><svg viewBox="0 0 24 24"><path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5"/></svg><div><b>Cambios gratis</b><span>Dentro de los 15 días, sin uso y con etiqueta</span></div></div>
        <div><svg viewBox="0 0 24 24"><rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></svg><div><b>Pago seguro</b><span>Yape, Plin, transferencia o tarjeta</span></div></div>
      </div>
    </div>`;

  const waUpdate = () => {
    $("#buyWa").href = waLink("Hola " + TIENDA + " 👋 Quiero comprar:\n• " + p.nombre +
      "\nColor: " + p.color + "\nTalla: " + (talla || "por definir") + "\nCantidad: " + qty +
      "\nPrecio: " + soles(p.precio * qty));
  };
  waUpdate();
  $(".sizes", pdp).addEventListener("click", e => {
    const b = e.target.closest(".size");
    if (!b) return;
    talla = b.dataset.t;
    $$(".size", pdp).forEach(s => s.classList.toggle("active", s === b));
    $("#sizeWarn").style.display = "none";
    waUpdate();
  });
  $(".qty", pdp).addEventListener("click", e => {
    const b = e.target.closest("button");
    if (!b) return;
    qty = Math.max(1, qty + Number(b.dataset.q));
    $("#qty").textContent = qty;
    waUpdate();
  });
  $("#addBtn").addEventListener("click", () => {
    if (!talla) { $("#sizeWarn").style.display = "block"; return; }
    addToCart(p.id, talla, qty);
  });
  const related = PRODUCTOS.filter(x => x.cat === p.cat && x.id !== p.id)
    .concat(PRODUCTOS.filter(x => x.cat !== p.cat && x.id !== p.id)).slice(0, 5);
  renderGrid($("#related"), related);
}

/* ---------- Carrito ---------- */
const cartBox = $("#cartBox");
if (cartBox) {
  function drawCart() {
    const cart = readCart().filter(i => getProd(i.id));
    if (!cart.length) {
      cartBox.innerHTML = `
        <div class="cart-empty">
          <svg viewBox="0 0 24 24"><path d="M6 6h15l-1.5 9h-12z"/><path d="M6 6L5 3H2"/><circle cx="9" cy="20" r="1.5"/><circle cx="18" cy="20" r="1.5"/></svg>
          <h2>Tu carrito está vacío</h2>
          <p>Aprovecha nuestras ofertas y encuentra tu próxima prenda favorita.</p>
          <a href="catalogo?ofertas=1" class="btn btn-blue">Ver ofertas</a>
        </div>`;
      return;
    }
    const sub = cart.reduce((s, i) => s + getProd(i.id).precio * i.qty, 0);
    const ahorro = cart.reduce((s, i) => { const p = getProd(i.id); return s + (p.antes ? (p.antes - p.precio) * i.qty : 0); }, 0);
    const envio = sub >= ENVIO_GRATIS ? 0 : COSTO_ENVIO;
    const falta = Math.max(0, ENVIO_GRATIS - sub);
    cartBox.innerHTML = `
      <div class="cart-layout">
        <div class="cart-list">
          ${cart.map((i, idx) => {
            const p = getProd(i.id);
            return `
            <div class="cart-item">
              <img src="${p.foto.replace("w=700", "w=200")}" alt="${p.nombre}" onerror="this.style.visibility='hidden'">
              <div>
                <h3><a href="producto?id=${p.id}">${p.nombre}</a></h3>
                <small>${p.color} · Talla ${i.talla} · ${soles(p.precio)} c/u</small>
                <div class="qty"><button data-idx="${idx}" data-q="-1" aria-label="Menos">−</button><span>${i.qty}</span><button data-idx="${idx}" data-q="1" aria-label="Más">+</button></div>
              </div>
              <div class="cart-right"><strong>${soles(p.precio * i.qty)}</strong><button class="remove" data-rm="${idx}">Eliminar</button></div>
            </div>`;
          }).join("")}
        </div>
        <aside class="summary">
          <h2>Resumen de compra</h2>
          <div class="sum-row"><span>Subtotal</span><span>${soles(sub)}</span></div>
          ${ahorro ? `<div class="sum-row save-row"><span>Estás ahorrando</span><span>${soles(ahorro)}</span></div>` : ""}
          <div class="sum-row"><span>Envío (Lima)</span><span>${envio ? soles(envio) : "Gratis"}</span></div>
          <div class="free-ship">${falta > 0 ? "Te faltan " + soles(falta) + " para el envío gratis" : "¡Tu pedido tiene envío gratis!"}
            <div class="ship-bar"><i style="width:${Math.min(100, sub / ENVIO_GRATIS * 100)}%"></i></div>
          </div>
          <div class="sum-row total"><span>Total</span><strong>${soles(sub + envio)}</strong></div>
          <form id="checkout" style="margin-top:18px">
            <label for="cNombre">Nombre *</label><input id="cNombre" required placeholder="Tu nombre">
            <label for="cDistrito">Distrito *</label><input id="cDistrito" required placeholder="Ej. Los Olivos">
            <label for="cDir">Dirección *</label><input id="cDir" required placeholder="Calle, número, referencia">
            <label>Forma de pago</label>
            <div class="pay-options">
              <label class="pay-opt"><input type="radio" name="pago" value="Yape / Plin" checked> Yape / Plin</label>
              <label class="pay-opt"><input type="radio" name="pago" value="Transferencia bancaria"> Transferencia bancaria</label>
              <label class="pay-opt"><input type="radio" name="pago" value="Tarjeta (link de pago)"> Tarjeta (link de pago)</label>
            </div>
            <button class="btn btn-green btn-block" type="submit">Finalizar pedido por WhatsApp</button>
            <p class="note">Te confirmamos stock y te enviamos los datos de pago por WhatsApp.</p>
          </form>
        </aside>
      </div>`;

    $("#checkout").addEventListener("submit", e => {
      e.preventDefault();
      const lines = cart.map(i => {
        const p = getProd(i.id);
        return "• " + p.nombre + " (" + p.color + ", talla " + i.talla + ") x" + i.qty + " = " + soles(p.precio * i.qty);
      }).join("\n");
      const msg = "Hola " + TIENDA + " 👋 Quiero hacer este pedido:\n\n" + lines +
        "\n\nSubtotal: " + soles(sub) + "\nEnvío: " + (envio ? soles(envio) : "Gratis") +
        "\nTOTAL: " + soles(sub + envio) +
        "\n\nNombre: " + $("#cNombre").value + "\nDistrito: " + $("#cDistrito").value +
        "\nDirección: " + $("#cDir").value + "\nPago: " + $('input[name="pago"]:checked').value;
      window.open(waLink(msg), "_blank");
    });
  }
  cartBox.addEventListener("click", e => {
    const cart = readCart();
    const q = e.target.closest("[data-q]");
    const rm = e.target.closest("[data-rm]");
    if (q) {
      const item = cart[q.dataset.idx];
      item.qty += Number(q.dataset.q);
      if (item.qty < 1) cart.splice(q.dataset.idx, 1);
    } else if (rm) {
      cart.splice(rm.dataset.rm, 1);
    } else return;
    saveCart(cart);
    drawCart();
  });
  drawCart();
}

/* ---------- Contacto y boletín ---------- */
const contactForm = $("#contactForm");
if (contactForm) contactForm.addEventListener("submit", e => {
  e.preventDefault();
  window.open(waLink("Hola " + TIENDA + " 👋\nNombre: " + $("#fNombre").value +
    "\nAsunto: " + $("#fAsunto").value + "\nMensaje: " + $("#fMensaje").value), "_blank");
});
$$(".news-form").forEach(f => f.addEventListener("submit", e => {
  e.preventDefault();
  f.innerHTML = "<p style='padding:10px 12px;color:var(--blue);font-weight:700'>¡Listo! Te avisaremos de las próximas ofertas.</p>";
}));

/* ---------- WhatsApp, menú y año ---------- */
$$(".wa-link").forEach(a => {
  a.href = waLink(a.dataset.msg || "Hola " + TIENDA + " 👋 Quiero información sobre sus productos.");
  a.target = "_blank"; a.rel = "noopener";
});
$("#hamburger")?.addEventListener("click", () => $("#menu").classList.toggle("open"));
$$(".year").forEach(el => el.textContent = new Date().getFullYear());
updateBadge();
