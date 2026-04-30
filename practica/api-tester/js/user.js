import { request } from './api.js';
import { toast, showResponse, openModal, closeModal } from './ui.js';

export function initUser() {
  document.getElementById('user-getme-btn').addEventListener('click', async () => {
    const r = await request('/api/user');
    showResponse(r.raw, r.status);
    if (r.ok) {
      const u = r.data?.user ?? r.data;
      document.getElementById('user-info').innerHTML = `<pre>${JSON.stringify(u, null, 2)}</pre>`;
    } else toast(r.message, 'error');
  });

  document.getElementById('user-onboarding-personal-btn').addEventListener('click', () => {
    openModal('Onboarding — Personal', [
      { name: 'name', label: 'Name', type: 'text', required: true },
      { name: 'lastName', label: 'Last Name', type: 'text', required: true },
      { name: 'nif', label: 'NIF', type: 'text', required: true, placeholder: 'e.g. 12345678A' },
    ], {}, async body => {
      const r = await request('/api/user/register', { method: 'PUT', body });
      showResponse(r.raw, r.status);
      if (r.ok) { toast('Personal info saved', 'success'); closeModal(); }
      else toast(r.message, 'error');
    }, 'Save');
  });

  document.getElementById('user-onboarding-company-btn').addEventListener('click', () => {
    openModal('Onboarding — Company', [
      { name: 'isFreelance', label: 'Is Freelance?', type: 'select', required: true,
        options: [{ value: 'true', label: 'Yes (Freelance)' }, { value: 'false', label: 'No (Company)' }] },
      { name: 'name', label: 'Company Name', type: 'text', note: 'Required if not freelance' },
      { name: 'cif', label: 'CIF', type: 'text', note: 'Required if not freelance' },
      { name: 'address.street', label: 'Street', type: 'text' },
      { name: 'address.city', label: 'City', type: 'text' },
      { name: 'address.postal', label: 'Postal Code', type: 'text' },
      { name: 'address.province', label: 'Province', type: 'text' },
    ], {}, async body => {
      if (typeof body.isFreelance === 'string') body.isFreelance = body.isFreelance === 'true';
      const r = await request('/api/user/company', { method: 'PATCH', body });
      showResponse(r.raw, r.status);
      if (r.ok) { toast('Company info saved', 'success'); closeModal(); }
      else toast(r.message, 'error');
    }, 'Save');
  });

  document.getElementById('user-logo-btn').addEventListener('click', () => {
    openModal('Upload Company Logo', [
      { name: 'logo', label: 'Logo image', type: 'file', accept: 'image/*', required: true },
    ], {}, async body => {
      const r = await request('/api/user/logo', { method: 'PATCH', body });
      showResponse(r.raw, r.status);
      if (r.ok) { toast('Logo uploaded', 'success'); closeModal(); }
      else toast(r.message, 'error');
    }, 'Upload');
  });

  document.getElementById('user-change-password-btn').addEventListener('click', () => {
    openModal('Change Password', [
      { name: 'currentPassword', label: 'Current Password', type: 'password', required: true },
      { name: 'newPassword', label: 'New Password', type: 'password', required: true },
    ], {}, async body => {
      const r = await request('/api/user/password', { method: 'PUT', body });
      showResponse(r.raw, r.status);
      if (r.ok) { toast('Password changed', 'success'); closeModal(); }
      else toast(r.message, 'error');
    }, 'Change');
  });

  document.getElementById('user-invite-btn').addEventListener('click', () => {
    openModal('Invite User (admin only)', [
      { name: 'email', label: 'Email', type: 'email', required: true },
      { name: 'name', label: 'Name', type: 'text', required: true },
      { name: 'lastName', label: 'Last Name', type: 'text', required: true },
      { name: 'nif', label: 'NIF', type: 'text', required: true },
      { name: 'password', label: 'Password', type: 'password', note: 'Optional' },
    ], {}, async body => {
      const r = await request('/api/user/invite', { method: 'POST', body });
      showResponse(r.raw, r.status);
      if (r.ok) { toast('Invitation sent', 'success'); closeModal(); }
      else toast(r.message, 'error');
    }, 'Invite');
  });

  document.getElementById('user-delete-btn').addEventListener('click', async () => {
    const soft = confirm('Soft delete (recoverable)? OK = soft, Cancel = hard (permanent)');
    const r = await request('/api/user', { method: 'DELETE', query: { soft: soft ? 'true' : 'false' } });
    showResponse(r.raw, r.status);
    if (r.ok) toast(`Account ${soft ? 'soft' : 'hard'} deleted`, 'success');
    else toast(r.message, 'error');
  });
}
