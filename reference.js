(() => {
  const S = window.BVStore, esc = S.esc;
  const TYPES = ["Carte d'identité", 'Passeport', 'Titre de séjour', 'Justificatif de domicile', 'Justificatif de revenus', 'Autre'];
  const STATUS = ['En cours', 'Conforme', 'Escaladé', 'Refusé'];
  const body = document.getElementById('refBody');
  const urls = [];
  const freeUrls = () => urls.splice(0).forEach(u => URL.revokeObjectURL(u));
  const objUrl = blob => { const u = URL.createObjectURL(blob); urls.push(u); return u; };
  const norm = s => String(s || '').toLocaleLowerCase('fr').normalize('NFD').replace(/[̀-ͯ]/g, '');
  const WARNING = '<p class="warnline">Aucune donnée client : pas de nom, de numéro ni de copie d\'une vraie pièce. Spécimens ou captures anonymisées uniquement.</p>';
  const backHome = () => App.go('home');

  // Liste : recherche fixe, la liste défile.
  async function renderList() {
    freeUrls();
    App.header({ title: 'Cas complexes', back: backHome, action: { label: '+', aria: 'Nouveau cas', fn: () => openForm() } });
    let cases = [];
    try { cases = (await S.all('cases')).sort((a, b) => b.updated - a.updated); } catch { body.innerHTML = '<div class="pad"><p class="empty">Le stockage local n\'est pas disponible sur ce navigateur.</p></div>'; return; }
    body.innerHTML = `<div class="pad stack fill">
      <label class="search"><span>⌕</span><input id="refSearch" type="search" placeholder="Titre, pays, type, mot-clé…" autocomplete="off" /></label>
      <div class="list scroll" id="refList"></div>
      <div class="actions"><button class="btn" id="refBackup">Sauvegarde</button><button class="btn btn-primary" id="refNew">+ Nouveau cas</button></div>
    </div>`;
    const input = body.querySelector('#refSearch');
    const draw = () => {
      const q = norm(input.value.trim());
      const rows = cases.filter(c => norm([c.title, c.country, c.type, c.status, c.description, c.issue, c.decision, c.notes].join(' ')).includes(q));
      const list = body.querySelector('#refList');
      list.innerHTML = rows.length ? rows.map(c => `<button class="item" data-case="${c.id}"><span class="item-ic mono">${esc((c.country || '—').slice(0, 3).toUpperCase())}</span><span class="item-txt"><strong>${esc(c.title || 'Sans titre')}</strong><small>${esc(c.type)} · ${esc(c.status)} · ${(c.files || []).length} pièce${(c.files || []).length > 1 ? 's' : ''}</small></span><span class="item-go">›</span></button>`).join('')
        : `<p class="empty">${cases.length ? 'Aucun cas ne correspond.' : 'Aucun cas enregistré. Touche « + » pour ajouter ton premier cas complexe.'}</p>`;
      list.querySelectorAll('[data-case]').forEach(b => b.addEventListener('click', () => renderCase(b.dataset.case)));
    };
    input.addEventListener('input', draw); draw();
    body.querySelector('#refNew').addEventListener('click', () => openForm());
    body.querySelector('#refBackup').addEventListener('click', openBackup);
  }

  // Fiche : le contenu défile, les actions restent en bas.
  async function renderCase(id) {
    freeUrls();
    const c = await S.get('cases', id);
    if (!c) return renderList();
    App.header({ title: c.title || 'Cas', back: renderList, action: { label: '✎', aria: 'Modifier le cas', fn: () => openForm(c) } });
    const field = (label, v) => v ? `<div class="field-view"><span class="label">${label}</span><p>${esc(v).replace(/\n/g, '<br>')}</p></div>` : '';
    const files = (await Promise.all((c.files || []).map(fid => S.get('files', fid)))).filter(Boolean);
    body.innerHTML = `<div class="pad stack fill">
      <div class="row"><span class="chip">${esc(c.type)}</span><span class="chip ${c.status === 'Conforme' ? 'chip-ok' : c.status === 'En cours' ? '' : 'chip-warn'}">${esc(c.status)}</span>${c.country ? `<span class="muted small">${esc(c.country)}</span>` : ''}</div>
      <div class="scroll stack">
        ${field('Description', c.description)}${field('Ce qui pose problème', c.issue)}${field('Décision / issue', c.decision)}${field('Notes', c.notes)}
        ${files.length ? `<div class="thumbs">${files.map(f => { const u = objUrl(f.blob); return f.type.startsWith('image/') ? `<a href="${u}" target="_blank" rel="noopener"><img src="${u}" alt="${esc(f.name)}" /></a>` : `<a class="file" href="${u}" target="_blank" rel="noopener">📄 ${esc(f.name)}</a>`; }).join('')}</div>` : ''}
        <p class="foot">Créé le ${new Date(c.created).toLocaleDateString('fr-FR')} · modifié le ${new Date(c.updated).toLocaleDateString('fr-FR')}</p>
      </div>
      <div class="actions"><button class="btn btn-danger" id="refDelete">Supprimer</button><button class="btn btn-primary" id="refEdit">Modifier</button></div>
    </div>`;
    body.querySelector('#refEdit').addEventListener('click', () => openForm(c));
    body.querySelector('#refDelete').addEventListener('click', async () => {
      if (!confirm('Supprimer définitivement ce cas et ses pièces jointes ?')) return;
      await Promise.all((c.files || []).map(f => S.del('files', f)));
      await S.del('cases', c.id); renderList();
    });
  }

  // Formulaire dans un panneau du bas.
  function openForm(c) {
    const isNew = !c;
    c = c || { id: S.uid(), title: '', country: '', type: TYPES[0], status: STATUS[0], description: '', issue: '', decision: '', notes: '', files: [], created: Date.now() };
    let fileIds = [...(c.files || [])];
    const added = [];
    const opt = (list, v) => list.map(x => `<option${x === v ? ' selected' : ''}>${esc(x)}</option>`).join('');
    const el = App.sheet(isNew ? 'Nouveau cas' : 'Modifier le cas', `${WARNING}
      <form class="form" id="refForm">
        <label class="field"><span>Titre</span><input name="title" required maxlength="120" value="${esc(c.title)}" placeholder="ex. Date de délivrance incohérente" /></label>
        <div class="field-row">
          <label class="field"><span>Pays</span><input name="country" maxlength="60" value="${esc(c.country)}" placeholder="ex. France" /></label>
          <label class="field"><span>Statut</span><select name="status">${opt(STATUS, c.status)}</select></label>
        </div>
        <label class="field"><span>Type de document</span><select name="type">${opt(TYPES, c.type)}</select></label>
        <label class="field"><span>Description du cas</span><textarea name="description" rows="3">${esc(c.description)}</textarea></label>
        <label class="field"><span>Ce qui pose problème</span><textarea name="issue" rows="2">${esc(c.issue)}</textarea></label>
        <label class="field"><span>Décision / issue</span><textarea name="decision" rows="2">${esc(c.decision)}</textarea></label>
        <label class="field"><span>Notes</span><textarea name="notes" rows="2">${esc(c.notes)}</textarea></label>
        <div class="field"><span>Pièces jointes (images ou PDF)</span><div class="chips" id="refFiles"></div>
          <label class="btn">+ Ajouter des fichiers<input id="refAdd" type="file" accept="image/*,application/pdf" multiple hidden /></label></div>
        <button class="btn btn-primary" type="submit">Enregistrer</button>
      </form>`);
    const drawFiles = async () => {
      const files = (await Promise.all(fileIds.map(id => S.get('files', id)))).filter(Boolean);
      el.querySelector('#refFiles').innerHTML = files.map(f => `<span class="chip">${esc(f.name)} <button type="button" class="link" data-rm="${f.id}" aria-label="Retirer ${esc(f.name)}">✕</button></span>`).join('');
      el.querySelectorAll('[data-rm]').forEach(b => b.addEventListener('click', () => { fileIds = fileIds.filter(x => x !== b.dataset.rm); drawFiles(); }));
    };
    el.querySelector('#refAdd').addEventListener('change', async ev => {
      for (const f of ev.target.files) {
        const blob = await S.compressImage(f);
        const rec = { id: S.uid(), name: f.name, type: blob.type || f.type, blob };
        await S.put('files', rec); fileIds.push(rec.id); added.push(rec.id);
      }
      ev.target.value = ''; drawFiles();
    });
    // Si on ferme sans enregistrer, on retire les fichiers ajoutés entre-temps.
    let saved = false;
    const cleanup = () => { if (!saved) added.forEach(id => S.del('files', id)); };
    document.querySelectorAll('#sheet [data-close]').forEach(x => x.addEventListener('click', cleanup, { once: true }));
    el.querySelector('#refForm').addEventListener('submit', async ev => {
      ev.preventDefault();
      const fd = new FormData(ev.target);
      const removed = (c.files || []).filter(id => !fileIds.includes(id));
      const rec = Object.assign({}, c, Object.fromEntries(['title', 'country', 'type', 'status', 'description', 'issue', 'decision', 'notes'].map(k => [k, String(fd.get(k) || '').trim()])), { files: fileIds, updated: Date.now() });
      await S.put('cases', rec);
      await Promise.all(removed.map(id => S.del('files', id)));
      saved = true; App.closeSheet(); renderCase(rec.id);
    });
    drawFiles();
  }

  // Sauvegarde : cas, pièces jointes et spécimens ajoutés.
  const toB64 = blob => new Promise((res, rej) => { const fr = new FileReader(); fr.onload = () => res(String(fr.result)); fr.onerror = rej; fr.readAsDataURL(blob); });
  const fromB64 = async url => (await fetch(url)).blob();
  function openBackup() {
    const el = App.sheet('Sauvegarde', `<p class="foot">Les cas complexes, leurs pièces jointes et tes images de spécimens sont enregistrés uniquement sur ce téléphone. Exporte-les de temps en temps et garde le fichier en lieu sûr.</p>
      <div class="actions"><button class="btn btn-primary" id="refExport">Exporter</button><label class="btn">Importer<input id="refImport" type="file" accept="application/json,.json" hidden /></label></div>`);
    el.querySelector('#refExport').addEventListener('click', exportAll);
    el.querySelector('#refImport').addEventListener('change', importAll);
  }
  async function exportAll() {
    try {
      const [cases, files, specimens] = await Promise.all([S.all('cases'), S.all('files'), S.all('specimens')]);
      const pack = list => Promise.all(list.map(async x => Object.assign({}, x, { blob: await toB64(x.blob) })));
      const data = { app: 'skam', version: 1, exported: new Date().toISOString(), cases, files: await pack(files), specimens: await pack(specimens) };
      const a = document.createElement('a');
      a.href = URL.createObjectURL(new Blob([JSON.stringify(data)], { type: 'application/json' }));
      a.download = `skam-cas-specimens-${new Date().toISOString().slice(0, 10)}.json`; a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 5000);
    } catch { alert("L'export a échoué."); }
  }
  async function importAll(ev) {
    const f = ev.target.files[0]; ev.target.value = ''; if (!f) return;
    try {
      const d = JSON.parse(await f.text());
      if (d.app !== 'skam' || !Array.isArray(d.cases)) throw new Error();
      if (!confirm(`Importer ${d.cases.length} cas et ${(d.specimens || []).length} images de spécimens ? Les éléments existants avec le même identifiant seront remplacés.`)) return;
      for (const x of d.files || []) await S.put('files', Object.assign({}, x, { blob: await fromB64(x.blob) }));
      for (const x of d.specimens || []) await S.put('specimens', Object.assign({}, x, { blob: await fromB64(x.blob) }));
      for (const x of d.cases) await S.put('cases', x);
      App.closeSheet(); renderList();
    } catch { alert("Ce fichier n'est pas une sauvegarde S'kam valide."); }
  }

  App.on('reference', renderList);
})();
