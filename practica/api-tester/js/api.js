import { getState, getToken } from './state.js';

export async function request(path, { method = 'GET', body, query } = {}) {
  const { baseUrl } = getState();
  let url = baseUrl + path;

  if (query) {
    const params = new URLSearchParams();
    for (const [k, v] of Object.entries(query)) {
      if (v !== undefined && v !== null && v !== '') params.set(k, v);
    }
    const qs = params.toString();
    if (qs) url += '?' + qs;
  }

  const headers = {};
  const token = getToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const isFormData = body instanceof FormData;
  if (!isFormData && body) headers['Content-Type'] = 'application/json';

  let raw, status;
  try {
    const res = await fetch(url, {
      method,
      headers,
      body: isFormData ? body : body ? JSON.stringify(body) : undefined,
    });
    status = res.status;
    try { raw = await res.json(); } catch (_) { raw = {}; }
    const ok = res.ok;
    const data = raw?.data ?? raw;
    const message = raw?.message ?? (ok ? 'OK' : 'Error');
    return { ok, status, raw, data, message };
  } catch (err) {
    return { ok: false, status: 0, raw: { error: err.message }, data: null, message: err.message };
  }
}
