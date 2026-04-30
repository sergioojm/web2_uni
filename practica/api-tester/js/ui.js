export function toast(message, type = 'info') {
  const container = document.getElementById('toast-container');
  const el = document.createElement('div');
  el.className = `toast toast-${type}`;
  el.textContent = message;
  container.appendChild(el);
  setTimeout(() => el.remove(), 3500);
}

export function showResponse(raw, status) {
  document.getElementById('response-status-badge').textContent = status ?? '';
  document.getElementById('response-status-badge').className =
    'badge ' + (status >= 200 && status < 300 ? 'badge-ok' : 'badge-err');
  document.getElementById('response-body').textContent = JSON.stringify(raw, null, 2);
  const panel = document.getElementById('response-panel');
  panel.classList.remove('hidden');
}

export function isEmptyPayload(body) {
  if (body instanceof FormData) {
    for (const [, v] of body.entries()) { if (v !== '' && !(v instanceof File && v.size === 0)) return false; }
    return true;
  }
  return !body || Object.keys(body).length === 0;
}

export function buildForm(fields, defaults = {}) {
  return fields.map(f => {
    const val = _get(defaults, f.name) ?? '';
    let input = '';
    if (f.type === 'select') {
      const opts = (f.options || []).map(o =>
        `<option value="${o.value}" ${String(val) === String(o.value) ? 'selected' : ''}>${o.label}</option>`
      ).join('');
      input = `<select name="${f.name}" ${f.required ? 'required' : ''}>${opts}</select>`;
    } else if (f.type === 'textarea') {
      input = `<textarea name="${f.name}" placeholder="${f.placeholder || ''}" ${f.required ? 'required' : ''}>${val}</textarea>`;
    } else if (f.type === 'file') {
      input = `<input type="file" name="${f.name}" accept="${f.accept || ''}" ${f.required ? 'required' : ''}>`;
    } else {
      const t = f.type === 'tags' ? 'text' : (f.type || 'text');
      input = `<input type="${t}" name="${f.name}" value="${_esc(val)}" placeholder="${f.placeholder || ''}" step="${f.step || ''}" ${f.required ? 'required' : ''}>`;
    }
    return `<label class="field${f.hidden ? ' hidden-field' : ''}">
      <span>${f.label}${f.required ? ' <em>*</em>' : ''}</span>
      ${input}
      ${f.note ? `<small>${f.note}</small>` : ''}
    </label>`;
  }).join('');
}

export function openModal(title, fields, defaults, onSubmit, submitLabel = 'Submit') {
  document.getElementById('modal-title').textContent = title;
  document.getElementById('modal-body').innerHTML = buildForm(fields, defaults);
  document.getElementById('modal-submit').textContent = submitLabel;
  document.getElementById('modal-overlay').classList.remove('hidden');

  const submit = document.getElementById('modal-submit');
  const newSubmit = submit.cloneNode(true);
  submit.replaceWith(newSubmit);

  newSubmit.addEventListener('click', async () => {
    const form = document.getElementById('modal-body');
    const payload = _buildPayload(form, fields);
    newSubmit.disabled = true;
    try { await onSubmit(payload); } finally { newSubmit.disabled = false; }
  });
}

export function closeModal() {
  document.getElementById('modal-overlay').classList.add('hidden');
}

function _buildPayload(container, fields) {
  const hasFile = fields.some(f => f.type === 'file' &&
    container.querySelector(`[name="${f.name}"]`)?.files?.length > 0);

  if (hasFile) {
    const fd = new FormData();
    for (const f of fields) {
      const el = container.querySelector(`[name="${f.name}"]`);
      if (!el) continue;
      if (f.type === 'file') { if (el.files[0]) fd.append(f.name, el.files[0]); }
      else if (el.value !== '') fd.append(f.name, el.value);
    }
    return fd;
  }

  const obj = {};
  for (const f of fields) {
    const el = container.querySelector(`[name="${f.name}"]`);
    if (!el) continue;
    let v = el.value;
    if (v === '' && !f.required) continue;
    if (f.type === 'number') v = v !== '' ? Number(v) : undefined;
    else if (f.type === 'tags') v = v.split(',').map(s => s.trim()).filter(Boolean);
    if (v === undefined) continue;
    _set(obj, f.name, v);
  }
  return obj;
}

export function renderTable(containerId, rows, columns, actions = []) {
  const container = document.getElementById(containerId);
  if (!rows || rows.length === 0) { container.innerHTML = '<p class="empty">No items found.</p>'; return; }

  const hasActions = actions.length > 0;
  const thead = `<tr>${columns.map(c => `<th>${c.label}</th>`).join('')}${hasActions ? '<th>Actions</th>' : ''}</tr>`;
  const tbody = rows.map(row => {
    const cells = columns.map(c => {
      const val = _get(row, c.key);
      return `<td>${c.render ? c.render(val, row) : _fmt(val)}</td>`;
    }).join('');
    const acts = hasActions
      ? `<td class="actions">${actions.map(a => `<button class="btn-sm">${a.label}</button>`).join('')}</td>`
      : '';
    return `<tr>${cells}${acts}</tr>`;
  }).join('');

  container.innerHTML = `<table><thead>${thead}</thead><tbody>${tbody}</tbody></table>`;

  if (hasActions) {
    const trs = container.querySelectorAll('tbody tr');
    trs.forEach((tr, i) => {
      tr.querySelectorAll('.actions button').forEach((btn, j) => {
        btn.addEventListener('click', () => actions[j].onClick(rows[i]));
      });
    });
  }
}

function _fmt(val) {
  if (val === null || val === undefined) return '<span class="nil">—</span>';
  if (typeof val === 'boolean') return `<span class="badge ${val ? 'badge-ok' : 'badge-err'}">${val}</span>`;
  if (Array.isArray(val)) {
    if (val.length === 0) return '<span class="nil">[]</span>';
    return val.slice(0, 3).map(v => `<span class="tag">${_esc(String(v?.name ?? v))}</span>`).join(' ') +
      (val.length > 3 ? ` <span class="nil">+${val.length - 3}</span>` : '');
  }
  if (typeof val === 'object') {
    if (val._id) return `<code class="id">${String(val._id).slice(-6)}</code>`;
    return `<span class="nil">{obj}</span>`;
  }
  const s = String(val);
  if (/^[a-f0-9]{24}$/.test(s)) return `<code class="id" title="${s}">${s.slice(-6)}</code>`;
  if (s.startsWith('http')) return `<a href="${s}" target="_blank">link</a>`;
  return _esc(s.length > 60 ? s.slice(0, 60) + '…' : s);
}

function _esc(s) { return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }

function _get(obj, path) {
  return path.split('.').reduce((o, k) => o?.[k], obj);
}

function _set(obj, path, val) {
  const parts = path.split('.');
  let cur = obj;
  for (let i = 0; i < parts.length - 1; i++) {
    cur[parts[i]] = cur[parts[i]] ?? {};
    cur = cur[parts[i]];
  }
  cur[parts[parts.length - 1]] = val;
}
