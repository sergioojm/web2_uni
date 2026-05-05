import { request, openBlob } from './api.js';
import { getState, setState } from './state.js';
import { renderTable, openModal, closeModal, toast, showResponse } from './ui.js';

const COLUMNS = [
  { key: '_id', label: 'ID' },
  { key: 'format', label: 'Format' },
  { key: 'client', label: 'Client' },
  { key: 'project', label: 'Project' },
  { key: 'workDate', label: 'Date', render: v => v ? new Date(v).toLocaleDateString() : '—' },
  { key: 'signed', label: 'Signed' },
  { key: 'hours', label: 'Hours' },
  { key: 'material', label: 'Material' },
];

const BASE_FIELDS = [
  { name: 'format', label: 'Format', type: 'select', required: true,
    options: [{ value: 'hours', label: 'Hours' }, { value: 'material', label: 'Material' }] },
  { name: 'client', label: 'Client ID', type: 'text', required: true, placeholder: '24-char ObjectId' },
  { name: 'project', label: 'Project ID', type: 'text', required: true, placeholder: '24-char ObjectId' },
  { name: 'description', label: 'Description', type: 'textarea' },
  { name: 'workDate', label: 'Work Date', type: 'text', placeholder: 'YYYY-MM-DD' },
];

const HOURS_FIELDS = [
  { name: 'hours', label: 'Hours (number)', type: 'number', step: 'any', required: true },
];

const MATERIAL_FIELDS = [
  { name: 'material', label: 'Material name', type: 'text', required: true },
  { name: 'quantity', label: 'Quantity', type: 'number', step: 'any', required: true },
  { name: 'unit', label: 'Unit', type: 'text', note: 'e.g. kg, m, pcs' },
];

const CREATE_FIELDS = [...BASE_FIELDS, ...HOURS_FIELDS, ...MATERIAL_FIELDS];

export function initDeliveryNotes() {
  document.getElementById('deliverynotes-search').addEventListener('click', loadDeliveryNotes);

  document.getElementById('deliverynotes-prev').addEventListener('click', () => {
    const p = getState().pagination;
    if (p.deliverynotes > 1) { setState({ pagination: { ...p, deliverynotes: p.deliverynotes - 1 } }); loadDeliveryNotes(); }
  });
  document.getElementById('deliverynotes-next').addEventListener('click', () => {
    const p = getState().pagination;
    setState({ pagination: { ...p, deliverynotes: p.deliverynotes + 1 } }); loadDeliveryNotes();
  });

  document.getElementById('deliverynotes-create-btn').addEventListener('click', () => {
    openModal('New Delivery Note', CREATE_FIELDS, { format: 'hours' }, async body => {
      if (body.hours !== undefined) body.hours = Number(body.hours);
      if (body.quantity !== undefined) body.quantity = Number(body.quantity);
      const r = await request('/api/deliverynote', { method: 'POST', body });
      showResponse(r.raw, r.status);
      if (r.ok) { toast('Delivery note created', 'success'); closeModal(); loadDeliveryNotes(); }
      else toast(r.message, 'error');
    }, 'Create');
  });
}

export async function loadDeliveryNotes() {
  const page = getState().pagination.deliverynotes ?? 1;
  document.getElementById('deliverynotes-page-label').textContent = `Page ${page}`;
  document.getElementById('deliverynotes-prev').disabled = page <= 1;

  const r = await request('/api/deliverynote', { query: { page, limit: 20 } });
  showResponse(r.raw, r.status);
  if (!r.ok) { toast(r.message, 'error'); return; }
  const rows = Array.isArray(r.data) ? r.data : (r.data?.items ?? r.data?.deliverynotes ?? []);
  document.getElementById('deliverynotes-next').disabled = rows.length < 20;

  renderTable('deliverynotes-table-container', rows, COLUMNS, [
    { label: 'View', onClick: async row => {
        const res = await request(`/api/deliverynote/${row._id}`);
        showResponse(res.raw, res.status);
        if (!res.ok) toast(res.message, 'error');
      }
    },
    { label: 'Sign', onClick: row => {
        if (row.signed) { toast('Already signed', 'info'); return; }
        openModal(`Sign note ${String(row._id).slice(-6)}`, [
          { name: 'signature', label: 'Signature image', type: 'file', accept: 'image/*', required: true },
        ], {}, async body => {
          const res = await request(`/api/deliverynote/${row._id}/sign`, { method: 'PATCH', body });
          showResponse(res.raw, res.status);
          if (res.ok) { toast('Signed!', 'success'); closeModal(); loadDeliveryNotes(); }
          else toast(res.message, 'error');
        }, 'Sign');
      }
    },
    { label: 'PDF', onClick: async row => {
        const res = await openBlob(`/api/deliverynote/pdf/${row._id}`);
        if (!res.ok) toast(res.message, 'error');
      }
    },
    { label: 'Delete', onClick: async row => {
        if (row.signed) { toast('Cannot delete a signed note', 'error'); return; }
        if (!confirm('Delete this delivery note?')) return;
        const res = await request(`/api/deliverynote/${row._id}`, { method: 'DELETE' });
        showResponse(res.raw, res.status);
        if (res.ok) { toast('Deleted', 'success'); loadDeliveryNotes(); }
        else toast(res.message, 'error');
      }
    },
  ]);
}
