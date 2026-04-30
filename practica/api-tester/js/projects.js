import { request } from './api.js';
import { getState, setState } from './state.js';
import { renderTable, openModal, closeModal, toast, showResponse, isEmptyPayload } from './ui.js';

const COLUMNS = [
  { key: '_id', label: 'ID' },
  { key: 'name', label: 'Name' },
  { key: 'projectCode', label: 'Code' },
  { key: 'client', label: 'Client' },
  { key: 'email', label: 'Email' },
  { key: 'active', label: 'Active' },
  { key: 'deleted', label: 'Archived' },
];

const CREATE_FIELDS = [
  { name: 'name', label: 'Name', type: 'text', required: true },
  { name: 'projectCode', label: 'Project Code', type: 'text', required: true },
  { name: 'client', label: 'Client ID', type: 'text', required: true, placeholder: '24-char ObjectId' },
  { name: 'email', label: 'Email', type: 'email' },
  { name: 'notes', label: 'Notes', type: 'textarea' },
  { name: 'address.street', label: 'Street', type: 'text' },
  { name: 'address.city', label: 'City', type: 'text' },
  { name: 'address.postal', label: 'Postal', type: 'text' },
  { name: 'address.province', label: 'Province', type: 'text' },
];

const UPDATE_FIELDS = CREATE_FIELDS.map(f => ({ ...f, required: false }));

export function initProjects() {
  document.getElementById('projects-search').addEventListener('click', loadProjects);
  document.getElementById('projects-archived-btn').addEventListener('click', loadArchived);

  document.getElementById('projects-prev').addEventListener('click', () => {
    const p = getState().pagination;
    if (p.projects > 1) { setState({ pagination: { ...p, projects: p.projects - 1 } }); loadProjects(); }
  });
  document.getElementById('projects-next').addEventListener('click', () => {
    const p = getState().pagination;
    setState({ pagination: { ...p, projects: p.projects + 1 } }); loadProjects();
  });

  document.getElementById('projects-create-btn').addEventListener('click', () => {
    openModal('New Project', CREATE_FIELDS, {}, async body => {
      const r = await request('/api/project', { method: 'POST', body });
      showResponse(r.raw, r.status);
      if (r.ok) { toast('Project created', 'success'); closeModal(); loadProjects(); }
      else toast(r.message, 'error');
    }, 'Create');
  });
}

export async function loadProjects() {
  const page = getState().pagination.projects ?? 1;
  _setPage(page);
  const r = await request('/api/project', { query: { page, limit: 20 } });
  showResponse(r.raw, r.status);
  if (!r.ok) { toast(r.message, 'error'); return; }
  const rows = Array.isArray(r.data) ? r.data : (r.data?.projects ?? []);
  document.getElementById('projects-next').disabled = rows.length < 20;
  _renderProjects(rows);
}

async function loadArchived() {
  const r = await request('/api/project/archived');
  showResponse(r.raw, r.status);
  if (!r.ok) { toast(r.message, 'error'); return; }
  const rows = Array.isArray(r.data) ? r.data : (r.data?.projects ?? []);
  _renderProjects(rows, true);
}

function _renderProjects(rows, archived = false) {
  const actions = archived
    ? [{ label: 'Restore', onClick: async row => {
        const res = await request(`/api/project/${row._id}/restore`, { method: 'PATCH' });
        showResponse(res.raw, res.status);
        if (res.ok) { toast('Restored', 'success'); loadProjects(); }
        else toast(res.message, 'error');
      }}]
    : [
        { label: 'Edit', onClick: row => openModal(`Edit: ${row.name}`, UPDATE_FIELDS, row, async body => {
            if (isEmptyPayload(body)) { toast('No changes', 'info'); return; }
            const res = await request(`/api/project/${row._id}`, { method: 'PUT', body });
            showResponse(res.raw, res.status);
            if (res.ok) { toast('Updated', 'success'); closeModal(); loadProjects(); }
            else toast(res.message, 'error');
          }, 'Update')
        },
        { label: 'Archive', onClick: async row => {
            if (!confirm(`Archive project "${row.name}"?`)) return;
            const res = await request(`/api/project/${row._id}`, { method: 'DELETE' });
            showResponse(res.raw, res.status);
            if (res.ok) { toast('Archived', 'success'); loadProjects(); }
            else toast(res.message, 'error');
          }
        },
      ];

  renderTable('projects-table-container', rows, COLUMNS, actions);
}

function _setPage(page) {
  document.getElementById('projects-page-label').textContent = `Page ${page}`;
  document.getElementById('projects-prev').disabled = page <= 1;
}
