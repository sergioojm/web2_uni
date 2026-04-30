import { hydrate, getState, setState } from './state.js';
import { initAuth, updateAuthStatus } from './auth.js';
import { initUser } from './user.js';
import { initClients, loadClients } from './clients.js';
import { initProjects, loadProjects } from './projects.js';
import { initDeliveryNotes, loadDeliveryNotes } from './deliverynotes.js';
import { closeModal } from './ui.js';

document.addEventListener('DOMContentLoaded', () => {
  hydrate();

  const { baseUrl, activeTab } = getState();
  document.getElementById('base-url-input').value = baseUrl;

  document.getElementById('base-url-save').addEventListener('click', () => {
    const val = document.getElementById('base-url-input').value.trim().replace(/\/$/, '');
    setState({ baseUrl: val });
  });

  document.getElementById('modal-close').addEventListener('click', closeModal);
  document.getElementById('modal-cancel').addEventListener('click', closeModal);
  document.getElementById('modal-overlay').addEventListener('click', e => {
    if (e.target === document.getElementById('modal-overlay')) closeModal();
  });

  document.getElementById('response-panel-toggle').addEventListener('click', () => {
    const body = document.getElementById('response-body');
    const btn = document.getElementById('response-panel-toggle');
    const hidden = body.classList.toggle('hidden');
    btn.textContent = hidden ? 'Show' : 'Hide';
  });

  initAuth();
  initUser();
  initClients();
  initProjects();
  initDeliveryNotes();
  updateAuthStatus();

  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => switchTab(btn.dataset.tab));
  });

  switchTab(activeTab || 'auth');
});

function switchTab(name) {
  setState({ activeTab: name });
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.toggle('active', b.dataset.tab === name));
  document.querySelectorAll('.tab-panel').forEach(p => p.classList.toggle('hidden', p.id !== `tab-${name}`));

  if (name === 'clients') loadClients();
  if (name === 'projects') loadProjects();
  if (name === 'deliverynotes') loadDeliveryNotes();
}
