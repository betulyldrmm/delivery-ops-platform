const TOKEN_COOKIE = "token";
const ROLE_COOKIE = "role";

function readCookie(name: string) {
  if (typeof document === "undefined") return null;
  const match = document.cookie
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${name}=`));
  if (!match) return null;
  return decodeURIComponent(match.slice(name.length + 1));
}

function writeCookie(name: string, value: string) {
  if (typeof document === "undefined") return;
  document.cookie = `${name}=${encodeURIComponent(value)}; Path=/; SameSite=Lax`;
}

function clearCookie(name: string) {
  if (typeof document === "undefined") return;
  document.cookie = `${name}=; Path=/; Max-Age=0; SameSite=Lax`;
}

export function getToken() {
  return readCookie(TOKEN_COOKIE);
}

export function setToken(token: string) {
  writeCookie(TOKEN_COOKIE, token);
}

export function clearToken() {
  clearCookie(TOKEN_COOKIE);
}

export function getRole() {
  return readCookie(ROLE_COOKIE);
}

export function setRole(role: string) {
  writeCookie(ROLE_COOKIE, role);
}

export function clearRole() {
  clearCookie(ROLE_COOKIE);
}

export function setAuthCookies(token: string, role: string) {
  writeCookie(TOKEN_COOKIE, token);
  writeCookie(ROLE_COOKIE, role);
}

export function clearAuthCookies() {
  clearCookie(TOKEN_COOKIE);
  clearCookie(ROLE_COOKIE);
}
