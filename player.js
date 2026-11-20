(() => {
"use strict";
const CH = window.FROM_CHARACTERS;
const KEY = "fromdread.player";
const $ = (s) => document.querySelector(s);
const esc = (v) => String(v ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const gt = (s, g) => String(s).replace(/\{([^|}]*)\|([^}]*)\}/g, (_, m, f) => (g === "f" ? f : m));
const load = () => { try { return JSON.parse(localStorage.getItem(KEY)); } catch { return null; } };
const save = () => { try { localStorage.setItem(KEY, JSON.stringify(f)); } catch {} };

let f = load() || {};
f = { pid: f.pid || Date.now().toString(36) + Math.random().toString(36).slice(2, 6), name: "", gender: "m", who: "", secret: "", answers: [], ...f };
if (f.v !== 2) { f.answers = []; f.v = 2; }
let mode = "edit";

function toast(msg) {
  const t = document.createElement("div");
  t.className = "toast"; t.setAttribute("role", "status"); t.textContent = msg;
  document.body.appendChild(t); setTimeout(() => t.remove(), 2600);
}
function code() {
  const payload = { v: 2, pid: f.pid, name: f.name, gender: f.gender, who: f.who, secret: f.secret, answers: CH.questions.map((_, i) => (f.answers || [])[i] || "") };
  return "FROM1:" + btoa(unescape(encodeURIComponent(JSON.stringify(payload))));
}
const message = () => `השאלון של ${f.name} למשחק From. הדביקו את כל ההודעה בערכת המנחה:\n${code()}`;

function render() {
  const g = f.gender;
  const head = `
    <header class="pf-hero">
      <div class="label">From · שאלון דמות</div>
      <h1>לפני שהרכב עוצר</h1>
      <p>${esc(CH.intro)}</p>
    </header>`;
  if (mode === "send") {
    $("#root").innerHTML = `<div class="wrap"><div class="pf">${head}
      <div class="panel stack">
        <h2>שלחו את השאלון למנחה</h2>
        <p class="muted">${esc(f.name)}. שלחו למנחה את ההודעה הזו בוואטסאפ. אם תשנו תשובות, פשוט שלחו שוב.</p>
        <div class="row">
          ${navigator.share ? `<button class="btn primary" data-a="share">שליחה…</button>` : ""}
          <a class="btn ${navigator.share ? "" : "primary"}" href="https://wa.me/?text=${encodeURIComponent(message())}" target="_blank" rel="noopener">שליחה בוואטסאפ</a>
          <button class="btn" data-a="copy">העתקה</button>
        </div>
        <div class="code-box" id="codebox">${esc(message())}</div>
        <div><button class="btn ghost" data-a="back">חזרה לשאלון</button></div>
      </div></div></div>`;
    return;
  }
  const ta = (attrs, val, rows = 3) => `<textarea ${attrs} rows="${rows}" style="min-height:${rows * 26}px">${esc(val || "")}</textarea>`;
  $("#root").innerHTML = `<div class="wrap"><div class="pf">${head}
    <div class="stack" style="gap:26px">
      <div class="q"><label for="pf-name">איך קוראים לדמות שלך?</label><input type="text" id="pf-name" data-k="name" value="${esc(f.name)}" autocomplete="off"></div>
      <div class="q"><span class="label">איך לפנות לדמות?</span><div class="seg" role="group"><button data-a="g" data-v="m" aria-pressed="${g !== "f"}">בלשון זכר</button><button data-a="g" data-v="f" aria-pressed="${g === "f"}">בלשון נקבה</button></div></div>
      <div class="q"><label for="pf-who">${esc(gt(CH.who, g))}</label>${ta('id="pf-who" data-k="who"', f.who, 4)}</div>
      ${CH.questions.map((qq, i) => `<div class="q"><label for="pf-a${i}">${i + 1}. ${esc(gt(qq.q, g))}</label>${ta(`id="pf-a${i}" data-ai="${i}"`, (f.answers || [])[i])}</div>`).join("")}
      <div class="q secret"><label for="pf-secret">${esc(gt(CH.secret, g))}</label><span class="hint">רק המנחה יראה את זה. אף שחקן אחר לא.</span>${ta('id="pf-secret" data-k="secret"', f.secret)}</div>
      <div><button class="btn primary" data-a="submit" style="padding:12px 22px;font-size:1.05rem">שליחה למנחה</button></div>
      <p class="muted" style="font-size:.85rem">התשובות נשמרות בטלפון שלך, אז אפשר לחזור ולערוך ולשלוח שוב.</p>
    </div></div></div>`;
}

document.addEventListener("input", (e) => {
  const t = e.target;
  if (t.dataset.k) f[t.dataset.k] = t.value;
  if (t.dataset.ai != null) { f.answers = f.answers || []; f.answers[+t.dataset.ai] = t.value; }
  save();
});
document.addEventListener("click", async (e) => {
  const t = e.target.closest("[data-a]"); if (!t) return;
  const k = t.dataset.a;
  if (k === "g") { f.gender = t.dataset.v; save(); render(); }
  else if (k === "submit") {
    if (!f.name.trim()) { toast("חסר שם לדמות"); $("#pf-name").focus(); return; }
    mode = "send"; render(); scrollTo({ top: 0 });
  }
  else if (k === "back") { mode = "edit"; render(); }
  else if (k === "share") { try { await navigator.share({ text: message() }); } catch {} }
  else if (k === "copy") {
    try { await navigator.clipboard.writeText(message()); toast("הועתק"); }
    catch { const r = document.createRange(); r.selectNodeContents($("#codebox")); const s = getSelection(); s.removeAllRanges(); s.addRange(r); toast("סמנו והעתיקו ידנית"); }
  }
});
render();
})();
