(() => {
  const S = window.BVStore, esc = S.esc;
  const TYPES = ["Carte d'identité", 'Passeport', 'Titre de séjour', 'Justificatif de domicile', 'Justificatif de revenus', 'Autre'];
  const STATUS = ['En cours', 'Conforme', 'Escaladé', 'Refusé'];
  const body = document.getElementById('refBody');
  const urls = [];
  const freeUrls = () => { urls.splice(0).forEach(u => URL.revokeObjectURL(u)); };
  const objUrl = blob => { const u = URL.createObjectURL(blob); urls.push(u); return u; };
  const WARNING = `<div class="notice"><strong>Aucune donnée client</strong><p>Pas de nom, de numéro de document, de photo ou de copie d'une vraie pièce. Uniquement des spécimens, des schémas ou des captures anonymisées. Tout reste sur ce téléphone.</p></div>`;

  async function renderList(query = '') {
    freeUrls();
    let cases = [];
    try { cases = (await S.all('cases')).sort((a, b) => b.updated - a.updated); } catch { body.innerHTML = '<div class="empty-state">Le stockage local n\'est pas disponible sur ce navigateur.</div>'; return; }
    body.innerHTML = `<button class="primary-btn ref-new" id="refNew">+ Nouveau cas complexe</button>
      <label class="searchbox"><span>⌕</span><input id="refSearch" type="search" placeholder="Titre, pays, type, mot-clé…" autocomplete="off" value="${esc(query)}" /></label>
      <div class="document-list proc-list" id="refList"></div>${WARNING}`;
    const draw = () => {
      const q = document.getElementById('refSearch').value.trim().toLocaleLowerCase('fr');
      const rows = cases.filter(c => [c.title, c.country, c.type, c.status, c.description, c.issue, c.decision].join(' ').toLocaleLowerCase('fr').includes(q));
      document.getElementById('refList').innerHTML = rows.length ? rows.map(c => `<button class="doc-card" data-case="${c.id}"><span class="flag">${esc((c.country || '—').slice(0, 3).toUpperCase())}</span><span class="doc-info"><strong>${esc(c.title || 'Sans titre')}</strong><small>${esc(c.type)} · ${esc(c.status)} · ${(c.files || []).length} pièce${(c.files || []).length > 1 ? 's' : ''} · ${new Date(c.updated).toLocaleDateString('fr-FR')}</small></span><span class="doc-arrow">↗</span></button>`).join('')
        : `<div class="empty-state">${cases.length ? 'Aucun cas ne correspond.' : 'Aucun cas enregistré. Ajoute ton premier cas complexe.'}</div>`;
      body.querySelectorAll('[data-case]').forEach(b => b.addEventListener('click', () => renderCase(b.dataset.case)));
    };
    document.getElementById('refSearch').addEventListener('input', draw);
    document.getElementById('refNew').addEventListener('click', () => renderForm());
    draw();
  }

  async function filesHtml(ids) {
    const files = (await Promise.all((ids || []).map(id => S.get('files', id)))).filter(Boolean);
    return files.map(f => f.type.startsWith('image/')
      ? `<a class="ref-thumb" href="${objUrl(f.blob)}" target="_blank" rel="noopener"><img src="${urls[urls.length - 1]}" alt="${esc(f.name)}" loading="lazy" /></a>`
      : `<a class="ref-file" href="${objUrl(f.blob)}" target="_blank" rel="noopener">📄 ${esc(f.name)}</a>`).join('');
  }

  async function renderCase(id) {
    freeUrls();
    const c = await S.get('cases', id);
    if (!c) return renderList();
    const field = (label, v) => v ? `<div class="ref-field"><small>${label}</small><p>${esc(v).replace(/\n/g, '<br>')}</p></div>` : '';
    body.innerHTML = `<button class="secondary-btn proc-back" id="refBack">← Tous les cas</button>
      <div class="section-head"><div><div class="eyebrow">${esc(c.type)}${c.country ? ' · ' + esc(c.country) : ''}</div><h2>${esc(c.title || 'Sans titre')}</h2></div><span class="tiny-tag">${esc(c.status)}</span></div>
      <div class="training-card">${field('Description du cas', c.description)}${field('Ce qui pose problème', c.issue)}${field('Décision / issue', c.decision)}${field('Notes', c.notes)}
        <div class="ref-files">${await filesHtml(c.files)}</div>
        <p class="micro-note">Créé le ${new Date(c.created).toLocaleDateString('fr-FR')} · modifié le ${new Date(c.updated).toLocaleDateString('fr-FR')}</p></div>
      <div class="calc-actions"><button class="secondary-btn" id="refEdit">Modifier</button><button class="secondary-btn ref-danger" id="refDelete">Supprimer</button></div>`;
    document.getElementById('refBack').addEventListener('click', () => renderList());
    document.getElementById('refEdit').addEventListener('click', () => renderForm(c));
    document.getElementById('refDelete').addEventListener('click', async () => {
      if (!confirm('Supprimer définitivement ce cas et ses pièces jointes ?')) return;
      await Promise.all((c.files || []).map(f => S.del('files', f)));
      await S.del('cases', c.id); renderList();
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function renderForm(c) {
    freeUrls();
    const isNew = !c;
    c = c || { id: S.uid(), title: '', country: '', type: TYPES[0], status: STATUS[0], description: '', issue: '', decision: '', notes: '', files: [], created: Date.now() };
    let fileIds = [...(c.files || [])];
    const opt = (list, v) => list.map(x => `<option${x === v ? ' selected' : ''}>${esc(x)}</option>`).join('');
    body.innerHTML = `<button class="secondary-btn proc-back" id="refCancel">← Annuler</button>
      <div class="section-head"><div><div class="eyebrow">CAS COMPLEXE</div><h2>${isNew ? 'Nouveau cas' : 'Modifier le cas'}</h2></div></div>
      ${WARNING}
      <form id="refForm" class="ref-form">
        <label class="calc-field"><span>Titre</span><input name="title" required maxlength="120" value="${esc(c.title)}" placeholder="ex. Date de délivrance incohérente" /></label>
        <label class="calc-field"><span>Pays</span><input name="country" maxlength="60" value="${esc(c.country)}" placeholder="ex. France" /></label>
        <label class="calc-field"><span>Type de document</span><select name="type">${opt(TYPES, c.type)}</select></label>
        <label class="calc-field"><span>Statut</span><select name="status">${opt(STATUS, c.status)}</select></label>
        <label class="calc-field"><span>Description du cas</span><textarea name="description" rows="4">${esc(c.description)}</textarea></label>
        <label class="calc-field"><span>Ce qui pose problème</span><textarea name="issue" rows="3">${esc(c.issue)}</textarea></label>
        <label class="calc-field"><span>Décision / issue</span><textarea name="decision" rows="3">${esc(c.decision)}</textarea></label>
        <label class="calc-field"><span>Notes</span><textarea name="notes" rows="3">${esc(c.notes)}</textarea></label>
        <div class="calc-field"><span>Pièces jointes (images ou PDF)</span>
          <div class="ref-files" id="refFiles"></div>
          <label class="secondary-btn">+ Ajouter des fichiers<input id="refAdd" type="file" accept="image/*,application/pdf" multiple hidden /></label>
        </div>
        <button class="primary-btn" type="submit">Enregistrer le cas</button>
      </form>`;
    const drawFiles = async () => {
      const files = (await Promise.all(fileIds.map(id => S.get('files', id)))).filter(Boolean);
      document.getElementById('refFiles').innerHTML = files.map(f => `<span class="ref-chip">${esc(f.name)} <button type="button" data-rm="${f.id}" aria-label="Retirer">×</button></span>`).join('');
      body.querySelectorAll('[data-rm]').forEach(b => b.addEventListener('click', () => { fileIds = fileIds.filter(x => x !== b.dataset.rm); drawFiles(); }));
    };
    const added = [];
    document.getElementById('refAdd').addEventListener('change', async ev => {
      for (const f of ev.target.files) {
        const blob = await S.compressImage(f);
        const rec = { id: S.uid(), name: f.name, type: blob.type || f.type, blob };
        await S.put('files', rec); fileIds.push(rec.id); added.push(rec.id);
      }
      ev.target.value = ''; drawFiles();
    });
    document.getElementById('refCancel').addEventListener('click', async () => {
      await Promise.all(added.map(id => S.del('files', id)));
      isNew ? renderList() : renderCase(c.id);
    });
    document.getElementById('refForm').addEventListener('submit', async ev => {
      ev.preventDefault();
      const fd = new FormData(ev.target);
      const removed = (c.files || []).filter(id => !fileIds.includes(id));
      const rec = Object.assign({}, c, Object.fromEntries(['title', 'country', 'type', 'status', 'description', 'issue', 'decision', 'notes'].map(k => [k, String(fd.get(k) || '').trim()])), { files: fileIds, updated: Date.now() });
      await S.put('cases', rec);
      await Promise.all(removed.map(id => S.del('files', id)));
      renderCase(rec.id);
    });
    drawFiles();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  document.querySelectorAll('[data-go="reference"]').forEach(b => b.addEventListener('click', () => renderList()));
  renderList();
})();
