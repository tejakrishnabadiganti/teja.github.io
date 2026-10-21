import { ADMIN } from "./admin-config.js";

const toHex = (buffer) =>
  [...new Uint8Array(buffer)].map((b) => b.toString(16).padStart(2, "0")).join("");
const fromHex = (hex) => Uint8Array.from(hex.match(/../g), (pair) => parseInt(pair, 16));

function sameText(a, b) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

// Username and password are compared case-insensitively.
export async function verifyCredentials(username, password) {
  const secret = `${username.trim().toLowerCase()}\n${password.toLowerCase()}`;
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    "PBKDF2",
    false,
    ["deriveBits"]
  );
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", hash: "SHA-256", salt: fromHex(ADMIN.salt), iterations: ADMIN.iterations },
    key,
    256
  );
  return sameText(toHex(bits), ADMIN.hash);
}
