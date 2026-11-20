(() => {
"use strict";
const KEY = "fromdread.key";
const gate = document.getElementById("gate");
const te = new TextEncoder();
const unb64 = (s) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));
const b64 = (u) => btoa(String.fromCharCode(...new Uint8Array(u)));

async function decrypt(bundle, rawKey) {
  const key = await crypto.subtle.importKey("raw", rawKey, "AES-GCM", false, ["decrypt"]);
  const pt = await crypto.subtle.decrypt({ name: "AES-GCM", iv: unb64(bundle.iv) }, key, unb64(bundle.ct));
  return new TextDecoder().decode(pt);
}
async function deriveRaw(bundle, pw) {
  const base = await crypto.subtle.importKey("raw", te.encode(pw.trim().normalize("NFC")), "PBKDF2", false, ["deriveKey"]);
  const key = await crypto.subtle.deriveKey({ name: "PBKDF2", salt: unb64(bundle.salt), iterations: bundle.iter, hash: "SHA-256" }, base, { name: "AES-GCM", length: 256 }, true, ["decrypt"]);
  return new Uint8Array(await crypto.subtle.exportKey("raw", key));
}
function run(code) {
  const s = document.createElement("script");
  s.textContent = code;
  document.body.appendChild(s);
}
function ask(bundle, wrong) {
  gate.innerHTML = `
    <form id="pwf" class="stack" style="gap:14px;max-width:340px;margin:0 auto;text-align:center">
      <h2>From · ערכת מנחה</h2>
      <p class="muted">רק למנחה. שחקנים, השאלון שלכם נמצא <a href="player.html">כאן</a>.</p>
      <input type="password" id="pw" autocomplete="current-password" placeholder="סיסמה" aria-label="סיסמה" style="text-align:center">
      ${wrong ? `<p style="color:var(--blood);margin:0">סיסמה שגויה</p>` : ""}
      <button class="btn primary" type="submit">כניסה</button>
    </form>`;
  const input = document.getElementById("pw");
  input.focus();
  document.getElementById("pwf").onsubmit = async (e) => {
    e.preventDefault();
    gate.querySelector("button").disabled = true;
    try {
      const raw = await deriveRaw(bundle, input.value);
      const code = await decrypt(bundle, raw);
      try { localStorage.setItem(KEY, b64(raw)); } catch {}
      run(code);
    } catch { ask(bundle, true); }
  };
}
(async () => {
  let bundle;
  try { bundle = await (await fetch("gm.enc.json", { cache: "no-store" })).json(); }
  catch { gate.innerHTML = `<h2>לא הצלחתי לטעון את הערכה</h2><p class="muted">בדקו את החיבור לאינטרנט ורעננו.</p>`; return; }
  const saved = localStorage.getItem(KEY);
  if (saved) {
    try { run(await decrypt(bundle, unb64(saved))); return; }
    catch { localStorage.removeItem(KEY); }
  }
  ask(bundle, false);
})();
})();
