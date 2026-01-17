export function getToken() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("token");
}

export function setToken(token: string) {
  localStorage.setItem("token", token);
}

export function clearToken() {
  localStorage.removeItem("token");
}

export function getRole() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("role");
}

export function setRole(role: string) {
  localStorage.setItem("role", role);
}
