const KEY = 'api_tester_state';

const defaults = {
  baseUrl: 'http://localhost:3000',
  token: null,
  refreshToken: null,
  currentUser: null,
  activeTab: 'auth',
  pagination: { clients: 1, projects: 1, deliverynotes: 1 },
};

let _state = { ...defaults };

export function getState() { return _state; }

export function setState(patch) {
  _state = { ..._state, ...patch };
  try { localStorage.setItem(KEY, JSON.stringify(_state)); } catch (_) {}
}

export function getToken() { return _state.token; }

export function setToken(accessToken, refreshToken, user) {
  setState({ token: accessToken, refreshToken, currentUser: user ?? _state.currentUser });
}

export function clearToken() {
  setState({ token: null, refreshToken: null, currentUser: null });
}

export function hydrate() {
  try {
    const saved = JSON.parse(localStorage.getItem(KEY) || '{}');
    _state = { ...defaults, ...saved };
  } catch (_) {}
}
