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
  const monthLabel = m => new Date(m + '-01T12:00').toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
  const dayLabel = d => new Date(d + 'T12:00').toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' });
  function weekdaysIn(month) {
    const [y, m] = month.split('-').map(Number); let n = 0;
    for (let d = 1; d <= new Date(y, m, 0).getDate(); d++) { const w = new Date(y, m - 1, d).getDay(); if (w && w < 6) n++; }
    return n;
  }

  let day = today();
  const body = document.getElementById('calcBody');

  function render() {
    const month = day.slice(0, 7);
    const e = data.days[day] || { h: 0, n: 0 };
    const target = e.h * data.rate;
    const pct = target ? Math.min(100, e.n / target * 100) : 0;
    const pace = e.h ? e.n / e.h : 0;

    const monthDays = Object.entries(data.days).filter(([d, v]) => d.startsWith(month) && (v.n || v.h)).sort((a, b) => b[0].localeCompare(a[0]));
    const total = monthDays.reduce((s, [, v]) => s + (v.n || 0), 0);
    const hours = monthDays.reduce((s, [, v]) => s + (v.h || 0), 0);
    const worked = monthDays.length;
    const planned = data.planned[month] ?? weekdaysIn(month);
    const remaining = Math.max(0, planned - worked);
    const perDay = worked ? total / worked : 0;
    const projection = total + perDay * remaining;

    const tiers = data.tiers.map((t, i) => {
      const left = Math.max(0, t - total);
      const done = left === 0;
      const need = remaining ? left / remaining : left;
      return `<div class="calc-tier ${done ? 'done' : ''}">
        <div class="calc-row"><strong>Palier ${i + 1} · ${fmt(t)}</strong><span>${done ? '✓ Atteint' : projection >= t ? 'En bonne voie' : 'Hors projection'}</span></div>
        <div class="progress-track"><span style="width:${Math.min(100, total / t * 100)}%"></span></div>
        <small>${done ? `Dépassé de ${fmt(total - t)} dossiers.` : remaining
          ? `Reste ${fmt(left)} dossiers, soit ${fmt(need)} par jour sur ${remaining} jour${remaining > 1 ? 's' : ''} (≈ ${fmt1(need / data.rate)} h/jour à ${data.rate}/h).`
          : `Reste ${fmt(left)} dossiers. Plus aucun jour prévu : ajuste les jours prévus si besoin.`}</small>
      </div>`;
    }).join('');

    body.innerHTML = `
      <div class="section-head"><div><div class="eyebrow">JOURNÉE</div><h2>${esc(dayLabel(day))}</h2></div><input class="calc-date" type="date" id="calcDay" value="${day}" aria-label="Choisir le jour" /></div>
      <div class="training-card">
        <label class="calc-field"><span>Heures travaillées</span><input id="calcHours" type="number" inputmode="decimal" min="0" max="24" step="0.25" value="${e.h || ''}" placeholder="ex. 7" /></label>
        <div class="calc-counter">
          <button class="secondary-btn" data-add="-1">−1</button>
          <input id="calcCount" type="number" inputmode="numeric" min="0" value="${e.n || 0}" aria-label="Dossiers traités" />
          <button class="secondary-btn" data-add="1">+1</button>
          <button class="secondary-btn" data-add="10">+10</button>
        </div>
        <div class="calc-stats">
          <div><small>Objectif du jour</small><strong>${fmt(target)}</strong></div>
          <div><small>Réalisé</small><strong>${fmt(e.n)}</strong></div>
          <div><small>Écart</small><strong class="${e.n - target >= 0 ? 'pos' : 'neg'}">${e.n - target >= 0 ? '+' : ''}${fmt(e.n - target)}</strong></div>
          <div><small>Cadence réelle</small><strong>${e.h ? fmt1(pace) + '/h' : '—'}</strong></div>
        </div>
        <div class="progress-track"><span style="width:${pct}%"></span></div>
        <p class="micro-note">Objectif = heures × ${data.rate} dossiers/heure.</p>
      </div>

      <div class="section-head"><div><div class="eyebrow">MOIS</div><h2>${esc(monthLabel(month))}</h2></div><span class="tiny-tag">${worked} JOUR${worked > 1 ? 'S' : ''} SAISI${worked > 1 ? 'S' : ''}</span></div>
      <div class="calc-stats calc-month">
        <div><small>Dossiers du mois</small><strong>${fmt(total)}</strong></div>
        <div><small>Heures</small><strong>${fmt1(hours)} h</strong></div>
        <div><small>Cadence moyenne</small><strong>${hours ? fmt1(total / hours) + '/h' : '—'}</strong></div>
        <div><small>Moyenne / jour</small><strong>${fmt(perDay)}</strong></div>
        <div><small>Projection fin de mois</small><strong>${fmt(projection)}</strong></div>
        <div><small>Jours restants</small><strong>${remaining}</strong></div>
      </div>
      <label class="calc-field"><span>Jours de travail prévus dans le mois</span><input id="calcPlanned" type="number" inputmode="numeric" min="0" max="31" value="${planned}" /></label>
      <div class="calc-tiers">${tiers}</div>

      <div class="section-head"><div><div class="eyebrow">HISTORIQUE</div><h2>Jours saisis</h2></div></div>
      <div class="document-list">${monthDays.length ? monthDays.map(([d, v]) => `<button class="doc-card" data-day="${d}"><span class="flag">${d.slice(8)}</span><span class="doc-info"><strong>${fmt(v.n)} dossiers</strong><small>${esc(dayLabel(d))} · ${fmt1(v.h)} h · ${v.h ? fmt1(v.n / v.h) + '/h' : '—'}</small></span><span class="doc-arrow">↗</span></button>`).join('') : '<div class="empty-state">Aucun jour saisi ce mois-ci.</div>'}</div>

      <details class="notice calc-settings"><summary><strong>Réglages et sauvegarde</strong></summary>
        <label class="calc-field"><span>Cadence attendue (dossiers / heure)</span><input id="calcRate" type="number" min="1" value="${data.rate}" /></label>
        ${data.tiers.map((t, i) => `<label class="calc-field"><span>Palier ${i + 1} (dossiers / mois)</span><input data-tier="${i}" type="number" min="0" step="100" value="${t}" /></label>`).join('')}
        <p>Les chiffres sont enregistrés uniquement sur ce téléphone. Fais une sauvegarde de temps en temps.</p>
        <div class="calc-actions"><button class="secondary-btn" id="calcExport">Exporter</button><label class="secondary-btn">Importer<input id="calcImport" type="file" accept="application/json,.json" hidden /></label></div>
      </details>`;

    const setDay = patch => { const v = Object.assign({ h: 0, n: 0 }, data.days[day], patch); if (!v.h && !v.n) delete data.days[day]; else data.days[day] = v; save(); };
    document.getElementById('calcDay').addEventListener('change', ev => { if (ev.target.value) { day = ev.target.value; render(); } });
    document.getElementById('calcHours').addEventListener('change', ev => { setDay({ h: Math.max(0, Number(ev.target.value) || 0) }); render(); });
    document.getElementById('calcCount').addEventListener('change', ev => { setDay({ n: Math.max(0, Math.round(Number(ev.target.value) || 0)) }); render(); });
    body.querySelectorAll('[data-add]').forEach(b => b.addEventListener('click', () => { setDay({ n: Math.max(0, (data.days[day]?.n || 0) + Number(b.dataset.add)) }); render(); }));
    document.getElementById('calcPlanned').addEventListener('change', ev => { data.planned[month] = Math.max(0, Number(ev.target.value) || 0); save(); render(); });
    body.querySelectorAll('[data-day]').forEach(b => b.addEventListener('click', () => { day = b.dataset.day; render(); window.scrollTo({ top: 0, behavior: 'smooth' }); }));
    document.getElementById('calcRate').addEventListener('change', ev => { data.rate = Math.max(1, Number(ev.target.value) || 80); save(); render(); });
    body.querySelectorAll('[data-tier]').forEach(i => i.addEventListener('change', () => { data.tiers[Number(i.dataset.tier)] = Math.max(0, Number(i.value) || 0); save(); render(); }));
    document.getElementById('calcExport').addEventListener('click', () => {
      const a = document.createElement('a');
      a.href = URL.createObjectURL(new Blob([JSON.stringify(data, null, 1)], { type: 'application/json' }));
      a.download = `skam-calcul-${today()}.json`; a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 5000);
    });
    document.getElementById('calcImport').addEventListener('change', async ev => {
      const f = ev.target.files[0]; if (!f) return;
      try {
        const d = JSON.parse(await f.text());
        if (!d || typeof d.days !== 'object') throw new Error();
        if (!confirm('Remplacer les chiffres actuels par ceux de la sauvegarde ?')) return;
        data = Object.assign({}, DEFAULT, d); save(); render();
      } catch { alert("Ce fichier n'est pas une sauvegarde valide."); }
    });
  }

  document.querySelectorAll('[data-nav="calcul"],[data-go="calcul"]').forEach(b => b.addEventListener('click', () => { day = today(); render(); }));
  render();
})();
