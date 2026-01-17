const TOKEN_COOKIE = "ops_token";
const ROLE_COOKIE = "ops_role";
const TOKEN_STORAGE = "ops_token";
const ROLE_STORAGE = "ops_role";
const LEGACY_TOKEN_COOKIE = "token";
const LEGACY_ROLE_COOKIE = "role";
const LEGACY_TOKEN_STORAGE = "token";
const LEGACY_ROLE_STORAGE = "role";

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

function writeStorage(name: string, value: string) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(name, value);
}

function clearStorage(name: string) {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(name);
}

function migrateLegacyCookies() {
  if (typeof document === "undefined") return;
  const legacyToken = readCookie(LEGACY_TOKEN_COOKIE);
  const legacyRole = readCookie(LEGACY_ROLE_COOKIE);
  const currentToken = readCookie(TOKEN_COOKIE);
  const currentRole = readCookie(ROLE_COOKIE);

  if (!currentToken && legacyToken) {
    writeCookie(TOKEN_COOKIE, legacyToken);
    writeStorage(TOKEN_STORAGE, legacyToken);
  }
  if (!currentRole && legacyRole) {
    writeCookie(ROLE_COOKIE, legacyRole);
    writeStorage(ROLE_STORAGE, legacyRole);
  }

  if (legacyToken) {
    clearCookie(LEGACY_TOKEN_COOKIE);
    clearStorage(LEGACY_TOKEN_STORAGE);
  }
  if (legacyRole) {
    clearCookie(LEGACY_ROLE_COOKIE);
    clearStorage(LEGACY_ROLE_STORAGE);
  }
}

export function getToken() {
  migrateLegacyCookies();
  return readCookie(TOKEN_COOKIE);
}

export function setToken(token: string) {
  writeCookie(TOKEN_COOKIE, token);
  writeStorage(TOKEN_STORAGE, token);
}

export function clearToken() {
  clearCookie(TOKEN_COOKIE);
  clearCookie(LEGACY_TOKEN_COOKIE);
  clearStorage(TOKEN_STORAGE);
  clearStorage(LEGACY_TOKEN_STORAGE);
}

export function getRole() {
  migrateLegacyCookies();
  if (!getToken()) return null;
  return readCookie(ROLE_COOKIE);
}

export function setRole(role: string) {
  writeCookie(ROLE_COOKIE, role);
  writeStorage(ROLE_STORAGE, role);
}

export function clearRole() {
  clearCookie(ROLE_COOKIE);
  clearCookie(LEGACY_ROLE_COOKIE);
  clearStorage(ROLE_STORAGE);
  clearStorage(LEGACY_ROLE_STORAGE);
}

export function setAuthCookies(token: string, role: string) {
  setToken(token);
  setRole(role);
}

export function clearAuthCookies() {
  clearToken();
  clearRole();
}

export function clearAuth() {
  clearAuthCookies();
}
