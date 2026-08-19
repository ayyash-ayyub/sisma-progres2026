import { subscribeToData } from './data-service.js';

function addDays(date, days) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function buildWeeks(startIso, endIso) {
  const weeks = [];
  const end = new Date(endIso + 'T00:00:00');
  let cursor = new Date(startIso + 'T00:00:00');
  while (cursor <= end) {
    weeks.push(new Date(cursor));
    cursor = addDays(cursor, 7);
  }
  if (!weeks.length) weeks.push(new Date(startIso + 'T00:00:00'));
  return weeks;
}

function groupByMonth(weeks) {
  const groups = [];
  weeks.forEach(w => {
    const key = w.getFullYear() + '-' + w.getMonth();
    const last = groups[groups.length - 1];
    if (last && last.key === key) {
      last.count++;
    } else {
      groups.push({ key, count: 1, label: w.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' }) });
    }
  });
  return groups;
}

function weekIndexForDate(weeks, iso) {
  if (!iso) return -1;
  const target = new Date(iso + 'T00:00:00');
  for (let i = weeks.length - 1; i >= 0; i--) {
    if (target >= weeks[i]) return i;
  }
  return 0;
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function init() {
  subscribeToData(
    ({ meta, modules }) => renderTimeline(meta, modules),
    () => document.getElementById('loadError').classList.remove('hidden')
  );
}

function renderTimeline(meta, modules) {
  const weeks = buildWeeks(meta.startDate, meta.deadline);
  const monthGroups = groupByMonth(weeks);
  const weekCount = weeks.length;

  const table = document.getElementById('timelineTable');
  table.style.display = 'grid';
  table.style.gridTemplateColumns = `220px repeat(${weekCount}, minmax(36px, 1fr))`;

  let html = '';

  html += `<div class="sticky left-0 z-10 bg-white border-b-2 border-r-2 border-black"></div>`;
  monthGroups.forEach(g => {
    html += `<div class="border-b-2 border-black border-r border-slate-300 px-2 py-1.5 text-xs font-mono font-bold text-black text-center" style="grid-column: span ${g.count}">${g.label}</div>`;
  });

  html += `<div class="sticky left-0 z-10 bg-white border-b-2 border-r-2 border-black"></div>`;
  weeks.forEach(w => {
    html += `<div class="border-b-2 border-black border-r border-slate-200 px-1 py-1.5 text-[10px] font-mono text-slate-500 text-center">${w.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}</div>`;
  });

  modules.forEach(m => {
    const sm = statusMeta(m.status);
    const progress = calcModuleProgress(m);
    const featureCount = (m.features || []).length;

    html += `
      <div class="sticky left-0 z-10 bg-white border-b border-black border-r-2 px-3 py-3 flex items-center justify-between gap-2">
        <div>
          <p class="font-display font-600 text-sm text-black">${escapeHtml(m.name)}</p>
          <p class="text-[11px] font-mono text-slate-400">${featureCount} fitur</p>
        </div>
        <span class="font-mono text-[10px] px-1.5 py-0.5 ${sm.badge} shrink-0">${sm.label}</span>
      </div>`;

    const targetWeek = weekIndexForDate(weeks, m.dueDate);
    html += `<div class="relative border-b border-black" style="grid-column: 2 / -1;">`;
    html += `<div class="absolute inset-0" style="background-image: repeating-linear-gradient(to right, #000 0, #000 1px, transparent 1px, transparent calc(100% / ${weekCount})); opacity: 0.15;"></div>`;

    if (targetWeek >= 0) {
      const barWidthPct = ((targetWeek + 1) / weekCount) * 100;
      html += `
        <div class="relative my-2 ml-1 h-4 border-2 border-black bg-white" style="width: calc(${barWidthPct}% - 8px);">
          <div class="h-full bg-green-500" style="width: ${progress}%"></div>
        </div>`;
    } else {
      html += `<p class="relative text-[11px] font-mono text-slate-400 px-2 py-3">Belum ada target</p>`;
    }
    html += `</div>`;
  });

  table.innerHTML = html;
}

init();
