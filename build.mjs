// The story is a spoiler for the players and the repo is public, so only the encrypted bundle is ever committed.
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { webcrypto as crypto } from "node:crypto";

const files = ["content.js", "handouts.js", "audio.js", "app.js"];
const pw = readFileSync("gm-src/.password", "utf8").trim().normalize("NFC");
const code = files.map((f) => readFileSync(`gm-src/${f}`, "utf8")).join("\n;\n");
const iter = 600000;
// A fixed salt keeps the key a browser remembered valid across rebuilds.
if (!existsSync("gm-src/.salt")) writeFileSync("gm-src/.salt", Buffer.from(crypto.getRandomValues(new Uint8Array(16))).toString("base64"));
const salt = new Uint8Array(Buffer.from(readFileSync("gm-src/.salt", "utf8").trim(), "base64"));
const iv = crypto.getRandomValues(new Uint8Array(12));
const base = await crypto.subtle.importKey("raw", new TextEncoder().encode(pw), "PBKDF2", false, ["deriveKey"]);
const key = await crypto.subtle.deriveKey({ name: "PBKDF2", salt, iterations: iter, hash: "SHA-256" }, base, { name: "AES-GCM", length: 256 }, false, ["encrypt"]);
const ct = new Uint8Array(await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, new TextEncoder().encode(code)));
const b64 = (u) => Buffer.from(u).toString("base64");
writeFileSync("gm.enc.json", JSON.stringify({ v: 1, iter, salt: b64(salt), iv: b64(iv), ct: b64(ct) }));
console.log(`gm.enc.json: ${code.length} chars encrypted`);
