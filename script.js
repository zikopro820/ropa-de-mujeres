/* =========================================================
   NARA Atelier — Funciones de la tienda (demo de ziko.pro)
   ⚠️ CAMBIA AQUÍ TUS DATOS
   ========================================================= */
const WHATSAPP     = "51999999999"; // código de país + número, sin + ni espacios
const COSTO_ENVIO  = 12;            // costo de envío en soles
const ENVIO_GRATIS = 250;           // envío gratis desde este monto

/* ---------- Utilidades ---------- */
const $  = (s, c = document) => c.querySelector(s);
const $$ = (s, c = document) => [...c.querySelectorAll(s)];
const soles = n => "S/ " + n.toFixed(2);
const waLink = txt => "https://wa.me/" + WHATSAPP + "?text=" + encodeURIComponent(txt);
const getProd = id => PRODUCTOS.find(p => p.id === Number(id));

/* ---------- Carrito (se guarda en el navegador) ---------- */
let memoryCart = [];
function readCart() {
  try { return JSON.parse(localStorage.getItem("nara_cart")) || []; } catch (e) { return memoryCart; }
}
function saveCart(cart) {
  memoryCart = cart;
  try { localStorage.setItem("nara_cart", JSON.stringify(cart)); } catch (e) {}
  updateBadge();
}
function addToCart(id, talla, qty = 1) {
  const cart = readCart();
  const item = cart.find(i => i.id === id && i.talla === talla);
  if (item) item.qty += qty; else cart.push({ id, talla, qty });
  saveCart(cart);
  const p = getProd(id);
  toast("Añadido a tu bolsa: " + p.nombre);
}
function updateBadge() {
  const n = readCart().reduce((s, i) => s + i.qty, 0);
  $$(".cart-count").forEach(el => { el.textContent = n || ""; el.dataset.n = n; });
}

/* ---------- Aviso flotante ---------- */
let toastTimer;
function toast(msg) {
  let t = $(".toast");
  if (!t) {
    t = document.createElement("div");
    t.className = "toast";
    document.body.appendChild(t);
  }
  t.innerHTML = "<span></span><a href='carrito'>Ver bolsa</a>";
  t.firstChild.textContent = msg;
  t.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove("show"), 2800);
}

/* ---------- Tarjeta de producto ---------- */
function productCard(p) {
  const badgeClass = p.badge === "Oferta" ? "sale" : p.badge === "Nuevo" ? "new" : "";
  return `
    <article class="product">
      <a class="product-img" href="producto?id=${p.id}">
        ${p.badge ? `<span class="badge ${badgeClass}">${p.badge}</span>` : ""}
        <img src="${p.foto}" alt="${p.nombre}" loading="lazy" onerror="this.style.display='none'">
      </a>
      <button class="quick-add" data-id="${p.id}">${p.tallas.length > 1 ? "Elegir talla" : "Agregar a la bolsa"}</button>
      <div class="product-info">
        <div><h3><a href="producto?id=${p.id}">${p.nombre}</a></h3><span class="product-cat">${p.color}</span></div>
        <div class="price${p.antes ? " sale" : ""}"><strong>${soles(p.precio)}</strong>${p.antes ? `<del>${soles(p.antes)}</del>` : ""}</div>
      </div>
    </article>`;
}
// El botón "+" se ubica sobre la foto
document.addEventListener("click", e => {
  const btn = e.target.closest(".quick-add");
  if (!btn) return;
  const p = getProd(btn.dataset.id);
  if (p.tallas.length > 1) { location.href = "producto?id=" + p.id; return; }
  addToCart(p.id, p.tallas[0], 1);
});
function placeQuickAdd(container) {
  $$(".product", container).forEach(card => {
    const img = $(".product-img", card), btn = $(".quick-add", card);
    if (img && btn) img.appendChild(btn);
    if (btn) btn.addEventListener("click", ev => ev.preventDefault());
  });
}
function renderGrid(el, list) {
  el.innerHTML = list.length ? list.map(productCard).join("") :
    `<div class="empty"><h3>Sin resultados</h3><p>Prueba con otra búsqueda o categoría.</p></div>`;
  placeQuickAdd(el);
}

/* ---------- Inicio: destacados ---------- */
const featured = $("#featured");
if (featured) renderGrid(featured, PRODUCTOS.filter(p => p.badge).slice(0, 8));

/* ---------- Catálogo ---------- */
const grid = $("#catalogGrid");
if (grid) {
  const params = new URLSearchParams(location.search);
  let cat = params.get("cat") || "todos";
  let query = "";
  let order = "relevancia";

  const chips = $("#chips");
  chips.innerHTML = `<button class="chip" data-cat="todos">Todo</button>` +
    Object.entries(CATEGORIAS).map(([k, v]) => `<button class="chip" data-cat="${k}">${v}</button>`).join("");

  function draw() {
    $$(".chip", chips).forEach(c => c.classList.toggle("active", c.dataset.cat === cat));
    let list = PRODUCTOS.filter(p =>
      (cat === "todos" || p.cat === cat) &&
      p.nombre.toLowerCase().includes(query.toLowerCase()));
    if (order === "menor") list = [...list].sort((a, b) => a.precio - b.precio);
    if (order === "mayor") list = [...list].sort((a, b) => b.precio - a.precio);
    if (order === "ofertas") list = list.filter(p => p.antes);
    $("#resultCount").textContent = list.length + (list.length === 1 ? " producto" : " productos");
    renderGrid(grid, list);
  }
  chips.addEventListener("click", e => {
    const c = e.target.closest(".chip");
    if (!c) return;
    cat = c.dataset.cat;
    history.replaceState(null, "", cat === "todos" ? "catalogo" : "catalogo?cat=" + cat);
    draw();
  });
  $("#search").addEventListener("input", e => { query = e.target.value; draw(); });
  $("#order").addEventListener("change", e => { order = e.target.value; draw(); });
  draw();
}

/* ---------- Página de producto ---------- */
const pdp = $("#pdp");
if (pdp) {
  const p = getProd(new URLSearchParams(location.search).get("id")) || PRODUCTOS[0];
  document.title = p.nombre + " | NARA Atelier";
  $("#crumbName").textContent = p.nombre;
  let talla = p.tallas.length === 1 ? p.tallas[0] : null;
  let qty = 1;
  pdp.innerHTML = `
    <div class="pdp-img"><img src="${p.foto.replace("w=900", "w=1400")}" alt="${p.nombre}" onerror="this.style.display='none'"></div>
    <div class="pdp-info">
      <a class="eyebrow" href="catalogo?cat=${p.cat}">${CATEGORIAS[p.cat]}</a>
      <h1>${p.nombre}</h1>
      <div class="price${p.antes ? " sale" : ""}"><strong>${soles(p.precio)}</strong>${p.antes ? `<del>${soles(p.antes)}</del>` : ""}</div>
      <p class="desc">${p.desc}</p>
      <div class="opt-label"><span>Color: ${p.color}</span></div>
      <div class="opt-label" style="margin-top:22px"><span>Talla</span>${p.tallas.length > 1 ? '<a href="guia-de-tallas">Guía de tallas</a>' : ""}</div>
      <div class="sizes">${p.tallas.map(t => `<button class="size${t === talla ? " active" : ""}" data-t="${t}">${t}</button>`).join("")}</div>
      <p class="size-warn" id="sizeWarn">Selecciona una talla para continuar.</p>
      <div class="buy-row">
        <div class="qty"><button data-q="-1" aria-label="Menos">−</button><span id="qty">1</span><button data-q="1" aria-label="Más">+</button></div>
        <button class="btn btn-dark" id="addBtn">Añadir a la bolsa</button>
      </div>
      <a class="btn btn-line btn-block" id="buyWa" target="_blank" rel="noopener">Comprar por WhatsApp</a>
      <div class="details">
        <details open><summary>Detalles y cuidado</summary><p>Lavar a mano o en ciclo delicado con agua fría. No usar secadora. Planchar a temperatura baja por el revés.</p></details>
        <details><summary>Envíos</summary><p>Envíos a todo Lima en 24 a 48 horas hábiles y a provincias en 2 a 5 días. Envío gratis en Lima desde S/ 250.</p></details>
        <details><summary>Cambios y devoluciones</summary><p>Puedes cambiar tu prenda dentro de los 15 días, sin uso y con etiquetas. Escríbenos por WhatsApp y te ayudamos.</p></details>
      </div>
    </div>`;

  const waUpdate = () => {
    $("#buyWa").href = waLink("Hola NARA Atelier ✨ Quiero comprar:\n• " + p.nombre +
      "\nColor: " + p.color + "\nTalla: " + (talla || "por definir") + "\nCantidad: " + qty + "\nPrecio: " + soles(p.precio * qty));
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
    .concat(PRODUCTOS.filter(x => x.cat !== p.cat && x.id !== p.id)).slice(0, 4);
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
          <h2>Tu bolsa está vacía</h2>
          <p>Descubre la nueva colección y encuentra tu próxima prenda favorita.</p>
          <a href="catalogo" class="btn btn-dark">Ver la colección</a>
        </div>`;
      return;
    }
    const sub = cart.reduce((s, i) => s + getProd(i.id).precio * i.qty, 0);
    const envio = sub >= ENVIO_GRATIS ? 0 : COSTO_ENVIO;
    const falta = Math.max(0, ENVIO_GRATIS - sub);
    cartBox.innerHTML = `
      <div class="cart-layout">
        <div>
          <div class="cart-head"><span>Producto</span><span>Cantidad</span><span>Total</span></div>
          ${cart.map((i, idx) => {
            const p = getProd(i.id);
            return `
            <div class="cart-item">
              <div class="cart-prod">
                <img src="${p.foto.replace("w=900", "w=240")}" alt="${p.nombre}" onerror="this.style.visibility='hidden'">
                <div><h3><a href="producto?id=${p.id}">${p.nombre}</a></h3><small>${p.color} · Talla ${i.talla}</small><small>${soles(p.precio)}</small></div>
              </div>
              <div class="qty"><button data-idx="${idx}" data-q="-1" aria-label="Menos">−</button><span>${i.qty}</span><button data-idx="${idx}" data-q="1" aria-label="Más">+</button></div>
              <div class="cart-total"><strong>${soles(p.precio * i.qty)}</strong><button class="remove" data-rm="${idx}">Quitar</button></div>
            </div>`;
          }).join("")}
          <a href="catalogo" class="link-u" style="display:inline-block;margin-top:30px">← Seguir comprando</a>
        </div>
        <aside class="summary">
          <h2>Resumen</h2>
          <div class="sum-row"><span>Subtotal</span><span>${soles(sub)}</span></div>
          <div class="sum-row"><span>Envío (Lima)</span><span>${envio ? soles(envio) : "Gratis"}</span></div>
          <div class="free-ship">${falta > 0 ? "Te faltan " + soles(falta) + " para el envío gratis." : "Tu pedido tiene envío gratis."}
            <div class="ship-bar"><i style="width:${Math.min(100, sub / ENVIO_GRATIS * 100)}%"></i></div>
          </div>
          <div class="sum-row total"><span>Total</span><span>${soles(sub + envio)}</span></div>
          <form id="checkout" style="margin-top:28px">
            <label for="cNombre">Nombre *</label><input id="cNombre" required placeholder="Tu nombre">
            <label for="cDistrito">Distrito *</label><input id="cDistrito" required placeholder="Ej. San Isidro">
            <label for="cDir">Dirección *</label><input id="cDir" required placeholder="Calle, número, referencia">
            <label>Forma de pago</label>
            <div class="pay-options">
              <label class="pay-opt"><input type="radio" name="pago" value="Yape / Plin" checked> Yape / Plin</label>
              <label class="pay-opt"><input type="radio" name="pago" value="Transferencia bancaria"> Transferencia bancaria</label>
              <label class="pay-opt"><input type="radio" name="pago" value="Tarjeta (link de pago)"> Tarjeta (link de pago)</label>
            </div>
            <button class="btn btn-dark btn-block" type="submit">Finalizar pedido por WhatsApp</button>
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
      const msg = "Hola NARA Atelier ✨ Quiero hacer este pedido:\n\n" + lines +
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

/* ---------- Formulario de contacto ---------- */
const contactForm = $("#contactForm");
if (contactForm) {
  contactForm.addEventListener("submit", e => {
    e.preventDefault();
    window.open(waLink("Hola NARA Atelier ✨\nNombre: " + $("#fNombre").value +
      "\nAsunto: " + $("#fAsunto").value + "\nMensaje: " + $("#fMensaje").value), "_blank");
  });
}

/* ---------- Boletín ---------- */
$$(".news-form").forEach(f => f.addEventListener("submit", e => {
  e.preventDefault();
  f.innerHTML = "<p style='padding:16px 4px'>¡Gracias! Te escribiremos pronto ✨</p>";
}));

/* ---------- Enlaces de WhatsApp, menú, año y animaciones ---------- */
$$(".wa-link").forEach(a => {
  a.href = waLink(a.dataset.msg || "Hola NARA Atelier ✨ Quiero información sobre la colección.");
  a.target = "_blank"; a.rel = "noopener";
});
const menu = $("#menu");
$("#hamburger")?.addEventListener("click", () => menu.classList.toggle("open"));
$$(".year").forEach(el => el.textContent = new Date().getFullYear());
if ("IntersectionObserver" in window) {
  const io = new IntersectionObserver(entries => entries.forEach(en => {
    if (en.isIntersecting) { en.target.classList.add("visible"); io.unobserve(en.target); }
  }), { threshold: 0.1 });
  $$(".reveal:not(.visible)").forEach(el => io.observe(el));
} else {
  $$(".reveal").forEach(el => el.classList.add("visible"));
}
updateBadge();
