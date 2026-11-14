// S'kam : navigation façon application (écrans plein cadre, en-tête avec retour, panneaux du bas).
window.App = (() => {
  const $ = s => document.querySelector(s);
  const TITLES = { home: "S'kam", procedure: 'Procédure', checks: 'Contrôles', calcul: 'Calcul', reference: 'Cas complexes', training: 'Formation', sources: 'Sources' };
  const TAB_OF = { home: 'home', procedure: 'procedure', checks: 'checks', calcul: 'calcul', reference: 'home', training: 'home', sources: 'home' };
  const enter = {};
  let current = 'home';

  function header({ title, back, action } = {}) {
    $('#barTitle').textContent = title || TITLES[current] || "S'kam";
    const b = $('#barBack'); b.hidden = !back; b.onclick = back || null;
    $('#barLogo').hidden = !!back;
    const a = $('#barAction'); a.hidden = !action;
    if (action) { a.textContent = action.label; a.setAttribute('aria-label', action.aria || action.label); a.onclick = action.fn; } else a.onclick = null;
  }

  function go(name, opts) {
    current = name;
    document.querySelectorAll('.screen').forEach(s => s.classList.toggle('active', s.dataset.screen === name));
    document.querySelectorAll('.tab').forEach(t => { const on = t.dataset.tab === TAB_OF[name]; t.classList.toggle('active', on); on ? t.setAttribute('aria-current', 'page') : t.removeAttribute('aria-current'); });
    const isTab = TAB_OF[name] === name;
    header({ title: TITLES[name], back: isTab ? null : () => go('home') });
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

  return { go, header, sheet, closeSheet, on: (name, fn) => { enter[name] = fn; }, get current() { return current; } };
})();

// ---------- Accueil ----------
(() => {
  const $ = s => document.querySelector(s);
  function render() {
    const c = window.SkamCalc && window.SkamCalc.today();
    const d = new Date();
    $('#homeDate').textContent = d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
    if (!c) return;
    $('#homeCount').textContent = c.n.toLocaleString('fr-FR');
    $('#homeTarget').textContent = c.target ? `/ ${c.target.toLocaleString('fr-FR')}` : '/ — h';
    $('#homeRate').textContent = c.h ? `${c.h.toLocaleString('fr-FR')} h · ${c.pace}/h` : 'heures à saisir';
    $('#homeBar').style.width = `${c.target ? Math.min(100, c.n / c.target * 100) : 0}%`;
  }
  const add = n => { if (window.SkamCalc) { window.SkamCalc.add(n); render(); } };
  $('#homePlus').addEventListener('click', () => add(1));
  $('#homePlus10').addEventListener('click', () => add(10));
  $('#homeMinus').addEventListener('click', () => add(-1));
  $('#homeToday').addEventListener('click', () => App.go('calcul'));
  App.on('home', render);
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible' && App.current === 'home') render(); });
})();

// ---------- Contrôles ----------
App.on('checks', () => App.header({ title: 'Contrôles', action: { label: '↺', aria: 'Réinitialiser la checklist', fn: () => document.querySelectorAll('#checkSteps input').forEach(i => { i.checked = false; }) } }));

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
