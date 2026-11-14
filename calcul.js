(() => {
  const S = window.BVStore, esc = S.esc;
  const KEY = 'bv.calcul';
  const DEFAULT = { rate: 80, tiers: [9000, 12000, 14000], planned: {}, days: {} };
  let data = Object.assign({}, DEFAULT, S.readLocal(KEY, {}));
  const save = () => S.writeLocal(KEY, data);

  const pad = n => String(n).padStart(2, '0');
  const iso = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const today = () => iso(new Date());
  const fmt = n => Math.round(n).toLocaleString('fr-FR');
  const fmt1 = n => (Math.round(n * 10) / 10).toLocaleString('fr-FR');
  const shiftDay = (d, k) => { const x = new Date(d + 'T12:00'); x.setDate(x.getDate() + k); return iso(x); };
  const shiftMonth = (m, k) => { const [y, mo] = m.split('-').map(Number); const x = new Date(y, mo - 1 + k, 1); return `${x.getFullYear()}-${pad(x.getMonth() + 1)}`; };
  const dayLabel = d => d === today() ? "Aujourd'hui" : new Date(d + 'T12:00').toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' });
  const monthLabel = m => new Date(m + '-01T12:00').toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
  function weekdaysIn(month) {
    const [y, m] = month.split('-').map(Number); let n = 0;
    for (let d = 1; d <= new Date(y, m, 0).getDate(); d++) { const w = new Date(y, m - 1, d).getDay(); if (w && w < 6) n++; }
    return n;
  }
  const entry = d => data.days[d] || { h: 0, n: 0 };
  function setDay(d, patch) {
    const v = Object.assign({ h: 0, n: 0 }, data.days[d], patch);
    v.n = Math.max(0, Math.round(v.n)); v.h = Math.max(0, Math.min(24, v.h));
    if (!v.h && !v.n) delete data.days[d]; else data.days[d] = v;
    save();
  }
  function monthStats(month) {
    const days = Object.entries(data.days).filter(([d, v]) => d.startsWith(month) && (v.n || v.h)).sort((a, b) => b[0].localeCompare(a[0]));
    const total = days.reduce((s, [, v]) => s + (v.n || 0), 0);
    const hours = days.reduce((s, [, v]) => s + (v.h || 0), 0);
    const worked = days.length;
    const planned = data.planned[month] ?? weekdaysIn(month);
    const remaining = Math.max(0, planned - worked);
    const perDay = worked ? total / worked : 0;
    return { days, total, hours, worked, planned, remaining, perDay, projection: total + perDay * remaining };
  }

  // API utilisée par l'accueil.
  window.SkamCalc = {
    today() { const e = entry(today()); return { n: e.n, h: e.h, target: Math.round(e.h * data.rate), pace: e.h ? fmt1(e.n / e.h) : '—' }; },
    add(k) { const t = today(); setDay(t, { n: entry(t).n + k }); }
  };

  let view = 'day', day = today(), month = today().slice(0, 7);
  const body = document.getElementById('calcBody');

  function render() {
    App.header({ title: 'Calcul', action: { label: '⚙', aria: 'Réglages et sauvegarde', fn: openSettings } });
    const seg = `<div class="seg"><button class="${view === 'day' ? 'on' : ''}" data-view="day">Jour</button><button class="${view === 'month' ? 'on' : ''}" data-view="month">Mois</button></div>`;
    body.innerHTML = `<div class="pad stack fill">${seg}${view === 'day' ? dayHtml() : monthHtml()}</div>`;
    body.querySelectorAll('[data-view]').forEach(b => b.addEventListener('click', () => { view = b.dataset.view; render(); }));
    view === 'day' ? bindDay() : bindMonth();
  }

  function dayHtml() {
    const e = entry(day), target = e.h * data.rate, diff = e.n - target;
    return `<div class="nav-row"><button class="btn icon" data-d="-1" aria-label="Jour précédent">‹</button><strong>${esc(dayLabel(day))}</strong><button class="btn icon" data-d="1" aria-label="Jour suivant" ${day >= today() ? 'disabled' : ''}>›</button></div>
      <div class="card counter">
        <span class="label">DOSSIERS TRAITÉS</span>
        <input class="big mono" id="calcCount" type="number" inputmode="numeric" min="0" value="${e.n}" aria-label="Dossiers traités" />
        <div class="counter-btns"><button class="btn" data-add="-1">−1</button><button class="btn btn-primary" data-add="1">+1</button><button class="btn" data-add="10">+10</button></div>
      </div>
      <div class="card hours"><span class="label">HEURES</span><div class="stepper"><button class="btn icon" data-h="-0.5" aria-label="Moins une demi-heure">−</button><input class="mono" id="calcHours" type="number" inputmode="decimal" min="0" max="24" step="0.25" value="${e.h || 0}" aria-label="Heures travaillées" /><button class="btn icon" data-h="0.5" aria-label="Plus une demi-heure">+</button></div></div>
      <div class="stats3">
        <div><small>Objectif</small><strong class="mono">${fmt(target)}</strong></div>
        <div><small>Écart</small><strong class="mono ${diff >= 0 ? 'good' : 'warn'}">${diff >= 0 ? '+' : ''}${fmt(diff)}</strong></div>
        <div><small>Cadence</small><strong class="mono">${e.h ? fmt1(e.n / e.h) : '—'}</strong></div>
      </div>
      <span class="meter"><span style="width:${target ? Math.min(100, e.n / target * 100) : 0}%"></span></span>
      <p class="foot">Objectif = heures × ${data.rate} dossiers/heure.</p>`;
  }
  function bindDay() {
    body.querySelectorAll('[data-d]').forEach(b => b.addEventListener('click', () => { day = shiftDay(day, Number(b.dataset.d)); if (day > today()) day = today(); render(); }));
    body.querySelectorAll('[data-add]').forEach(b => b.addEventListener('click', () => { setDay(day, { n: entry(day).n + Number(b.dataset.add) }); render(); }));
    body.querySelectorAll('[data-h]').forEach(b => b.addEventListener('click', () => { setDay(day, { h: entry(day).h + Number(b.dataset.h) }); render(); }));
    body.querySelector('#calcCount').addEventListener('change', ev => { setDay(day, { n: Number(ev.target.value) || 0 }); render(); });
    body.querySelector('#calcHours').addEventListener('change', ev => { setDay(day, { h: Number(String(ev.target.value).replace(',', '.')) || 0 }); render(); });
  }

  function monthHtml() {
    const m = monthStats(month);
    const tiers = data.tiers.map((t, i) => {
      const left = Math.max(0, t - m.total), need = m.remaining ? left / m.remaining : left;
      const state = left === 0 ? '✓ atteint' : m.projection >= t ? 'en bonne voie' : 'hors projection';
      return `<div class="tier ${left === 0 ? 'done' : ''}"><div class="row"><strong class="mono">P${i + 1} · ${fmt(t)}</strong><span class="small ${left === 0 || m.projection >= t ? 'good' : 'muted'}">${state}</span></div>
        <span class="meter"><span style="width:${Math.min(100, m.total / t * 100)}%"></span></span>
        <small class="muted">${left === 0 ? `+${fmt(m.total - t)} au-delà` : m.remaining ? `${fmt(need)}/jour · ≈ ${fmt1(need / data.rate)} h/jour` : `reste ${fmt(left)}`}</small></div>`;
    }).join('');
    return `<div class="nav-row"><button class="btn icon" data-m="-1" aria-label="Mois précédent">‹</button><strong>${esc(monthLabel(month))}</strong><button class="btn icon" data-m="1" aria-label="Mois suivant" ${month >= today().slice(0, 7) ? 'disabled' : ''}>›</button></div>
      <div class="stats2">
        <div><small>Dossiers</small><strong class="mono">${fmt(m.total)}</strong></div>
        <div><small>Projection</small><strong class="mono">${fmt(m.projection)}</strong></div>
        <div><small>Cadence moy.</small><strong class="mono">${m.hours ? fmt1(m.total / m.hours) + '/h' : '—'}</strong></div>
        <div><small>Jours</small><strong class="mono">${m.worked}/${m.planned}</strong></div>
      </div>
      <div class="tiers">${tiers}</div>
      <div class="row"><span class="small muted">Jours prévus</span><div class="stepper small-step"><button class="btn icon" data-p="-1" aria-label="Un jour prévu de moins">−</button><strong class="mono">${m.planned}</strong><button class="btn icon" data-p="1" aria-label="Un jour prévu de plus">+</button></div><button class="btn" id="calcHistory">Historique</button></div>`;
  }
  function bindMonth() {
    body.querySelectorAll('[data-m]').forEach(b => b.addEventListener('click', () => { month = shiftMonth(month, Number(b.dataset.m)); render(); }));
    body.querySelectorAll('[data-p]').forEach(b => b.addEventListener('click', () => { const m = monthStats(month); data.planned[month] = Math.max(0, Math.min(31, m.planned + Number(b.dataset.p))); save(); render(); }));
    body.querySelector('#calcHistory').addEventListener('click', openHistory);
  }

  function openHistory() {
    const m = monthStats(month);
    const el = App.sheet(`Historique · ${monthLabel(month)}`, m.days.length
      ? `<div class="list">${m.days.map(([d, v]) => `<button class="item" data-day="${d}"><span class="item-ic mono">${d.slice(8)}</span><span class="item-txt"><strong>${fmt(v.n)} dossiers</strong><small>${esc(dayLabel(d))} · ${fmt1(v.h)} h · ${v.h ? fmt1(v.n / v.h) + '/h' : '—'}</small></span><span class="item-go">›</span></button>`).join('')}</div>`
      : '<p class="empty">Aucun jour saisi ce mois-ci.</p>');
    el.querySelectorAll('[data-day]').forEach(b => b.addEventListener('click', () => { day = b.dataset.day; view = 'day'; App.closeSheet(); render(); }));
  }

  function openSettings() {
    const el = App.sheet('Réglages et sauvegarde', `<form class="form" id="calcSettings">
        <label class="field"><span>Cadence attendue (dossiers / heure)</span><input name="rate" type="number" inputmode="numeric" min="1" value="${data.rate}" /></label>
        ${data.tiers.map((t, i) => `<label class="field"><span>Palier ${i + 1} (dossiers / mois)</span><input name="tier${i}" type="number" inputmode="numeric" min="0" step="100" value="${t}" /></label>`).join('')}
        <button class="btn btn-primary" type="submit">Enregistrer</button>
      </form>
      <p class="foot">Tes chiffres sont enregistrés uniquement sur ce téléphone. Exporte-les de temps en temps.</p>
      <div class="actions"><button class="btn" id="calcExport">Exporter</button><label class="btn">Importer<input id="calcImport" type="file" accept="application/json,.json" hidden /></label></div>`);
    el.querySelector('#calcSettings').addEventListener('submit', ev => {
      ev.preventDefault(); const f = new FormData(ev.target);
      data.rate = Math.max(1, Number(f.get('rate')) || 80);
      data.tiers = data.tiers.map((t, i) => Math.max(0, Number(f.get('tier' + i)) || t));
      save(); App.closeSheet(); render();
    });
    el.querySelector('#calcExport').addEventListener('click', () => {
      const a = document.createElement('a');
      a.href = URL.createObjectURL(new Blob([JSON.stringify(data, null, 1)], { type: 'application/json' }));
      a.download = `skam-calcul-${today()}.json`; a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 5000);
    });
    el.querySelector('#calcImport').addEventListener('change', async ev => {
      const f = ev.target.files[0]; if (!f) return;
      try {
        const d = JSON.parse(await f.text());
        if (!d || typeof d.days !== 'object') throw new Error();
        if (!confirm('Remplacer les chiffres actuels par ceux de la sauvegarde ?')) return;
        data = Object.assign({}, DEFAULT, d); save(); App.closeSheet(); render();
      } catch { alert("Ce fichier n'est pas une sauvegarde valide."); }
    });
  }

  // Revient sur le jour courant après minuit.
  let lastToday = today();
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState !== 'visible') return;
    const t = today(); if (t !== lastToday) { if (day === lastToday) day = t; month = t.slice(0, 7); lastToday = t; if (App.current === 'calcul') render(); }
  });
  App.on('calcul', () => { day = today(); month = day.slice(0, 7); render(); });
})();
