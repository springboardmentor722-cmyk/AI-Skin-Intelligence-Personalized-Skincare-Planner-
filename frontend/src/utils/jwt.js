// Minimal JWT payload decoder — we only need to read claims client-side
// (id, sub, role, exp), never verify the signature (the backend does that).
// Avoids pulling in a dependency for something this small.
export function decodeToken(token) {
  if (!token) return null;

  try {
    const payload = token.split(".")[1];
    const decoded = atob(payload.replace(/-/g, "+").replace(/_/g, "/"));
    return JSON.parse(decoded);
  } catch {
    return null;
  }
}

export function isTokenExpired(decoded) {
  if (!decoded?.exp) return true;
  return Date.now() >= decoded.exp * 1000;
}
