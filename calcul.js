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
  const nowHM = () => { const d = new Date(); return `${pad(d.getHours())}:${pad(d.getMinutes())}`; };
  const toMin = hm => { const [h, m] = hm.split(':').map(Number); return h * 60 + m; };
  const toHM = min => { const m = Math.max(0, Math.min(23 * 60 + 59, Math.round(min))); return `${pad(Math.floor(m / 60))}:${pad(m % 60)}`; };
  const fmtDur = min => { const h = Math.floor(min / 60), m = Math.round(min % 60); return h ? `${h} h ${pad(m)}` : `${m} min`; };

  function setDay(d, patch) {
    const v = Object.assign({ h: 0, n: 0 }, data.days[d], patch);
    v.n = Math.max(0, Math.round(v.n)); v.h = Math.max(0, Math.min(24, v.h));
    if (!v.seg || !v.seg.length) { delete v.seg; delete v.done; }
    if (!v.h && !v.n && !v.seg) delete data.days[d]; else data.days[d] = v;
    save();
  }

  // ---------- Chrono de shift : périodes de travail [{s:"08:30", e:"12:00"}], pauses exclues ----------
  const segs = d => (data.days[d] && data.days[d].seg) || [];
  const workedMin = d => segs(d).reduce((t, g) => t + Math.max(0, toMin(g.e || (d === today() ? nowHM() : g.s)) - toMin(g.s)), 0);
  const pauseMin = d => segs(d).reduce((t, g, i, a) => i && a[i - 1].e ? t + Math.max(0, toMin(g.s) - toMin(a[i - 1].e)) : t, 0);
  function state(d = today()) {
    const e = data.days[d], s = segs(d);
    if (!s.length) return { state: 'idle' };
    const last = s[s.length - 1];
    if (!last.e) return { state: 'running', since: last.s, first: s[0].s };
    return { state: e.done ? 'done' : 'paused', since: last.e, first: s[0].s };
  }
  function hoursOf(d) {
    if (segs(d).length && d === today()) return Math.min(24, workedMin(d) / 60);
    return entry(d).h || 0;
  }
  // Garde les heures enregistrées à jour (mois, historique) et ferme les chronos oubliés des jours passés.
  function syncLive() {
    let changed = false;
    for (const [d, e] of Object.entries(data.days)) {
      if (e.start !== undefined) { if (d === today()) e.seg = [{ s: e.start }]; delete e.start; changed = true; } // ancien format
      if (!e.seg || !e.seg.length) continue;
      if (d === today()) { const h = Math.round(workedMin(d) / 60 * 100) / 100; if (h !== e.h) { e.h = h; changed = true; } }
      else {
        const last = e.seg[e.seg.length - 1];
        if (!last.e) { const closed = e.seg.slice(0, -1).reduce((t, g) => t + toMin(g.e) - toMin(g.s), 0); last.e = toHM(toMin(last.s) + Math.max(0, (e.h || 0) * 60 - closed)); e.done = true; changed = true; }
      }
    }
    if (changed) save();
  }
  // Démarre / met en pause / reprend. `at` = heure saisie (HH:MM) pour corriger, sinon maintenant.
  function chronoToggle(at) {
    const t = today(), now = nowHM(), st = state(t), s = segs(t).slice();
    const time = at || now;
    if (toMin(time) > toMin(now)) return 'Heure dans le futur';
    if (st.state === 'running') {
      if (at) { // correction de l'heure de début de la période en cours
        const prevEnd = s.length > 1 ? s[s.length - 2].e : null;
        if (prevEnd && toMin(at) < toMin(prevEnd)) return `Doit être après ${prevEnd}`;
        s[s.length - 1] = { s: at }; setDay(t, { seg: s }); syncLive(); return `Début corrigé : ${at}`;
      }
      s[s.length - 1] = { s: st.since, e: now }; setDay(t, { seg: s }); syncLive(); return `⏸ Pause à ${now}`;
    }
    if (st.state !== 'idle' && toMin(time) < toMin(st.since)) return `Doit être après ${st.since}`;
    s.push({ s: time }); setDay(t, { seg: s, done: false }); syncLive();
    return st.state === 'idle' ? `▶ Shift démarré à ${time}` : `▶ Reprise à ${time}`;
  }
  function chronoStop() {
    const t = today(), st = state(t), s = segs(t).slice(), now = nowHM();
    if (st.state === 'idle') return 'Le chrono n’a pas démarré';
    if (st.state === 'done') return `Shift déjà terminé à ${st.since}`;
    if (st.state === 'running') s[s.length - 1] = { s: st.since, e: now };
    setDay(t, { seg: s, done: true }); syncLive();
    return `■ Fin de shift à ${st.state === 'running' ? now : st.since} · ${fmtDur(workedMin(t))}`;
  }
  syncLive();

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
    today() { syncLive(); const t = today(), e = entry(t), h = hoursOf(t); return { n: e.n, h: Math.round(h * 10) / 10, target: Math.round(h * data.rate), pace: h ? fmt1(e.n / h) : '—' }; },
    add(k) { const t = today(); setDay(t, { n: entry(t).n + k }); },
    rate: () => data.rate,
    tiers: () => data.tiers.slice(),
    month() { syncLive(); return monthStats(today().slice(0, 7)); },
    week() { syncLive(); return Array.from({ length: 7 }, (_, i) => { const d = shiftDay(today(), i - 6), e = entry(d), h = hoursOf(d); return { d, n: e.n, h, target: Math.round(h * data.rate) }; }); },
    state: () => state(today()),
    toggle: () => chronoToggle(),
    stop: () => chronoStop()
  };

  let view = 'day', day = today(), month = today().slice(0, 7), buf = '', flash = '', clock = null;
  const body = document.getElementById('calcBody');

  function render() {
    App.header({ title: 'Calcul', action: { label: '⚙', aria: 'Réglages et sauvegarde', fn: openSettings } });
    const seg = `<div class="seg"><button class="${view === 'day' ? 'on' : ''}" data-view="day">Calculette</button><button class="${view === 'month' ? 'on' : ''}" data-view="month">Mois</button></div>`;
    body.innerHTML = `<div class="pad stack fill calc">${seg}${view === 'day' ? dayHtml() : monthHtml()}</div>`;
    body.querySelectorAll('[data-view]').forEach(b => b.addEventListener('click', () => { view = b.dataset.view; buf = ''; render(); }));
    view === 'day' ? bindDay() : bindMonth();
    clearInterval(clock);
    if (view === 'day') clock = setInterval(() => { if (App.current !== 'calcul') return clearInterval(clock); syncLive(); updateDisplay(); }, 15000);
  }

  // ---------- Calculette ----------
  const KEYS = [
    ['C', 'clear', 'k-fn'], ['⌫', 'back', 'k-fn'], ['CHRONO'], ['−', 'sub', 'k-op'],
    ['7', '7'], ['8', '8'], ['9', '9'], ['+', 'add', 'k-op'],
    ['4', '4'], ['5', '5'], ['6', '6'], ['STOP'],
    ['1', '1'], ['2', '2'], ['3', '3'], ['=', 'set', 'k-op'],
    ['0', '0', 'k-wide'], [',', 'comma'], ['+1', 'plus1', 'k-eq']
  ];
  function statusLine() {
    if (day !== today()) return 'Jour passé : saisis les heures puis h';
    const st = state(day), p = pauseMin(day);
    const pauses = p ? ` · pauses ${fmtDur(p)}` : '';
    if (st.state === 'running') return `<span class="dot-live"></span>En cours depuis ${st.since}${pauses}`;
    if (st.state === 'paused') return `⏸ En pause depuis ${st.since}${pauses}`;
    if (st.state === 'done') return `■ Shift terminé à ${st.since} · ${fmtDur(workedMin(day))} travaillées${pauses}`;
    return '▶ Start pour lancer le chrono · tape 830 avant pour 8 h 30';
  }
  function displayHtml() {
    const e = entry(day), h = hoursOf(day), target = h * data.rate, diff = e.n - target;
    return `<div class="lcd" id="lcd">
      <div class="lcd-top">
        <button class="lcd-day" data-d="-1" aria-label="Jour précédent">‹</button>
        <label class="lcd-date"><span>${esc(dayLabel(day))}</span><input type="date" id="calcDate" value="${day}" max="${today()}" aria-label="Choisir le jour" /></label>
        <button class="lcd-day" data-d="1" aria-label="Jour suivant" ${day >= today() ? 'disabled' : ''}>›</button>
        <span class="lcd-clock mono">${nowHM()}</span>
      </div>
      <div class="lcd-entry mono">${buf ? esc(buf) : flash ? esc(flash) : '&nbsp;'}</div>
      <div class="lcd-total"><strong class="mono">${fmt(e.n)}</strong><span>dossiers</span></div>
      <div class="lcd-stats">
        <div><small>Heures</small><strong class="mono">${fmt1(h)}</strong></div>
        <div><small>Cadence/h</small><strong class="mono">${h ? fmt1(e.n / h) : '—'}</strong></div>
        <div><small>Objectif</small><strong class="mono">${fmt(target)}</strong></div>
        <div><small>Écart</small><strong class="mono ${diff >= 0 ? 'good' : 'warn'}">${diff >= 0 ? '+' : ''}${fmt(diff)}</strong></div>
      </div>
      <span class="meter"><span style="width:${target ? Math.min(100, e.n / target * 100) : 0}%"></span></span>
      <div class="lcd-foot small muted">${statusLine()}</div>
    </div>`;
  }
  const LABELS = { clear: 'Effacer la saisie', back: 'Effacer le dernier chiffre', sub: 'Retirer du total', add: 'Ajouter au total', hours: 'Fixer les heures', stop: 'Fin de shift', set: 'Fixer le total', plus1: 'Plus un dossier', comma: 'Virgule', chrono: 'Démarrer, mettre en pause ou reprendre le chrono' };
  function keypadHtml() {
    const isToday = day === today(), st = state(day).state;
    const keys = KEYS.map(x => {
      if (x[0] === 'CHRONO') return isToday ? (st === 'running' ? ['<span class="ki">⏸</span><span class="kl">Pause</span>', 'chrono', 'k-chrono on'] : ['<span class="ki">▶</span><span class="kl">' + (st === 'idle' ? 'Start' : 'Reprendre') + '</span>', 'chrono', 'k-chrono']) : ['h', 'hours', 'k-op'];
      if (x[0] === 'STOP') return isToday ? ['<span class="ki">■</span><span class="kl">Fin</span>', 'stop', 'k-stop'] : ['', 'none', 'k-fn k-empty'];
      return x;
    });
    return `<div class="keypad" id="keypad">${keys.map(([label, k, cls]) => `<button class="key ${cls || ''}" data-key="${k}" ${k === 'none' ? 'disabled aria-hidden="true"' : `aria-label="${LABELS[k] || label}"`}>${label}</button>`).join('')}</div>`;
  }
  const dayHtml = () => displayHtml() + keypadHtml();
  function updateDisplay() {
    const lcd = body.querySelector('#lcd'), pad_ = body.querySelector('#keypad'); if (!lcd) return;
    lcd.outerHTML = displayHtml();
    if (pad_) { pad_.outerHTML = keypadHtml(); bindKeys(); }
    bindDisplay();
  }
  function bindDisplay() {
    body.querySelectorAll('[data-d]').forEach(b => b.addEventListener('click', () => { day = shiftDay(day, Number(b.dataset.d)); if (day > today()) day = today(); buf = ''; flash = ''; updateDisplay(); }));
    const date = body.querySelector('#calcDate');
    date.addEventListener('change', () => { if (date.value && date.value <= today()) { day = date.value; buf = ''; flash = ''; updateDisplay(); } });
  }
  const num = () => Number(buf.replace(',', '.'));
  // 8 → 08:00 · 830 → 08:30 · 8,5 → 08:30
  function bufToHM() {
    let hh, mm;
    if (buf.includes(',')) { const v = num(); hh = Math.floor(v); mm = Math.round((v - hh) * 60); }
    else if (buf.length <= 2) { hh = Number(buf); mm = 0; }
    else { hh = Number(buf.slice(0, -2)); mm = Number(buf.slice(-2)); }
    return hh > 23 || mm > 59 || Number.isNaN(hh) ? null : `${pad(hh)}:${pad(mm)}`;
  }
  function press(k) {
    const e = entry(day);
    flash = '';
    if (/^\d$/.test(k)) { if (buf.replace(',', '').length < 6) buf = buf === '0' ? k : buf + k; }
    else if (k === 'comma') { if (!buf.includes(',')) buf = (buf || '0') + ','; }
    else if (k === 'back') buf = buf.slice(0, -1);
    else if (k === 'clear') buf = '';
    else if (k === 'plus1') { setDay(day, { n: e.n + 1 }); flash = '+1'; }
    else if (k === 'add' || k === 'sub' || k === 'set') {
      if (!buf) flash = 'Saisis d’abord un nombre';
      else {
        const v = Math.round(num());
        const n = k === 'add' ? e.n + v : k === 'sub' ? e.n - v : v;
        setDay(day, { n }); flash = k === 'add' ? `+${fmt(v)}` : k === 'sub' ? `−${fmt(v)}` : `= ${fmt(v)}`; buf = '';
      }
    } else if (k === 'hours') {
      if (!buf) flash = 'Saisis les heures, ex. 7,5';
      else { const v = Math.min(24, num()); setDay(day, { h: v, seg: [] }); flash = `${fmt1(v)} h`; buf = ''; }
    } else if (k === 'chrono') {
      if (buf) { const hm = bufToHM(); flash = hm ? chronoToggle(hm) : 'Heure invalide'; buf = ''; }
      else flash = chronoToggle();
    } else if (k === 'stop') {
      flash = chronoStop();
    }
    updateDisplay();
  }
  function bindKeys() { body.querySelectorAll('[data-key]').forEach(b => b.addEventListener('click', () => press(b.dataset.key))); }
  function bindDay() { bindDisplay(); bindKeys(); }
  // Clavier physique (ordinateur) quand la calculette est affichée.
  document.addEventListener('keydown', ev => {
    if (App.current !== 'calcul' || view !== 'day' || !document.getElementById('sheet').hidden) return;
    if (ev.target.matches('input, textarea, select')) return;
    const map = { Backspace: 'back', Escape: 'clear', Delete: 'clear', '+': 'add', '-': 'sub', '=': 'set', Enter: 'set', h: 'hours', H: 'hours', ',': 'comma', '.': 'comma', ' ': 'chrono' };
    const k = /^\d$/.test(ev.key) ? ev.key : map[ev.key];
    if (k && !(k === 'hours' && day === today()) && !(k === 'chrono' && day !== today())) { ev.preventDefault(); press(k); }
  });

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
  App.on('calcul', opts => { day = today(); month = day.slice(0, 7); buf = ''; flash = ''; view = opts.view === 'month' ? 'month' : 'day'; syncLive(); render(); });
})();
