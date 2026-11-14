// S'kam : navigation façon application (écrans plein cadre, en-tête avec retour, panneaux du bas).
window.App = (() => {
  const $ = s => document.querySelector(s);
  const TITLES = { home: "S'kam", procedure: 'Procédure', checks: 'Contrôles', calcul: 'Calcul', reference: 'Cas complexes', training: 'Formation', sources: 'Sources' };
  const TAB_OF = { home: 'home', procedure: 'procedure', checks: 'checks', calcul: 'calcul', reference: 'home', training: 'home', sources: 'home' };
  const enter = {};
  let current = 'home';

  function header({ title, back, action, logo } = {}) {
    $('#barTitle').textContent = title || TITLES[current] || "S'kam";
    $('#barTitle').hidden = !!logo;
    $('#barLogo').hidden = !logo;
    const b = $('#barBack'); b.hidden = !back; b.onclick = back || null;
    const a = $('#barAction'); a.hidden = !action;
    if (action) { a.textContent = action.label; a.setAttribute('aria-label', action.aria || action.label); a.onclick = action.fn; } else a.onclick = null;
  }

  // Message bref en bas de l'écran.
  let toastTimer;
  function toast(msg) {
    const t = $('#toast'); t.textContent = msg; t.hidden = false;
    clearTimeout(toastTimer); toastTimer = setTimeout(() => { t.hidden = true; }, 2200);
  }

  // Visionneuse plein écran (zoom par bouton ou double-tap, défilement dans l'image zoomée).
  function view(src, caption, source) {
    const box = $('#viewerImg'); box.classList.remove('zoom');
    box.innerHTML = `<img src="${src}" alt="${String(caption || 'Spécimen').replace(/"/g, '&quot;')}" />`;
    $('#viewerCap').textContent = caption || '';
    const link = $('#viewerSource'); link.hidden = !source; if (source) link.href = source;
    $('#viewer').hidden = false;
  }
  const closeViewer = () => { $('#viewer').hidden = true; $('#viewerImg').innerHTML = ''; };
  const toggleZoom = () => $('#viewerImg').classList.toggle('zoom');
  $('#viewerClose').addEventListener('click', closeViewer);
  $('#viewerZoom').addEventListener('click', toggleZoom);
  $('#viewerImg').addEventListener('dblclick', toggleZoom);
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && !$('#viewer').hidden) closeViewer(); });

  function go(name, opts) {
    current = name;
    document.querySelectorAll('.screen').forEach(s => s.classList.toggle('active', s.dataset.screen === name));
    document.querySelectorAll('.tab').forEach(t => { const on = t.dataset.tab === TAB_OF[name]; t.classList.toggle('active', on); on ? t.setAttribute('aria-current', 'page') : t.removeAttribute('aria-current'); });
    const isTab = TAB_OF[name] === name;
    header({ title: TITLES[name], back: isTab ? null : () => go('home'), logo: name === 'home' });
    closeSheet();
    if (enter[name]) enter[name](opts || {});
  }

  // Panneau qui monte du bas (formulaires, réglages, historique).
  function sheet(title, html) {
    $('#sheetTitle').textContent = title;
    $('#sheetBody').innerHTML = html;
    $('#sheet').hidden = false;
    $('#sheetBody').scrollTop = 0;
    return $('#sheetBody');
  }
  function closeSheet() { $('#sheet').hidden = true; $('#sheetBody').innerHTML = ''; }
  document.querySelectorAll('#sheet [data-close]').forEach(el => el.addEventListener('click', closeSheet));
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && !$('#sheet').hidden) closeSheet(); });

  document.querySelectorAll('.tab').forEach(t => t.addEventListener('click', () => go(t.dataset.tab)));
  document.querySelectorAll('[data-open]').forEach(t => t.addEventListener('click', () => t.dataset.open === 'search' ? go('procedure', { search: true }) : go(t.dataset.open)));

  return { go, header, sheet, closeSheet, toast, view, on: (name, fn) => { enter[name] = fn; }, get current() { return current; } };
})();

// ---------- Accueil : tableau de bord ----------
(() => {
  const $ = s => document.querySelector(s);
  const fmt = n => Math.round(n).toLocaleString('fr-FR');
  const fmt1 = n => (Math.round(n * 10) / 10).toLocaleString('fr-FR');
  const pad = n => String(n).padStart(2, '0');
  let tick = null, selected = 6;

  function render() {
    const C = window.SkamCalc; if (!C) return;
    const now = new Date();
    const hr = now.getHours(); $('#homeHello').textContent = hr >= 18 || hr < 5 ? 'Bonsoir' : 'Bonjour';
    $('#homeDate').textContent = now.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
    $('#homeClock').textContent = `${pad(now.getHours())}:${pad(now.getMinutes())}`;

    // Aujourd'hui
    const t = C.today();
    $('#homeCount').textContent = fmt(t.n);
    $('#homeHours').textContent = t.h ? `${fmt1(t.h)} h` : '—';
    $('#homePace').textContent = t.h ? t.pace : '—';
    $('#homePct').textContent = t.target ? `${Math.round(t.n / t.target * 100)} %` : '—';
    $('#homeBar').style.width = `${t.target ? Math.min(100, t.n / t.target * 100) : 0}%`;
    const st = C.state();
    $('#homeStatus').textContent = { running: `● en cours depuis ${st.since}`, paused: `⏸ en pause depuis ${st.since}`, done: `■ shift terminé à ${st.since}`, idle: 'chrono à l’arrêt' }[st.state];
    const cb = $('#homeChrono');
    cb.innerHTML = st.state === 'running' ? '⏸' : '▶';
    cb.setAttribute('aria-label', st.state === 'running' ? 'Mettre en pause' : st.state === 'idle' ? 'Démarrer le shift' : 'Reprendre');
    cb.classList.toggle('on', st.state === 'running');

    // Mois : total, prochain palier, projection
    const m = C.month(), tiers = C.tiers(), max = Math.max(...tiers, m.total, 1);
    const next = tiers.find(x => x > m.total);
    $('#homeMonthLabel').textContent = now.toLocaleDateString('fr-FR', { month: 'long' }).toUpperCase();
    $('#homeMonthTotal').textContent = fmt(m.total);
    $('#homeMonthOf').textContent = next ? `/ ${fmt(next)}` : 'tous paliers atteints';
    $('#homeNext').textContent = next ? (m.remaining ? `${fmt((next - m.total) / m.remaining)}/jour pour P${tiers.indexOf(next) + 1}` : `reste ${fmt(next - m.total)}`) : '✓ P3 atteint';
    $('#homeTierFill').style.width = `${Math.min(100, m.total / max * 100)}%`;
    const box = $('#homeTiers');
    box.querySelectorAll('.tm-tick').forEach(x => x.remove());
    tiers.forEach((x, i) => box.insertAdjacentHTML('beforeend', `<span class="tm-tick ${m.total >= x ? 'hit' : ''}" style="left:${x / max * 100}%"><i></i><b class="mono">P${i + 1}</b></span>`));
    $('#homeProj').textContent = fmt(m.projection);
    $('#homeAvg').textContent = m.worked ? fmt(m.perDay) : '—';
    $('#homeDays').textContent = `${m.worked}/${m.planned}`;

    // 7 derniers jours : barres + objectif du jour en pointillé
    const w = C.week(), top = Math.max(1, ...w.map(x => Math.max(x.n, x.target)));
    $('#homeWeekTotal').textContent = `${fmt(w.reduce((s, x) => s + x.n, 0))} dossiers`;
    $('#homeWeek').innerHTML = w.map((x, i) => {
      const lbl = new Date(x.d + 'T12:00').toLocaleDateString('fr-FR', { weekday: 'narrow' });
      return `<button class="wk-col ${i === selected ? 'sel' : ''}" role="listitem" data-i="${i}" aria-label="${new Date(x.d + 'T12:00').toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric' })} : ${x.n} dossiers${x.target ? `, objectif ${x.target}` : ''}">
        <span class="wk-area">${x.target ? `<span class="wk-target" style="bottom:${x.target / top * 100}%"></span>` : ''}<span class="wk-bar" style="height:${x.n ? Math.max(3, x.n / top * 100) : 0}%"></span></span>
        <span class="wk-lbl mono">${i === 6 ? 'auj' : lbl}</span></button>`;
    }).join('');
    const showDetail = i => {
      const x = w[i], d = new Date(x.d + 'T12:00').toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric' });
      $('#homeWeekDetail').innerHTML = `<b>${d}</b> · ${fmt(x.n)} dossiers${x.h ? ` · ${fmt1(x.h)} h · ${fmt1(x.n / x.h)}/h` : ''}${x.target ? ` · objectif ${fmt(x.target)}` : ''}`;
    };
    $('#homeWeek').querySelectorAll('[data-i]').forEach(b => b.addEventListener('click', () => { selected = Number(b.dataset.i); $('#homeWeek').querySelectorAll('.wk-col').forEach(c => c.classList.toggle('sel', c === b)); showDetail(selected); }));
    if (selected !== 6 || t.n) showDetail(selected);
  }

  $('#homePlus').addEventListener('click', ev => { ev.stopPropagation(); window.SkamCalc && window.SkamCalc.add(1); render(); });
  $('#homeChrono').addEventListener('click', ev => { ev.stopPropagation(); window.SkamCalc && window.SkamCalc.toggle(); render(); });
  const open = (el, fn) => { el.addEventListener('click', fn); el.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fn(); } }); };
  open($('#homeToday'), () => App.go('calcul'));
  open($('#homeMonth'), () => App.go('calcul', { view: 'month' }));
  App.on('home', () => {
    selected = 6; render();
    clearInterval(tick);
    tick = setInterval(() => { if (App.current !== 'home' || document.hidden) return; render(); }, 20000);
  });
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible' && App.current === 'home') render(); });
})();

// ---------- Contrôles ----------
(() => {
  const reset = () => document.querySelectorAll('#checkSteps input').forEach(i => { i.checked = false; });
  App.on('checks', () => App.header({ title: 'Contrôles', action: { label: '↺', aria: 'Réinitialiser la checklist', fn: reset } }));
  document.getElementById('checksDone').addEventListener('click', () => {
    if (window.SkamCalc) window.SkamCalc.add(1);
    reset();
    const t = window.SkamCalc && window.SkamCalc.today();
    App.toast(`+1 dossier · ${t ? t.n : ''} aujourd'hui`);
  });
})();

// ---------- Formation ----------
(() => {
  const $ = s => document.querySelector(s);
  const cases = [
    { title: 'Une information discordante', description: "Deux éléments d'un dossier fictif présentent une différence d'orthographe sur le nom. Aucun autre élément n'est fourni.", answers: ['Conclure immédiatement à une fraude.', 'Comparer les éléments, chercher une explication documentée et appliquer la procédure.', 'Ignorer la différence.'], correct: 1, feedback: "Une discordance est un signal à examiner : on recoupe et on applique la procédure, sans conclure sur un seul indice." },
    { title: 'Une référence incertaine', description: 'Une fiche trouvée en ligne ne précise ni sa date de mise à jour ni la version du document concerné.', answers: ['L\'utiliser, elle apparaît dans un moteur de recherche.', 'Chercher une source officielle et confirmer version et période.', 'Considérer que toutes les versions sont identiques.'], correct: 1, feedback: 'La provenance, la date et le périmètre de la référence sont essentiels.' },
    { title: 'Un contrôle non concluant', description: "Un contrôle visuel autorisé ne permet pas de confirmer un élément attendu. L'image est de qualité moyenne.", answers: ['Classer le document comme faux.', 'Demander ou effectuer une vérification complémentaire selon la procédure.', "Se fier à l'apparence générale."], correct: 1, feedback: "Un contrôle non concluant n'est pas une preuve de fraude : on suit le circuit de vérification complémentaire." }
  ];
  let i = 0, score = 0, done = false;
  const label = () => `${score} bonne${score > 1 ? 's' : ''} réponse${score > 1 ? 's' : ''}`;
  function render() {
    const c = cases[i];
    $('#caseNumber').textContent = `${i + 1} / ${cases.length}`;
    $('#caseTitle').textContent = c.title;
    $('#caseDescription').textContent = c.description;
    $('#feedback').hidden = true; $('#nextCase').hidden = true; done = false;
    $('#answers').innerHTML = c.answers.map((a, k) => `<button class="answer" data-answer="${k}"></button>`).join('');
    document.querySelectorAll('[data-answer]').forEach((b, k) => { b.textContent = `${String.fromCharCode(65 + k)}. ${c.answers[k]}`; b.addEventListener('click', () => answer(k)); });
    $('#scoreLabel').textContent = label();
    $('#progressBar').style.width = `${i / cases.length * 100}%`;
  }
  function answer(n) {
    if (done) return; done = true;
    const c = cases[i];
    document.querySelectorAll('[data-answer]').forEach((b, k) => { b.disabled = true; if (k === c.correct) b.classList.add('ok'); else if (k === n) b.classList.add('ko'); });
    if (n === c.correct) score++;
    $('#feedback').textContent = (n === c.correct ? 'Bonne réponse. ' : 'À retenir. ') + c.feedback;
    $('#feedback').hidden = false;
    $('#nextCase').hidden = false;
    $('#nextCase').textContent = i === cases.length - 1 ? 'Recommencer ↻' : 'Cas suivant →';
    $('#scoreLabel').textContent = label();
    $('#progressBar').style.width = `${(i + 1) / cases.length * 100}%`;
  }
  $('#nextCase').addEventListener('click', () => { i = (i + 1) % cases.length; if (i === 0) score = 0; render(); });
  App.on('training', () => {});
  render();
})();

// ---------- Installation et mises à jour ----------
document.addEventListener('DOMContentLoaded', () => App.go('home'));
if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
  const hadController = !!navigator.serviceWorker.controller; let reloaded = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => { if (hadController && !reloaded) { reloaded = true; location.reload(); } });
  window.addEventListener('load', () => navigator.serviceWorker.register('./sw.js', { updateViaCache: 'none' }).then(r => r.update()).catch(() => {}));
}
