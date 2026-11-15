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
  // onClose : appelé une fois à la fermeture, quel que soit le moyen (✕, fond, Échap, changement d'écran).
  let onClose = null;
  function sheet(title, html, close) {
    onClose = close || null;
    $('#sheetTitle').textContent = title;
    $('#sheetBody').innerHTML = html;
    $('#sheet').hidden = false;
    $('#sheetBody').scrollTop = 0;
    return $('#sheetBody');
  }
  function closeSheet() { $('#sheet').hidden = true; $('#sheetBody').innerHTML = ''; const f = onClose; onClose = null; if (f) f(); }
  document.querySelectorAll('#sheet [data-close]').forEach(el => el.addEventListener('click', closeSheet));
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && !$('#sheet').hidden) closeSheet(); });

  document.querySelectorAll('.tab').forEach(t => t.addEventListener('click', () => go(t.dataset.tab)));
  document.querySelectorAll('[data-open]').forEach(t => t.addEventListener('click', () => t.dataset.open === 'search' ? go('procedure', { search: true }) : go(t.dataset.open)));

  return { go, header, sheet, closeSheet, toast, view, on: (name, fn) => { enter[name] = fn; }, get current() { return current; } };
})();

// ---------- Accueil : tableau de bord simple ----------
// Peu de chiffres : un anneau pour le jour, une phrase pour se situer, une barre pour le mois, un graphique pour la semaine.
// Le détail complet reste dans l'onglet Calcul.
(() => {
  const $ = s => document.querySelector(s);
  const fmt = n => Math.round(n).toLocaleString('fr-FR');
  const fmt1 = n => (Math.round(n * 10) / 10).toLocaleString('fr-FR');
  const pad = n => String(n).padStart(2, '0');
  const fmtDur = min => { const h = Math.floor(min / 60), m = Math.round(min % 60); return h ? `${h} h ${pad(m)}` : `${m} min`; };
  const fmtWait = min => min >= 1440 ? `${Math.floor(min / 1440)} j ${Math.floor(min % 1440 / 60)} h` : fmtDur(min);
  const dayShort = d => new Date(d + 'T12:00').toLocaleDateString('fr-FR', { weekday: 'long' });
  const RING = 2 * Math.PI * 52;
  let tick = null, selected = -1, wkMode = BVStore.readLocal('bv.homeWeek', 'n') === 'h' ? 'h' : 'n';

  // Aujourd'hui : anneau (dossiers / objectif du jour) + où j'en suis + horaires.
  function renderToday(C, sc) {
    const t = C.today(), T = sc.today, st = C.state(), rate = C.rate();
    const goal = T ? T.target : t.target; // objectif du planning, sinon heures faites × cadence
    const ratio = goal ? Math.min(1, t.n / goal) : 0;
    $('#homeCount').textContent = fmt(t.n);
    $('#homeOf').textContent = goal ? `/ ${fmt(goal)}` : 'dossiers';
    const fg = $('#homeRingFg');
    fg.style.strokeDasharray = `${RING}`; fg.style.strokeDashoffset = `${RING * (1 - ratio)}`;
    fg.classList.toggle('hit', !!goal && t.n >= goal);
    $('#homeRing').setAttribute('aria-label', goal ? `${t.n} dossiers sur un objectif de ${goal}` : `${t.n} dossiers`);

    // Où j'en suis : comparaison au rythme attendu pour les heures déjà faites.
    const pace = $('#homePace'); let msg = '';
    pace.className = 'pace';
    if (t.h > 0) {
      const diff = t.n - t.h * rate, margin = rate / 4;
      if (diff > margin) { pace.textContent = `En avance · +${fmt(diff)}`; pace.classList.add('good'); }
      else if (diff < -margin) { pace.textContent = `En retard · −${fmt(-diff)}`; pace.classList.add('warn'); }
      else pace.textContent = 'Dans le rythme';
    } else pace.textContent = '';
    if (goal && t.n >= goal) msg = 'Objectif du jour atteint ✓';
    else if (T && T.phase === 'during' && T.remaining > 0) msg = `Vise ${fmt((goal - t.n) / Math.max(T.remaining / 60, 0.25))}/h jusqu'à ${T.e}`;
    else if (T && T.phase === 'before') msg = `Service à ${T.s}`;
    else if (!T && sc.has) msg = sc.next ? `Repos · reprise ${dayShort(sc.next.d)} ${sc.next.s}` : 'Repos';
    else if (!t.n && !t.h) msg = sc.has ? '' : 'Lance ▶ ou touche « Bonjour » pour ton planning';
    $('#homeMsg').textContent = msg;

    // Ligne du service : horaires + temps restant (barre de temps) ou état du chrono.
    const box = $('#homeShiftBox'); let left = '', right = '', pct = 0, showBar = false;
    if (T) {
      showBar = true; pct = T.pct; left = `${T.s} → ${T.e}`;
      right = T.phase === 'before' ? `dans ${fmtWait(T.startsIn)}` : T.phase === 'during' ? `reste ${fmtDur(T.remaining)}` : 'terminé';
    }
    const chrono = { running: `● chrono depuis ${st.since}`, paused: `⏸ pause depuis ${st.since}`, done: `■ fini à ${st.since}`, idle: '' }[st.state];
    if (chrono) left = left ? `${left} · ${chrono}` : chrono;
    box.hidden = !left && !right;
    box.querySelector('.meter').hidden = !showBar;
    $('#planBar').style.width = `${Math.min(100, pct)}%`;
    $('#homeShift').textContent = left; $('#homeShiftRight').textContent = right;

    const cb = $('#homeChrono');
    cb.innerHTML = st.state === 'running' ? '⏸' : '▶';
    cb.setAttribute('aria-label', st.state === 'running' ? 'Mettre en pause' : st.state === 'idle' ? 'Démarrer le shift' : 'Reprendre');
    cb.classList.toggle('on', st.state === 'running');
  }

  // Mois : total, barre vers les paliers, une phrase.
  function renderMonth(C, now) {
    const m = C.month(), tiers = C.tiers(), max = Math.max(...tiers, m.total, 1);
    const next = tiers.find(x => x > m.total), k = next ? tiers.indexOf(next) + 1 : tiers.length;
    $('#homeMonthLabel').textContent = now.toLocaleDateString('fr-FR', { month: 'long' }).toUpperCase();
    $('#homeMonthTotal').textContent = fmt(m.total);
    $('#homeMonthOf').textContent = next ? `/ ${fmt(next)}` : `P${k} atteint ✓`;
    const nx = $('#homeNext'); nx.className = 'small';
    if (!next) nx.textContent = '';
    else if (m.worked && m.projection >= next) { nx.textContent = `P${k} en bonne voie`; nx.classList.add('good'); }
    else if (m.remaining) { nx.textContent = `${fmt((next - m.total) / m.remaining)}/jour pour P${k}`; nx.classList.add('muted'); }
    else { nx.textContent = `reste ${fmt(next - m.total)}`; nx.classList.add('muted'); }
    $('#homeTierFill').style.width = `${Math.min(100, m.total / max * 100)}%`;
    const box = $('#homeTiers');
    box.querySelectorAll('.tm-tick').forEach(x => x.remove());
    tiers.forEach((x, i) => box.insertAdjacentHTML('beforeend', `<span class="tm-tick ${m.total >= x ? 'hit' : ''}" style="left:${x / max * 100}%"><i></i><b class="mono">P${i + 1}</b></span>`));
  }

  // Semaine : barres (vert = objectif atteint) + une phrase de résumé ; toucher une barre pour le détail.
  function renderWeek(C, sc) {
    const H = wkMode === 'h';
    const w = H ? sc.week.map(x => ({ d: x.d, val: x.h, target: x.planH, n: x.n, today: x.today, future: x.future }))
                : C.week().map((x, i) => ({ d: x.d, val: x.n, target: x.target, h: x.h, today: i === 6 }));
    const top = Math.max(1, ...w.map(x => Math.max(x.val, x.target)));
    document.querySelectorAll('[data-wk]').forEach(b => { const on = b.dataset.wk === wkMode; b.classList.toggle('on', on); b.setAttribute('aria-pressed', on); });
    $('#homeWeekLabel').textContent = H ? 'MA SEMAINE' : '7 DERNIERS JOURS';
    $('#homeWeek').setAttribute('aria-label', H ? 'Heures faites et prévues, semaine en cours' : 'Dossiers par jour sur 7 jours');
    $('#homeWeek').innerHTML = w.map((x, i) => {
      const lbl = new Date(x.d + 'T12:00').toLocaleDateString('fr-FR', { weekday: 'narrow' });
      const long = new Date(x.d + 'T12:00').toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric' });
      const hit = x.target > 0 && x.val >= x.target;
      const aria = H ? `${long} : ${fmt1(x.val)} heures${x.target ? `, prévu ${fmt1(x.target)}` : ''}` : `${long} : ${x.val} dossiers${x.target ? `, objectif ${x.target}` : ''}`;
      return `<button class="wk-col ${i === selected ? 'sel' : ''} ${x.future ? 'future' : ''} ${hit ? 'hit' : ''}" role="listitem" data-i="${i}" aria-label="${aria}">
        <span class="wk-area">${x.target ? `<span class="wk-target" style="bottom:${x.target / top * 100}%"></span>` : ''}<span class="wk-bar" style="height:${x.val ? Math.max(3, x.val / top * 100) : 0}%"></span></span>
        <span class="wk-lbl mono">${x.today ? 'auj' : lbl}</span></button>`;
    }).join('');
    const summary = () => {
      if (H) { const done = sc.week.reduce((s, x) => s + x.h, 0), plan = sc.week.reduce((s, x) => s + x.planH, 0); return plan ? `${fmt1(done)} h faites sur ${fmt1(plan)} h prévues` : `${fmt1(done)} h faites · ajoute ton planning pour les heures prévues`; }
      const worked = w.filter(x => x.val || x.h), hits = worked.filter(x => x.target && x.val >= x.target).length;
      return worked.length ? `Objectif atteint ${hits} jour${hits > 1 ? 's' : ''} sur ${worked.length}` : 'Pas encore de dossiers cette semaine';
    };
    const detail = i => {
      const x = w[i], d = new Date(x.d + 'T12:00').toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric' });
      return H ? `<b>${d}</b> · ${x.future ? 'à venir' : `${fmt1(x.val)} h`}${x.target ? ` / ${fmt1(x.target)} h prévues` : ' · repos'}`
               : `<b>${d}</b> · ${fmt(x.val)} dossiers${x.target ? ` / ${fmt(x.target)}` : ''}`;
    };
    $('#homeWeekDetail').innerHTML = selected >= 0 ? detail(selected) : summary();
    $('#homeWeek').querySelectorAll('[data-i]').forEach(b => b.addEventListener('click', () => {
      const i = Number(b.dataset.i); selected = selected === i ? -1 : i; // retoucher la barre revient au résumé
      $('#homeWeek').querySelectorAll('.wk-col').forEach(c => c.classList.toggle('sel', Number(c.dataset.i) === selected));
      $('#homeWeekDetail').innerHTML = selected >= 0 ? detail(selected) : summary();
    }));
  }

  function render() {
    const C = window.SkamCalc; if (!C) return;
    const now = new Date(), sc = C.schedule(), hr = now.getHours();
    $('#homeHello').textContent = (hr >= 18 || hr < 5 ? 'Bonsoir' : 'Bonjour') + (sc.name ? ` ${sc.name}` : '');
    $('#homeDate').textContent = now.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
    $('#homeClock').textContent = `${pad(now.getHours())}:${pad(now.getMinutes())}`;
    renderToday(C, sc); renderMonth(C, now); renderWeek(C, sc);
  }

  $('#homePlus').addEventListener('click', ev => { ev.stopPropagation(); window.SkamCalc && window.SkamCalc.add(1); render(); });
  $('#homeChrono').addEventListener('click', ev => { ev.stopPropagation(); window.SkamCalc && window.SkamCalc.toggle(); render(); });
  // Appui long sur +1 : corriger les chiffres du jour.
  let press = null;
  $('#homePlus').addEventListener('pointerdown', () => { press = setTimeout(() => { press = 'long'; window.SkamCalc && window.SkamCalc.edit(render); }, 600); });
  ['pointerup', 'pointerleave', 'pointercancel'].forEach(e => $('#homePlus').addEventListener(e, () => { if (press !== 'long') clearTimeout(press); }));
  $('#homePlus').addEventListener('click', ev => { if (press === 'long') { ev.stopImmediatePropagation(); press = null; } }, true);
  const open = (el, fn) => { el.addEventListener('click', fn); el.addEventListener('keydown', e => { if (e.target === el && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); fn(); } }); };
  open($('#homeToday'), () => App.go('calcul'));
  open($('#homeMonth'), () => App.go('calcul', { view: 'month' }));
  open($('#homeHelloBtn'), () => window.SkamCalc && window.SkamCalc.openPlanning(render));
  document.querySelectorAll('[data-wk]').forEach(b => b.addEventListener('click', () => { wkMode = b.dataset.wk; BVStore.writeLocal('bv.homeWeek', wkMode); selected = -1; render(); }));
  App.on('home', () => {
    selected = -1; render();
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
    { title: 'Un contrôle non concluant', description: "Un contrôle visuel autorisé ne permet pas de confirmer un élément attendu. L'image est de qualité moyenne.", answers: ['Classer le document comme faux.', 'Demander ou effectuer une vérification complémentaire selon la procédure.', "Se fier à l'apparence générale."], correct: 1, feedback: "Un contrôle non concluant n'est pas une preuve de fraude : on suit le circuit de vérification complémentaire." },
    { title: 'Une pièce photographiée sur un écran', description: "La carte d'identité transmise semble être une photo prise sur un écran : bords d'écran visibles, motif de moiré sur l'image.", answers: ["La valider : toutes les informations sont lisibles.", "Ne pas la valider en l'état et appliquer la procédure prévue (nouvelle capture de l'original ou escalade).", 'Accuser le client de fraude dans le motif.'], correct: 1, feedback: "Une reproduction (écran, photocopie) n'est pas l'original : on ne peut pas la contrôler correctement. On redemande ou on escalade selon la procédure, avec un motif factuel, sans accusation." },
    { title: 'Une CNI expirée', description: "Une carte d'identité française délivrée à un majeur en 2012 affiche une date d'expiration dépassée.", answers: ['La refuser immédiatement : la date est dépassée.', "Vérifier les règles de prolongation applicables à cette carte, puis appliquer ce que la procédure accepte.", "L'accepter sans vérifier : les cartes françaises sont toujours valables."], correct: 1, feedback: "Les CNI sécurisées délivrées à des majeurs entre 2004 et 2013 sont valables 15 ans malgré la date imprimée. Mais chaque procédure fixe ce qu'elle accepte : on vérifie la règle avant de conclure." },
    { title: 'MRZ et zone visuelle', description: 'La date de naissance lue dans la bande MRZ ne correspond pas à celle imprimée dans la zone visuelle.', answers: ['Corriger soi-même la saisie avec la date la plus probable.', 'Ignorer : la MRZ est souvent mal lue.', "Traiter l'incohérence comme un signal fort : vérifier la lecture, puis escalader selon la procédure."], correct: 2, feedback: "MRZ et zone visuelle doivent concorder. Après avoir écarté une erreur de lecture, une discordance réelle se traite par le circuit d'escalade, jamais par une correction de l'opérateur." },
    { title: 'Un justificatif ancien', description: 'Le justificatif de domicile date de 7 mois. La règle du parcours demande un document de moins de 3 mois.', answers: ['Le valider : l’adresse est sûrement la même.', 'Demander un justificatif conforme à la règle de date, selon la procédure.', 'Modifier la date dans la saisie.'], correct: 1, feedback: "La règle de date fait partie des critères de recevabilité. On ne l'assouplit pas soi-même : on redemande une pièce conforme." },
    { title: "Un nom d'usage", description: 'Le nom sur la pièce d’identité diffère de celui du justificatif de domicile. Le prénom, la date de naissance et l’adresse concordent.', answers: ['Conclure à une usurpation d’identité.', "Chercher une explication documentée (nom d'usage, mention sur la pièce) et appliquer ce que la procédure prévoit.", 'Valider sans rien noter.'], correct: 1, feedback: "Un nom d'usage (mariage, par exemple) explique souvent l'écart. On cherche l'élément qui le justifie et on trace sa décision." },
    { title: 'Selfie difficile à comparer', description: 'Le selfie est sombre et légèrement flou : la comparaison avec la photo de la pièce ne permet pas de conclure.', answers: ['Valider : la personne a l’air de correspondre.', 'Refuser : ce n’est pas la même personne.', 'Ne pas trancher sur une capture insuffisante : nouvelle capture ou escalade selon la procédure.'], correct: 2, feedback: "Une capture de mauvaise qualité ne permet ni de valider ni de refuser. On obtient une capture exploitable ou on passe la main." },
    { title: 'Un dossier pressé', description: "Une note du dossier indique que le client est « très pressé » et demande une validation rapide.", answers: ['Accélérer en sautant une étape de contrôle.', 'Appliquer la procédure complète, comme pour tout dossier.', 'Valider pour satisfaire le client et contrôler plus tard.'], correct: 1, feedback: "L'urgence n'est pas un critère de validation. Une pression inhabituelle est même un signal à garder en tête." },
    { title: "S'entraîner avec de vrais dossiers ?", description: "Un collègue propose d'enregistrer dans S'kam des captures de vrais dossiers pour s'entraîner.", answers: ['Bonne idée, en floutant un peu les noms.', "Refuser : aucune donnée client réelle hors des outils autorisés. Spécimens et cas fictifs uniquement.", 'D’accord si ça reste sur le téléphone.'], correct: 1, feedback: "Les données des clients restent dans les outils de l'entreprise. S'kam ne contient que des spécimens publics et des cas fictifs ou anonymisés." }
  ];
  // Mélange l'ordre des réponses à chaque affichage (la bonne n'est pas toujours au même endroit).
  const shuffle = c => { const idx = c.answers.map((_, k) => k); for (let k = idx.length - 1; k > 0; k--) { const j = Math.floor(Math.random() * (k + 1)); [idx[k], idx[j]] = [idx[j], idx[k]]; } return { ...c, answers: idx.map(k => c.answers[k]), correct: idx.indexOf(c.correct) }; };
  let i = 0, score = 0, done = false, cur = null;
  const label = () => `${score} bonne${score > 1 ? 's' : ''} réponse${score > 1 ? 's' : ''}`;
  function render() {
    const c = cur = shuffle(cases[i]);
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
    const c = cur;
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
