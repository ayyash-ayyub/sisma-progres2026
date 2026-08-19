const STATUS_META = {
  selesai: {
    label: 'Selesai',
    dot: 'bg-black',
    badge: 'bg-black text-white border-2 border-black',
    order: 3
  },
  sedang: {
    label: 'Sedang Dikerjakan',
    dot: 'bg-black',
    badge: 'bg-white text-black border-2 border-black',
    order: 2
  },
  lewat_batas: {
    label: 'Lewat Batas Waktu',
    dot: 'bg-black',
    badge: 'bg-white text-black border-2 border-black font-bold underline underline-offset-2',
    order: 1
  },
  belum_mulai: {
    label: 'Belum Mulai',
    dot: 'bg-slate-300',
    badge: 'bg-white text-slate-400 border border-slate-300',
    order: 0
  }
};

const FEATURE_PROGRESS_WEIGHT = {
  selesai: 1,
  sedang: 0.5,
  lewat_batas: 0.5,
  belum_mulai: 0
};

function statusMeta(status) {
  return STATUS_META[status] || STATUS_META.belum_mulai;
}

function featureWeight(status) {
  return FEATURE_PROGRESS_WEIGHT[status] ?? 0;
}

function formatDate(iso) {
  if (!iso) return '—';
  const d = new Date(iso + 'T00:00:00');
  if (isNaN(d)) return iso;
  return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
}

function daysBetween(fromIso, toIso) {
  const a = new Date(fromIso + 'T00:00:00');
  const b = new Date(toIso + 'T00:00:00');
  return Math.round((b - a) / (1000 * 60 * 60 * 24));
}

function todayIso() {
  const d = new Date();
  return d.toISOString().slice(0, 10);
}

function calcProgress(modules) {
  const weights = modules.flatMap(m =>
    (m.features || []).map(f => m.status === 'selesai' ? 1 : featureWeight(f.status))
  );
  if (!weights.length) return 0;
  const sum = weights.reduce((a, b) => a + b, 0);
  return Math.round((sum / weights.length) * 100);
}

function calcModuleProgress(mod) {
  if (mod.status === 'selesai') return 100;
  const features = mod.features || [];
  if (!features.length) return 0;
  const sum = features.reduce((total, f) => total + featureWeight(f.status), 0);
  return Math.round((sum / features.length) * 100);
}

function uid(prefix = 'm') {
  return prefix + Math.random().toString(36).slice(2, 9);
}
