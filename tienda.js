/* =========================================================
   NARA — Datos de la tienda (demo o Firebase) y pagos
   Todo lo que edites en el PANEL se ve aquí: productos, tallas,
   stock, categorías, logo, banners, Yape/Plin, cuentas y envíos.
   ========================================================= */
const CFG = window.FIREBASE_CONFIG || {}, DEMO = !CFG.apiKey || String(CFG.apiKey).startsWith("PEGA");
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const FB_V = "10.12.2"; let FBX = null;
async function fb() {
  if (FBX) return FBX;
  const base = `https://www.gstatic.com/firebasejs/${FB_V}/`;
  const [app, fs] = await Promise.all([import(base + "firebase-app.js"), import(base + "firebase-firestore.js")]);
  FBX = { fs, db: fs.getFirestore(app.getApps().length ? app.getApp() : app.initializeApp(CFG)) }; return FBX;
}
const LDB = { get() { let d = null; try { d = JSON.parse(localStorage.getItem("nara_db")); } catch (e) {} if (!d) { d = window.NARA_SEMILLA(); try { localStorage.setItem("nara_db", JSON.stringify(d)); } catch (e) {} } return d; },
  save(d) { try { localStorage.setItem("nara_db", JSON.stringify(d)); } catch (e) {} } };
const lista = o => Object.entries(o || {}).map(([id, v]) => ({ ...v, id }));
const codigo = (p = "NR") => p + "-" + Array.from(crypto.getRandomValues(new Uint8Array(6)), b => "23456789ABCDEFGHJKMNPQRSTUVWXYZ"[b % 31]).join("");

function ejemploCatalogo() {
  const d = window.NARA_SEMILLA ? (window.NARA_DEMO_PEDIDOS = false, window.NARA_SEMILLA()) : { categorias: {}, productos: {} };
  return { cats: lista(d.categorias), prods: lista(d.productos) };
}
const DB = {
  async catalogo() {
    const A = window.NARA_AJUSTES || {};
    if (DEMO) { const d = LDB.get(); return { aj: { ...A, ...(d.ajustes.general || {}) }, cats: lista(d.categorias), prods: lista(d.productos) }; }
    try { const c = JSON.parse(sessionStorage.getItem("nara_cat")); if (c && Date.now() - c.t < 90000) return c.d; } catch (e) {}
    try {
      const { fs, db } = await fb(), g = async n => (await fs.getDocs(fs.collection(db, n))).docs.map(x => ({ ...x.data(), id: x.id }));
      const [aj, cats, prods] = await Promise.all([fs.getDoc(fs.doc(db, "ajustes", "general")).then(x => x.exists() ? x.data() : {}), g("categorias"), g("productos")]);
      const ej = (!cats.length || !prods.length) ? ejemploCatalogo() : null;
      const out = { aj: { ...A, ...aj }, cats: cats.length ? cats : ej.cats, prods: prods.length ? prods : ej.prods };
      try { sessionStorage.setItem("nara_cat", JSON.stringify({ t: Date.now(), d: out })); } catch (e) {}
      return out;
    } catch (e) { console.warn("Firebase:", e.message); const ej = ejemploCatalogo(); return { aj: A, cats: ej.cats, prods: ej.prods }; }
  },
  async crearPedido(p, captura) {
    if (DEMO) { const d = LDB.get(); d.pedidos[p.codigo] = p; if (captura) d.capturas[p.codigo] = { pedido: p.codigo, captura }; LDB.save(d); return p; }
    const { fs, db } = await fb(), b = fs.writeBatch(db);
    b.set(fs.doc(db, "pedidos", p.codigo), p); if (captura) b.set(fs.doc(db, "capturas", p.codigo), { pedido: p.codigo, captura });
    await b.commit(); return p;
  },
  async pedido(c) {
    c = String(c || "").trim().toUpperCase(); if (!c) return null;
    if (DEMO) { const p = LDB.get().pedidos[c]; return p ? { ...p, codigo: c } : null; }
    const { fs, db } = await fb(), x = await fs.getDoc(fs.doc(db, "pedidos", c)); return x.exists() ? { ...x.data(), codigo: c } : null;
  },
  async fotosProducto(id) {   // fotos extra (se cargan solo al abrir el producto)
    try { if (DEMO) return ((LDB.get().fotos_prod || {})[id] || {}).fotos || [];
      const { fs, db } = await fb(), x = await fs.getDoc(fs.doc(db, "fotos_prod", String(id))); return x.exists() ? x.data().fotos || [] : []; } catch (e) { return []; }
  },
  async mensaje(m) {
    const id = codigo("MS");
    if (DEMO) { const d = LDB.get(); d.mensajes[id] = m; LDB.save(d); return id; }
    const { fs, db } = await fb(); await fs.setDoc(fs.doc(db, "mensajes", id), m); return id;
  }
};

/* ---------- Pago con Yape / Plin / transferencia + lectura de la captura ---------- */
const BANCOS = { BCP: ["#0033a0", "#ff7800"], Interbank: ["#00a94f", "#0039a6"], BBVA: ["#072146", "#1973b8"], Scotiabank: ["#ec111a", "#9b0a10"], BanBif: ["#003b7a", "#e4002b"], Pichincha: ["#ffdd00", "#0f265c"] };
function cargarScript(src) { return new Promise((ok, no) => { if (document.querySelector(`script[src="${src}"]`)) return ok(); const s = document.createElement("script"); s.src = src; s.onload = ok; s.onerror = no; document.head.appendChild(s); }); }
async function qrCanvas(texto, px = 220, color = "#111") {
  await cargarScript("https://cdnjs.cloudflare.com/ajax/libs/qrcode-generator/1.4.4/qrcode.min.js");
  const q = qrcode(0, "M"); q.addData(texto); q.make();
  const n = q.getModuleCount(), m = 2, k = Math.max(1, Math.floor(px / (n + m * 2))), c = document.createElement("canvas"); c.width = c.height = k * (n + m * 2);
  const g = c.getContext("2d"); g.fillStyle = "#fff"; g.fillRect(0, 0, c.width, c.height); g.fillStyle = color;
  for (let r = 0; r < n; r++) for (let col = 0; col < n; col++) if (q.isDark(r, col)) g.fillRect((col + m) * k, (r + m) * k, k, k);
  return c;
}
function Pago(box, aj, opts = {}) {
  const P = { met: "", banco: "", img: "", ocr: null, leyendo: false, monto: 0, op: "", forzar: false, demo: {} };
  const cuentas = () => (aj.cuentas || []).filter(c => c && c.banco && (c.num || c.cci)), cuentaSel = () => cuentas().find(c => c.id === P.banco) || null;
  const metodos = () => [aj.pagoYape !== false ? "Yape" : "", aj.pagoPlin !== false ? "Plin" : "", aj.pagoTransf !== false && cuentas().length ? "Transferencia" : "", aj.contraEntrega !== false && opts.contraEntrega ? "Contra entrega" : ""].filter(Boolean);
  const qrDe = m => m === "Plin" ? { qr: aj.plinQR || P.demo.Plin, num: aj.plinNum, tit: aj.plinTitular } : { qr: aj.yapeQR || P.demo.Yape, num: aj.yapeNum, tit: aj.yapeTitular };
  const logoB = c => { const [c1, c2] = BANCOS[c.banco] || ["#082a7a", "#2fc4d4"]; return c.logo ? `<img src="${esc(c.logo)}" alt="${esc(c.banco)}">` : `<span class="bk-mark" style="--b1:${c1};--b2:${c2}"><i></i>${esc(c.banco)}</span>`; };
  const soles = n => "S/ " + (+n || 0).toFixed(2);
  async function pintar() {
    const mets = metodos(); if (!mets.includes(P.met)) P.met = mets[0] || "";
    if (!aj.yapeQR && !P.demo.Yape) try { P.demo.Yape = (await qrCanvas("DEMO Yape", 220, "#5b1a6b")).toDataURL(); P.demo.Plin = (await qrCanvas("DEMO Plin", 220, "#007c8a")).toDataURL(); } catch (e) {}
    const tr = P.met === "Transferencia", ce = P.met === "Contra entrega", cb = cuentaSel(), q = qrDe(P.met);
    box.innerHTML = `<div class="pg-tabs" role="tablist">${mets.map(m => `<button type="button" role="tab" aria-selected="${m === P.met}" class="pg-tab ${m === P.met ? "on" : ""} t-${m.toLowerCase().replace(/\s/g, "")}" data-met="${m}">${m}</button>`).join("")}</div>
      ${ce ? `<div class="pg-ce"><b>Pagas al recibir tu pedido</b><span>En efectivo, Yape, Plin o tarjeta (POS) al momento de la entrega o del recojo en tienda.</span></div>`
      : tr ? `<div class="pg-bk"><b>1. Elige tu banco y transfiere</b><small>Toca el logo: copiamos el número de cuenta y abrimos la página de tu banco.</small>
          <div class="bk-logos">${cuentas().map(c => `<button type="button" class="bk ${cb && cb.id === c.id ? "on" : ""}" data-banco="${esc(c.id)}" aria-label="${esc(c.banco)}">${logoB(c)}</button>`).join("")}</div>
          ${cb ? `<div class="bk-det">${cb.num ? `<div class="bk-row"><span>Cuenta ${esc(cb.banco)}</span><b>${esc(cb.num)}</b><button type="button" class="btn-copy" data-copy="${esc(String(cb.num).replace(/\D/g, ""))}">Copiar</button></div>` : ""}
            ${cb.cci ? `<div class="bk-row"><span>CCI · desde otro banco</span><b>${esc(cb.cci)}</b><button type="button" class="btn-copy" data-copy="${esc(String(cb.cci).replace(/\D/g, ""))}">Copiar</button></div>` : ""}
            <small>A nombre de <b>${esc(cb.titular || "")}</b></small>${cb.url ? `<a class="btn btn-dark" href="${esc(cb.url)}" target="_blank" rel="noopener" style="padding:9px 14px;font-size:.9rem">Ir a ${esc(cb.banco)} para pagar ↗</a>` : ""}</div>` : `<p class="note">👆 Elige el banco al que vas a transferir</p>`}</div>`
      : `<div class="pg-qr ${P.met.toLowerCase()}"><img src="${esc(q.qr || "")}" alt="QR ${P.met}"><div><b>1. Escanea el QR con ${P.met}</b><span>o ${P.met === "Plin" ? "plinea" : "yapea"} al número:</span>
          <div class="pg-num"><b>${esc(q.num || "")}</b><button type="button" class="btn-copy" data-copy="${esc(String(q.num || "").replace(/\D/g, ""))}">Copiar</button></div><small>A nombre de <b>${esc(q.tit || "")}</b></small></div></div>`}
      ${ce ? "" : `<div class="pg-monto"><span>2. Monto a pagar</span><b>${soles(P.monto)}</b></div>
      <label class="pg-up ${P.img ? "ok" : ""}"><span>3. Sube ${tr ? "la constancia de la transferencia" : "la captura del pago"} *</span><input type="file" accept="image/*" id="pgFile">${P.img ? `<img src="${P.img}" alt="Tu captura">` : `<em>📷 Elegir imagen</em>`}</label>
      <div class="pg-ocr" id="pgOcr" aria-live="polite"></div>
      <label for="pgOp">Número de operación <small style="font-weight:400;color:var(--muted)">(lo leemos de tu captura)</small></label><input id="pgOp" maxlength="16" inputmode="numeric" value="${esc(P.op)}">`}`;
    revisar(); opts.onChange && opts.onChange();
  }
  function revisar() {
    const b = box.querySelector("#pgOcr"); if (!b) return; const mb = box.querySelector(".pg-monto b"); if (mb) mb.textContent = soles(P.monto);
    if (P.leyendo) { b.className = "pg-ocr"; b.innerHTML = "⏳ Leyendo tu captura…"; return; }
    if (!P.img) { b.className = "pg-ocr"; b.innerHTML = ""; return; }
    const o = P.ocr; if (!o || !o.montos.length) { b.className = "pg-ocr warn"; b.innerHTML = "No pudimos leer el monto. Revisaremos tu captura a mano."; return; }
    o.coincide = o.montos.some(x => Math.abs(x - P.monto) < 0.01); b.className = "pg-ocr " + (o.coincide ? "ok" : "bad");
    b.innerHTML = o.coincide ? `✓ El monto de tu captura (${soles(P.monto)}) coincide.${o.fechaOk === false ? " <b>Ojo: la fecha no es de hoy.</b>" : ""}`
      : `Tu captura dice <b>${o.montos.map(soles).join(" / ")}</b> y el total es <b>${soles(P.monto)}</b>.<label class="chk"><input type="checkbox" id="pgForzar" ${P.forzar ? "checked" : ""}> Mi captura es correcta, que la revisen</label>`;
  }
  async function leer(src) {
    if (aj.pagoOCR === false) return null;
    if (!window.Tesseract) await cargarScript("https://cdn.jsdelivr.net/npm/tesseract.js@5.1.1/dist/tesseract.min.js");
    const r = await Promise.race([window.Tesseract.recognize(src, "spa"), new Promise((_, no) => setTimeout(() => no(new Error("tiempo")), 30000))]);
    const tx = (r && r.data && r.data.text) || "";
    const montos = [...new Set([...tx.matchAll(/S\s*\/\.?\s*(\d{1,6}(?:[.,]\d{3})*(?:[.,]\d{1,2})?)/gi)].map(x => { let v = x[1]; if (/[.,]\d{3}([.,]|$)/.test(v)) v = v.replace(/[.,](?=\d{3})/g, ""); return +v.replace(",", "."); }).filter(x => x > 0))];
    const op = (tx.match(/operaci[oó]n\D{0,25}(\d{6,14})/i) || tx.match(/\b(\d{8})\b/) || [])[1] || "";
    const MESES = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "set", "oct", "nov", "dic"], fm = tx.match(/(\d{1,2})\s*(?:de\s*)?(ene|feb|mar|abr|may|jun|jul|ago|set|sep|oct|nov|dic)[a-z]*\.?/i);
    let fechaOk = null; if (fm) { const mi = MESES.indexOf(fm[2].toLowerCase().replace("sep", "set")), d = new Date(), ay = new Date(Date.now() - 864e5); fechaOk = [d, ay].some(x => x.getDate() === +fm[1] && x.getMonth() === mi); }
    return { montos, op, fechaOk };
  }
  const comprimir = file => new Promise((ok, no) => { const fr = new FileReader(); fr.onerror = no; fr.onload = () => { const im = new Image(); im.onerror = no; im.onload = () => {
    const k = Math.min(1, 1100 / Math.max(im.width, im.height)), c = document.createElement("canvas"); c.width = Math.round(im.width * k); c.height = Math.round(im.height * k);
    c.getContext("2d").drawImage(im, 0, 0, c.width, c.height); let q = .75, u = c.toDataURL("image/jpeg", q); while (u.length > 650000 && q > .35) { q -= .1; u = c.toDataURL("image/jpeg", q); } ok(u); }; im.src = fr.result; }; fr.readAsDataURL(file); });
  box.addEventListener("change", async e => {
    if (e.target.id === "pgForzar") { P.forzar = e.target.checked; return; }
    if (e.target.id !== "pgFile") return; const f = e.target.files[0]; if (!f) return;
    P.op = box.querySelector("#pgOp")?.value || P.op;
    try { P.img = await comprimir(f); } catch (er) { return alert("No se pudo abrir la imagen"); }
    P.ocr = null; P.leyendo = true; P.forzar = false; await pintar();
    try { P.ocr = await leer(P.img); } catch (er) { P.ocr = null; }
    P.leyendo = false; if (P.ocr && P.ocr.op && !P.op) P.op = P.ocr.op; await pintar();
  });
  box.addEventListener("input", e => { if (e.target.id === "pgOp") P.op = e.target.value; });
  box.addEventListener("click", e => {
    const m = e.target.closest("[data-met]"); if (m) { P.op = box.querySelector("#pgOp")?.value || P.op; P.met = m.dataset.met; return pintar(); }
    const bk = e.target.closest("[data-banco]"); if (bk) { P.banco = bk.dataset.banco; const c = cuentaSel(); if (!c) return;
      navigator.clipboard?.writeText(String(c.num || c.cci || "").replace(/\D/g, "")).catch(() => {}); if (c.url) window.open(c.url, "_blank", "noopener"); P.op = box.querySelector("#pgOp")?.value || P.op; return pintar(); }
    const cp = e.target.closest("[data-copy]"); if (cp) { navigator.clipboard?.writeText(cp.dataset.copy).catch(() => {}); cp.textContent = "Copiado ✓"; setTimeout(() => cp.textContent = "Copiar", 1500); }
  });
  return {
    estado: P, pintar,
    setMonto(v) { P.monto = Math.round((+v || 0) * 100) / 100; revisar(); },
    validar() {
      if (!P.met) return "No hay formas de pago activas.";
      if (P.met === "Contra entrega") return "";
      if (P.met === "Transferencia" && !cuentaSel()) return "Elige el banco al que transferiste.";
      if (!P.img) return "Sube la captura de tu pago.";
      if (P.leyendo) return "Espera, estamos leyendo tu captura…";
      if (P.ocr && P.ocr.montos.length && !P.ocr.montos.some(x => Math.abs(x - P.monto) < 0.01) && !P.forzar) return "El monto de tu captura no coincide con el total. Revisa o marca que la revisen.";
      return "";
    },
    datos() { const o = P.ocr || {}, ce = P.met === "Contra entrega";
      return { pago: P.met, banco: P.met === "Transferencia" ? (cuentaSel() || {}).banco || "" : "", monto: P.monto, operacion: ce ? "" : (P.op || "").replace(/\D/g, "").slice(0, 16), captura: ce ? "" : P.img,
        montoLeido: o.montos && o.montos.length ? (o.montos.find(x => Math.abs(x - P.monto) < .01) ?? o.montos[0]) : null, coincide: o.montos && o.montos.length ? !!o.coincide : null, fechaOk: o.fechaOk ?? null }; }
  };
}
