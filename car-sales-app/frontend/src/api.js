// All backend calls go through here. In dev, VITE_API_URL is empty and
// Vite's proxy (see vite.config.js) forwards /api and /uploads to the
// backend. In production, set VITE_API_URL to your deployed backend URL.
const BASE = import.meta.env.VITE_API_URL || "";

function authHeaders() {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function handle(res) {
  const isJson = res.headers.get("content-type")?.includes("application/json");
  const data = isJson ? await res.json() : null;
  if (!res.ok) {
    throw new Error((data && data.error) || `Request failed (${res.status})`);
  }
  return data;
}

export const api = {
  get(path) {
    return fetch(`${BASE}${path}`, { headers: { ...authHeaders() } }).then(handle);
  },
  post(path, body) {
    return fetch(`${BASE}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeaders() },
      body: JSON.stringify(body || {}),
    }).then(handle);
  },
  patch(path, body) {
    return fetch(`${BASE}${path}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", ...authHeaders() },
      body: JSON.stringify(body || {}),
    }).then(handle);
  },
  del(path) {
    return fetch(`${BASE}${path}`, { method: "DELETE", headers: { ...authHeaders() } }).then(handle);
  },
  // For multipart form submissions (car listing photos)
  postForm(path, formData) {
    return fetch(`${BASE}${path}`, {
      method: "POST",
      headers: { ...authHeaders() },
      body: formData,
    }).then(handle);
  },
  fileUrl(path) {
    if (!path) return "";
    return path.startsWith("http") ? path : `${BASE}${path}`;
  },
};
