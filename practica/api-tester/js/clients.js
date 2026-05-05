import { request } from './api.js';
import { getState, setState } from './state.js';
import { renderTable, openModal, closeModal, toast, showResponse, isEmptyPayload } from './ui.js';

const COLUMNS = [
  { key: '_id', label: 'ID' },
  { key: 'name', label: 'Name' },
  { key: 'cif', label: 'CIF' },
  { key: 'email', label: 'Email' },
  { key: 'phone', label: 'Phone' },
  { key: 'deleted', label: 'Archived' },
];

const CREATE_FIELDS = [
  { name: 'name', label: 'Name', type: 'text', required: true },
  { name: 'cif', label: 'CIF', type: 'text', required: true, placeholder: 'Min 5 chars' },
  { name: 'email', label: 'Email', type: 'email' },
  { name: 'phone', label: 'Phone', type: 'text' },
  { name: 'address.street', label: 'Street', type: 'text' },
  { name: 'address.city', label: 'City', type: 'text' },
  { name: 'address.postal', label: 'Postal', type: 'text' },
  { name: 'address.province', label: 'Province', type: 'text' },
];

const UPDATE_FIELDS = CREATE_FIELDS.map(f => ({ ...f, required: false }));

export function initClients() {
  document.getElementById('clients-search').addEventListener('click', loadClients);
  document.getElementById('clients-archived-btn').addEventListener('click', loadArchived);

  document.getElementById('clients-prev').addEventListener('click', () => {
    const p = getState().pagination;
    if (p.clients > 1) { setState({ pagination: { ...p, clients: p.clients - 1 } }); loadClients(); }
  });
  document.getElementById('clients-next').addEventListener('click', () => {
    const p = getState().pagination;
    setState({ pagination: { ...p, clients: p.clients + 1 } }); loadClients();
  });

  document.getElementById('clients-create-btn').addEventListener('click', () => {
    openModal('New Client', CREATE_FIELDS, {}, async body => {
      const r = await request('/api/client', { method: 'POST', body });
      showResponse(r.raw, r.status);
      if (r.ok) { toast('Client created', 'success'); closeModal(); loadClients(); }
      else toast(r.message, 'error');
    }, 'Create');
  });
}

export async function loadClients() {
  const page = getState().pagination.clients ?? 1;
  const name = document.getElementById('filter-client-name')?.value?.trim() || undefined;
  _setPage(page);
  const r = await request('/api/client', { query: { page, limit: 20, name } });
  showResponse(r.raw, r.status);
  if (!r.ok) { toast(r.message, 'error'); return; }
  const rows = Array.isArray(r.data) ? r.data : (r.data?.items ?? r.data?.clients ?? []);
  document.getElementById('clients-next').disabled = rows.length < 20;
  _renderClients(rows);
}

async function loadArchived() {
  const r = await request('/api/client/archived');
  showResponse(r.raw, r.status);
  if (!r.ok) { toast(r.message, 'error'); return; }
  const rows = Array.isArray(r.data) ? r.data : (r.data?.items ?? r.data?.clients ?? []);
  _renderClients(rows, true);
}

function _renderClients(rows, archived = false) {
  const actions = archived
    ? [{ label: 'Restore', onClick: async row => {
        const res = await request(`/api/client/${row._id}/restore`, { method: 'PATCH' });
        showResponse(res.raw, res.status);
        if (res.ok) { toast('Restored', 'success'); loadClients(); }
        else toast(res.message, 'error');
      }}]
    : [
        { label: 'Edit', onClick: row => openModal(`Edit: ${row.name}`, UPDATE_FIELDS, row, async body => {
            if (isEmptyPayload(body)) { toast('No changes', 'info'); return; }
            const res = await request(`/api/client/${row._id}`, { method: 'PUT', body });
            showResponse(res.raw, res.status);
            if (res.ok) { toast('Updated', 'success'); closeModal(); loadClients(); }
            else toast(res.message, 'error');
          }, 'Update')
        },
        { label: 'Archive', onClick: async row => {
            if (!confirm(`Archive client "${row.name}"?`)) return;
            const res = await request(`/api/client/${row._id}`, { method: 'DELETE' });
            showResponse(res.raw, res.status);
            if (res.ok) { toast('Archived', 'success'); loadClients(); }
            else toast(res.message, 'error');
          }
        },
      ];

  renderTable('clients-table-container', rows, COLUMNS, actions);
}

function _setPage(page) {
  document.getElementById('clients-page-label').textContent = `Page ${page}`;
  document.getElementById('clients-prev').disabled = page <= 1;
}
