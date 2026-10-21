// Salted PBKDF2-SHA256 hash of the admin login. The password itself is never stored.
// This only gates the editor UI; publishing still needs a GitHub token.
export const ADMIN = {
  salt: "2aabfbbe07cdf97ca03e1d334d16f585",
  iterations: 210000,
  hash: "e86e036dc06d42f9a7ad3b1cdd129d33b4722c4fd870144a4db4d2c468fc7950",
};
