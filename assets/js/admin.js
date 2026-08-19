import { auth } from './firebase-config.js';
import {
  onAuthStateChanged, signInWithEmailAndPassword, signOut
} from "https://www.gstatic.com/firebasejs/10.13.2/firebase-auth.js";
import { fetchAllData, saveMeta, saveModule, deleteModule } from './data-service.js';

let draft = null;

function showLogin() {
  document.getElementById('loginScreen').classList.remove('hidden');
  document.getElementById('adminScreen').classList.add('hidden');
}

function showAdmin() {
  document.getElementById('loginScreen').classList.add('hidden');
  document.getElementById('adminScreen').classList.remove('hidden');
}

async function loadData() {
  try {
    draft = await fetchAllData();
  } catch (e) {
    draft = { meta: { project: 'SISMA', startDate: todayIso(), deadline: '2026-12-20', lastUpdated: todayIso() }, modules: [] };
  }
  renderMeta();
  renderModules();
}

function renderMeta() {
  document.getElementById('metaProject').value = draft.meta.project || '';
  document.getElementById('metaStart').value = draft.meta.startDate || '';
  document.getElementById('metaDeadline').value = draft.meta.deadline || '';
}

function setupMetaBindings() {
  ['metaProject', 'metaStart', 'metaDeadline'].forEach(id => {
    document.getElementById(id).addEventListener('change', () => {
      draft.meta.project = document.getElementById('metaProject').value;
      draft.meta.startDate = document.getElementById('metaStart').value;
      draft.meta.deadline = document.getElementById('metaDeadline').value;
      persistMeta();
    });
  });
}

function renderModules() {
  const list = document.getElementById('moduleList');
  list.innerHTML = '';
  draft.modules.forEach(mod => list.appendChild(buildCard(mod)));
}

function buildCard(mod) {
  const tpl = document.getElementById('cardTemplate');
  const node = tpl.content.firstElementChild.cloneNode(true);
  node.dataset.id = mod.id;

  node.querySelector('[data-field="name"]').value = mod.name || '';
  node.querySelector('[data-field="status"]').value = mod.status || 'belum_mulai';
  node.querySelector('[data-field="dueDate"]').value = mod.dueDate || '';
  node.querySelector('[data-field="note"]').value = mod.note || '';
  node.querySelector('[data-field="updatedAtLabel"]').textContent = formatDate(mod.updatedAt);

  node.querySelectorAll('[data-field]').forEach(el => {
    const field = el.dataset.field;
    if (!field || field === 'updatedAtLabel' || field === 'featureList' || field === 'featureEmpty') return;
    el.addEventListener('change', () => onFieldChange(mod.id, el));
  });

  node.querySelector('[data-action="delete"]').addEventListener('click', async () => {
    if (!confirm(`Hapus modul "${mod.name || '(tanpa nama)'}"?`)) return;
    try {
      await deleteModule(mod.id);
      draft.modules = draft.modules.filter(m => m.id !== mod.id);
      renderModules();
      flashStatus('Modul dihapus ✓');
    } catch (e) {
      flashStatus('Gagal menghapus — cek koneksi');
    }
  });

  const featureList = node.querySelector('[data-field="featureList"]');
  const featureEmpty = node.querySelector('[data-field="featureEmpty"]');
  const updatedAtLabel = node.querySelector('[data-field="updatedAtLabel"]');

  function refreshFeatures() {
    featureList.innerHTML = '';
    (mod.features || []).forEach(f => featureList.appendChild(buildFeatureRow(mod, f, refreshFeatures, updatedAtLabel)));
    featureEmpty.classList.toggle('hidden', (mod.features || []).length > 0);
  }
  refreshFeatures();

  node.querySelector('[data-action="add-feature"]').addEventListener('click', () => {
    if (!mod.features) mod.features = [];
    mod.features.push({ id: uid('f'), name: '', status: 'belum_mulai', updatedAt: todayIso() });
    persistModule(mod);
    updatedAtLabel.textContent = formatDate(mod.updatedAt);
    refreshFeatures();
  });

  return node;
}

function buildFeatureRow(mod, feature, refreshFeatures, updatedAtLabel) {
  const tpl = document.getElementById('featureTemplate');
  const node = tpl.content.firstElementChild.cloneNode(true);
  node.dataset.featureId = feature.id;

  node.querySelector('[data-feature-field="name"]').value = feature.name || '';
  node.querySelector('[data-feature-field="status"]').value = feature.status || 'belum_mulai';

  node.querySelectorAll('[data-feature-field]').forEach(el => {
    el.addEventListener('change', () => {
      feature[el.dataset.featureField] = el.value;
      feature.updatedAt = todayIso();
      persistModule(mod);
      updatedAtLabel.textContent = formatDate(mod.updatedAt);
    });
  });

  node.querySelector('[data-feature-action="delete"]').addEventListener('click', () => {
    mod.features = mod.features.filter(f => f.id !== feature.id);
    persistModule(mod);
    updatedAtLabel.textContent = formatDate(mod.updatedAt);
    refreshFeatures();
  });

  return node;
}

function onFieldChange(id, el) {
  const mod = draft.modules.find(m => m.id === id);
  if (!mod) return;
  mod[el.dataset.field] = el.value;
  persistModule(mod);
  const card = el.closest('.module-card');
  card.querySelector('[data-field="updatedAtLabel"]').textContent = formatDate(mod.updatedAt);
}

async function persistModule(mod) {
  mod.updatedAt = todayIso();
  try {
    await saveModule(mod);
    flashStatus('Tersimpan ✓');
  } catch (e) {
    flashStatus('Gagal menyimpan — cek koneksi');
  }
}

async function persistMeta() {
  draft.meta.lastUpdated = todayIso();
  try {
    await saveMeta(draft.meta);
    flashStatus('Tersimpan ✓');
  } catch (e) {
    flashStatus('Gagal menyimpan — cek koneksi');
  }
}

function flashStatus(text) {
  const el = document.getElementById('statusMsg');
  el.textContent = text;
  clearTimeout(flashStatus._t);
  flashStatus._t = setTimeout(() => { el.textContent = ''; }, 1500);
}

function setupToolbar() {
  document.getElementById('btnAdd').addEventListener('click', () => {
    const mod = {
      id: uid(),
      name: 'Modul Baru',
      features: [],
      status: 'belum_mulai',
      dueDate: draft.meta.deadline || todayIso(),
      note: '',
      updatedAt: todayIso()
    };
    draft.modules.push(mod);
    persistModule(mod);
    renderModules();
  });

  document.getElementById('btnExport').addEventListener('click', () => {
    const blob = new Blob([JSON.stringify(draft, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'data.json';
    a.click();
    URL.revokeObjectURL(url);
    flashStatus('data.json terunduh (backup)');
  });

  document.getElementById('btnReload').addEventListener('click', async () => {
    await loadData();
    flashStatus('Dimuat ulang dari Firestore ✓');
  });

  document.getElementById('btnLogout').addEventListener('click', () => signOut(auth));
}

function setupLogin() {
  document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    const errEl = document.getElementById('loginError');
    errEl.textContent = '';
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err) {
      errEl.textContent = 'Login gagal: email atau password salah.';
    }
  });
}

let bound = false;

onAuthStateChanged(auth, async (user) => {
  if (user) {
    showAdmin();
    await loadData();
    if (!bound) {
      setupMetaBindings();
      setupToolbar();
      bound = true;
    }
  } else {
    showLogin();
  }
});

setupLogin();
