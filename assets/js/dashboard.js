import { subscribeToData } from './data-service.js';

let currentFilter = 'semua';
let allModules = [];
let bound = false;

function init() {
  subscribeToData(
    ({ meta, modules }) => {
      allModules = modules;
      renderHero(meta, modules);
      renderGrid();
      if (!bound) {
        bindFilters();
        bindModal();
        bound = true;
      }
    },
    () => {
      document.getElementById('moduleGrid').innerHTML =
        `<p class="text-black text-sm sm:col-span-2 lg:col-span-3">Gagal memuat data dari Firestore. Cek koneksi internet atau konfigurasi Firebase.</p>`;
    }
  );
}

function renderHero(meta, modules) {
  const today = todayIso();
  const daysLeft = Math.max(0, daysBetween(today, meta.deadline));
  document.getElementById('daysLeft').textContent = daysLeft;
  document.getElementById('deadlineText').textContent = formatDate(meta.deadline);
  document.getElementById('progressPct').textContent = calcProgress(modules) + '%';
  document.getElementById('lastUpdated').textContent = formatDate(meta.lastUpdated);
  document.getElementById('startLabel').textContent = formatDate(meta.startDate);
  document.getElementById('deadlineLabel').textContent = formatDate(meta.deadline);

  const total = Math.max(1, daysBetween(meta.startDate, meta.deadline));
  const elapsed = Math.min(total, Math.max(0, daysBetween(meta.startDate, today)));
  const pct = Math.round((elapsed / total) * 100);
  document.getElementById('dateProgressBar').style.width = pct + '%';

  document.getElementById('totalModules').textContent = modules.length;
  document.getElementById('totalFeatures').textContent = modules.reduce((sum, m) => sum + (m.features || []).length, 0);
}

function renderGrid() {
  const grid = document.getElementById('moduleGrid');
  const empty = document.getElementById('emptyState');
  const filtered = currentFilter === 'semua'
    ? allModules
    : allModules.filter(m => m.status === currentFilter);

  if (!filtered.length) {
    grid.innerHTML = '';
    empty.classList.remove('hidden');
    return;
  }
  empty.classList.add('hidden');

  grid.innerHTML = filtered.map(m => cardHtml(m)).join('');
  grid.querySelectorAll('[data-module-id]').forEach(card => {
    card.addEventListener('click', () => openModal(card.dataset.moduleId));
  });
}

function cardHtml(m) {
  const meta = statusMeta(m.status);
  const progress = calcModuleProgress(m);
  const featureCount = (m.features || []).length;

  return `
    <div data-module-id="${m.id}" class="bg-white border-2 border-black p-5 cursor-pointer hover:bg-stone-50 transition-colors">
      <div class="flex items-start justify-between gap-2 mb-3">
        <h3 class="font-display font-600 text-base text-black">${escapeHtml(m.name)}</h3>
        <span class="font-mono text-[11px] px-2 py-1 ${meta.badge} shrink-0">${meta.label}</span>
      </div>
      <p class="text-xs text-slate-500 font-mono mb-3">${featureCount} fitur</p>
      <div class="relative h-2 border border-black bg-white overflow-hidden mb-1.5">
        <div class="absolute inset-y-0 left-0 bg-green-500 transition-all" style="width:${progress}%"></div>
      </div>
      <div class="flex justify-between text-xs font-mono">
        <span class="text-green-600 font-bold">${progress}%</span>
        <span class="text-slate-500">Target: ${formatDate(m.dueDate)}</span>
      </div>
    </div>`;
}

function openModal(id) {
  const m = allModules.find(x => x.id === id);
  if (!m) return;
  const meta = statusMeta(m.status);

  document.getElementById('modalTitle').textContent = m.name;

  const badge = document.getElementById('modalBadge');
  badge.textContent = meta.label;
  badge.className = `font-mono text-[11px] px-2 py-1 ${meta.badge}`;

  document.getElementById('modalDue').textContent = `Target: ${formatDate(m.dueDate)}`;

  const noteEl = document.getElementById('modalNote');
  noteEl.textContent = m.note || '';
  noteEl.classList.toggle('hidden', !m.note);

  const list = document.getElementById('modalFeatureList');
  const emptyMsg = document.getElementById('modalEmptyFeatures');
  const features = m.features || [];

  if (!features.length) {
    list.innerHTML = '';
    emptyMsg.classList.remove('hidden');
  } else {
    emptyMsg.classList.add('hidden');
    list.innerHTML = features.map(f => {
      const fm = statusMeta(f.status);
      return `
        <div class="flex items-center justify-between gap-3 border border-black bg-white px-3 py-2">
          <span class="text-sm text-black">${escapeHtml(f.name)}</span>
          <span class="font-mono text-[10px] px-2 py-0.5 ${fm.badge} shrink-0">${fm.label}</span>
        </div>`;
    }).join('');
  }

  document.getElementById('moduleModal').classList.remove('hidden');
}

function closeModal() {
  document.getElementById('moduleModal').classList.add('hidden');
}

function bindModal() {
  document.getElementById('modalClose').addEventListener('click', closeModal);
  document.getElementById('modalOverlay').addEventListener('click', closeModal);
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') closeModal();
  });
}

function bindFilters() {
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      currentFilter = btn.dataset.filter;
      document.querySelectorAll('.filter-btn').forEach(b => {
        b.classList.remove('bg-black', 'text-white');
      });
      btn.classList.add('bg-black', 'text-white');
      renderGrid();
    });
  });
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

init();
