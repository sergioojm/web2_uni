import { request } from './api.js';
import { getState, setToken, clearToken } from './state.js';
import { toast, showResponse } from './ui.js';

export function initAuth() {
  _wire('auth-register-btn', async () => {
    const email = _val('auth-email');
    const password = _val('auth-password');
    const r = await request('/api/user/register', { method: 'POST', body: { email, password } });
    showResponse(r.raw, r.status);
    if (r.ok) {
      const d = r.data;
      setToken(d.accessToken, d.refreshToken, d.user);
      _updateStatus();
      toast('Registered! Check email for verification code.', 'success');
    } else toast(r.message, 'error');
  });

  _wire('auth-login-btn', async () => {
    const email = _val('auth-email');
    const password = _val('auth-password');
    const r = await request('/api/user/login', { method: 'POST', body: { email, password } });
    showResponse(r.raw, r.status);
    if (r.ok) {
      const d = r.data;
      setToken(d.accessToken, d.refreshToken, d.user);
      _updateStatus();
      toast('Logged in', 'success');
    } else toast(r.message, 'error');
  });

  _wire('auth-validate-btn', async () => {
    const code = _val('auth-code');
    const r = await request('/api/user/validation', { method: 'PUT', body: { code } });
    showResponse(r.raw, r.status);
    if (r.ok) toast('Email verified!', 'success');
    else toast(r.message, 'error');
  });

  _wire('auth-refresh-btn', async () => {
    const { refreshToken } = getState();
    if (!refreshToken) { toast('No refresh token stored', 'error'); return; }
    const r = await request('/api/user/refresh', { method: 'POST', body: { refreshToken } });
    showResponse(r.raw, r.status);
    if (r.ok) {
      const d = r.data;
      setToken(d.accessToken, d.refreshToken, null);
      _updateStatus();
      toast('Token refreshed', 'success');
    } else toast(r.message, 'error');
  });

  _wire('auth-logout-btn', async () => {
    const r = await request('/api/user/logout', { method: 'POST' });
    showResponse(r.raw, r.status);
    clearToken();
    _updateStatus();
    toast('Logged out', 'info');
  });
}

export function updateAuthStatus() { _updateStatus(); }

function _updateStatus() {
  const { currentUser, token } = getState();
  const el = document.getElementById('auth-status');
  if (token && currentUser) {
    el.innerHTML = `<span class="badge badge-ok">Logged in as ${currentUser.email ?? currentUser._id ?? '?'}</span>`;
  } else if (token) {
    el.innerHTML = `<span class="badge badge-ok">Token set</span>`;
  } else {
    el.innerHTML = `<span class="badge badge-err">Not logged in</span>`;
  }
}

function _wire(id, fn) {
  document.getElementById(id)?.addEventListener('click', fn);
}

function _val(id) { return document.getElementById(id)?.value?.trim() ?? ''; }
