(() => {
  const PRADO_SEARCH = 'https://www.consilium.europa.eu/prado/fr/search-by-document-country.html';
  const prado = code => `https://www.consilium.europa.eu/prado/fr/prado-documents/${code}/index.html`;
  // Espace Schengen (29 États) et Union européenne (27 États) : composition à revérifier régulièrement.
  const SCHENGEN = 'DEU AUT BEL BGR HRV DNK ESP EST FIN FRA GRC HUN ISL ITA LVA LIE LTU LUX MLT NOR NLD POL PRT ROU SVK SVN SWE CHE CZE'.split(' ');
  const UE = 'DEU AUT BEL BGR CYP HRV DNK ESP EST FIN FRA GRC HUN IRL ITA LVA LTU LUX MLT NLD POL PRT ROU SVK SVN SWE CZE'.split(' ');
  const parse = s => s.split(';').map(x => { const [name, code] = x.split(':'); return { name, code }; });
  const zones = {
    europe: { label: 'Europe', icon: 'EU', cls: 'cyan', list: parse('Albanie:ALB;Allemagne:DEU;Andorre:AND;Autriche:AUT;Belgique:BEL;Biélorussie:BLR;Bosnie-Herzégovine:BIH;Bulgarie:BGR;Chypre:CYP;Croatie:HRV;Danemark:DNK;Espagne:ESP;Estonie:EST;Finlande:FIN;France:FRA;Grèce:GRC;Hongrie:HUN;Irlande:IRL;Islande:ISL;Italie:ITA;Kosovo:RKS;Lettonie:LVA;Liechtenstein:LIE;Lituanie:LTU;Luxembourg:LUX;Macédoine du Nord:MKD;Malte:MLT;Moldavie:MDA;Monaco:MCO;Monténégro:MNE;Norvège:NOR;Pays-Bas:NLD;Pologne:POL;Portugal:PRT;Roumanie:ROU;Royaume-Uni:GBR;Russie:RUS;Saint-Marin:SMR;Serbie:SRB;Slovaquie:SVK;Slovénie:SVN;Suède:SWE;Suisse:CHE;Tchéquie:CZE;Turquie:TUR;Ukraine:UKR;Vatican:VAT') },
    afrique: { label: 'Afrique', icon: 'AF', cls: 'amber', list: parse("Afrique du Sud:ZAF;Algérie:DZA;Angola:AGO;Bénin:BEN;Botswana:BWA;Burkina Faso:BFA;Burundi:BDI;Cabo Verde:CPV;Cameroun:CMR;Centrafrique:CAF;Comores:COM;Congo:COG;Congo (RD):COD;Côte d'Ivoire:CIV;Djibouti:DJI;Égypte:EGY;Érythrée:ERI;Eswatini:SWZ;Éthiopie:ETH;Gabon:GAB;Gambie:GMB;Ghana:GHA;Guinée:GIN;Guinée-Bissau:GNB;Guinée équatoriale:GNQ;Kenya:KEN;Lesotho:LSO;Liberia:LBR;Libye:LBY;Madagascar:MDG;Malawi:MWI;Mali:MLI;Maroc:MAR;Maurice:MUS;Mauritanie:MRT;Mozambique:MOZ;Namibie:NAM;Niger:NER;Nigeria:NGA;Ouganda:UGA;Rwanda:RWA;São Tomé-et-Príncipe:STP;Sénégal:SEN;Seychelles:SYC;Sierra Leone:SLE;Somalie:SOM;Soudan:SDN;Soudan du Sud:SSD;Tanzanie:TZA;Tchad:TCD;Togo:TGO;Tunisie:TUN;Zambie:ZMB;Zimbabwe:ZWE") },
    ameriques: { label: 'Amériques', icon: 'AM', cls: 'green', list: parse('Antigua-et-Barbuda:ATG;Argentine:ARG;Bahamas:BHS;Barbade:BRB;Belize:BLZ;Bolivie:BOL;Brésil:BRA;Canada:CAN;Chili:CHL;Colombie:COL;Costa Rica:CRI;Cuba:CUB;Dominique:DMA;Équateur:ECU;États-Unis:USA;Grenade:GRD;Guatemala:GTM;Guyana:GUY;Haïti:HTI;Honduras:HND;Jamaïque:JAM;Mexique:MEX;Nicaragua:NIC;Panama:PAN;Paraguay:PRY;Pérou:PER;République dominicaine:DOM;Saint-Christophe-et-Niévès:KNA;Sainte-Lucie:LCA;Saint-Vincent-et-les-Grenadines:VCT;Salvador:SLV;Suriname:SUR;Trinité-et-Tobago:TTO;Uruguay:URY;Venezuela:VEN') },
    asie: { label: 'Asie & Moyen-Orient', icon: 'AS', cls: 'violet', list: parse('Afghanistan:AFG;Arabie saoudite:SAU;Arménie:ARM;Azerbaïdjan:AZE;Bahreïn:BHR;Bangladesh:BGD;Bhoutan:BTN;Birmanie:MMR;Brunei:BRN;Cambodge:KHM;Chine:CHN;Corée du Nord:PRK;Corée du Sud:KOR;Émirats arabes unis:ARE;Géorgie:GEO;Hong Kong (Chine):HKG;Inde:IND;Indonésie:IDN;Irak:IRQ;Iran:IRN;Israël:ISR;Japon:JPN;Jordanie:JOR;Kazakhstan:KAZ;Kirghizistan:KGZ;Koweït:KWT;Laos:LAO;Liban:LBN;Macao (Chine):MAC;Malaisie:MYS;Maldives:MDV;Mongolie:MNG;Népal:NPL;Oman:OMN;Ouzbékistan:UZB;Pakistan:PAK;Palestine:PSE;Philippines:PHL;Qatar:QAT;Singapour:SGP;Sri Lanka:LKA;Syrie:SYR;Tadjikistan:TJK;Taïwan:TWN;Thaïlande:THA;Timor oriental:TLS;Turkménistan:TKM;Viêt Nam:VNM;Yémen:YEM') },
    oceanie: { label: 'Océanie', icon: 'OC', cls: 'cyan', list: parse('Australie:AUS;Fidji:FJI;Kiribati:KIR;Îles Marshall:MHL;Micronésie:FSM;Nauru:NRU;Nouvelle-Zélande:NZL;Palaos:PLW;Papouasie-Nouvelle-Guinée:PNG;Îles Salomon:SLB;Samoa:WSM;Tonga:TON;Tuvalu:TUV;Vanuatu:VUT') }
  };
  const allCountries = Object.values(zones).flatMap(z => z.list);
  zones.schengen = { label: 'Espace Schengen', icon: 'SC', cls: 'green', list: allCountries.filter(c => SCHENGEN.includes(c.code)) };
  const order = ['schengen', 'europe', 'afrique', 'ameriques', 'asie', 'oceanie'];

  // Documents suivis : passeport (2e et 3e de couverture), CNI / eCNI, titre de séjour pour la France uniquement.
  function documentsFor(c) {
    const docs = [{ type: 'passport', name: 'Passeport', detail: '2e et 3e de couverture (pages de données)', labels: ['2e de couverture', '3e de couverture'] }];
    if (c.code === 'DNK') docs.push({ type: 'none', name: "Pas de carte nationale d'identité", detail: "Le Danemark ne délivre pas de carte d'identité nationale : vérifier les autres titres dans PRADO" });
    else if (c.code === 'IRL') docs.push({ type: 'id', name: 'Carte passeport', detail: "Passport card, utilisée comme document d'identité", labels: ['Recto', 'Verso'] });
    else docs.push({ type: 'id', name: "Carte d'identité (CNI / eCNI)", detail: 'Toutes les versions en circulation', labels: ['CNI recto', 'CNI verso', 'eCNI recto', 'eCNI verso'] });
    if (c.code === 'FRA') docs.push({ type: 'residence', name: 'Titre de séjour', detail: 'Titres de séjour français', labels: ['Recto', 'Verso'] });
    return docs;
  }

  const S = window.BVStore, esc = S.esc;
  const SPEC = window.SPECIMENS || {};
  const body = document.getElementById('procBody');
  const tags = c => [SCHENGEN.includes(c.code) && 'Schengen', UE.includes(c.code) && 'UE'].filter(Boolean).join(' · ');
  const urls = [];
  const freeUrls = () => urls.splice(0).forEach(u => URL.revokeObjectURL(u));
  const norm = s => s.toLocaleLowerCase('fr').normalize('NFD').replace(/[̀-ͯ]/g, '');
  // Pastilles : PASS / ID allumées quand un spécimen existe (Commons ou image ajoutée sur le téléphone).
  let own = new Set();
  const refreshOwn = async () => { try { own = new Set((await S.all('specimens')).map(r => r.id.split(':').slice(0, 2).join(':'))); } catch { own = new Set(); } };
  const has = (code, type) => !!(SPEC[code] && SPEC[code][type] && SPEC[code][type].length) || own.has(`${code}:${type}`);
  const hasAny = code => has(code, 'passport') || has(code, 'id') || has(code, 'residence');
  const pills = c => `<span class="pills" aria-label="${has(c.code, 'passport') ? 'spécimen passeport' : 'pas de spécimen passeport'}, ${has(c.code, 'id') ? 'spécimen carte d’identité' : 'pas de spécimen carte d’identité'}"><span class="pill ${has(c.code, 'passport') ? 'on' : ''}">PASS</span><span class="pill ${has(c.code, 'id') ? 'on' : ''}">ID</span></span>`;
  const countryRow = c => `<button class="item" data-country="${c.code}"><span class="item-ic mono">${c.code}</span><span class="item-txt"><strong>${esc(c.name)}</strong><small>${tags(c) || 'Hors UE'}</small></span>${pills(c)}<span class="item-go">›</span></button>`;
  let onlySpec = false;
  const filterBar = () => `<div class="legend"><button class="filter-chip ${onlySpec ? 'on' : ''}" id="onlySpec" aria-pressed="${onlySpec}">${onlySpec ? '✓ ' : ''}Avec spécimen</button><span>en violet = spécimen dispo</span></div>`;
  const bindCountries = (el, from) => el.querySelectorAll('[data-country]').forEach(b => b.addEventListener('click', () => renderCountry(b.dataset.country, from)));

  // Visionneuse : la vignette 800 px s'affiche tout de suite, la version 1280 px la remplace si elle charge.
  function bindViewer(root) {
    root.querySelectorAll('.spec-img').forEach(b => b.addEventListener('click', () => {
      App.view(b.dataset.src, b.dataset.cap, b.dataset.source);
      const full = b.dataset.srcFull;
      if (full && full !== b.dataset.src) { const im = new Image(); im.onload = () => { const v = document.querySelector('#viewerImg img'); if (v && v.src === b.dataset.src) v.src = full; }; im.src = full; }
    }));
  }
  // Pays consultés récemment (sur ce téléphone).
  const RECENT = 'bv.recent';
  const recents = () => S.readLocal(RECENT, []).filter(code => allCountries.some(c => c.code === code));
  const pushRecent = code => S.writeLocal(RECENT, [code, ...recents().filter(x => x !== code)].slice(0, 6));

  // Écran 1 : recherche + zones (tient sur un écran)
  function renderHome(focus) {
    freeUrls();
    App.header({ title: 'Procédure' });
    body.innerHTML = `<div class="pad stack fill">
      <label class="search"><span>⌕</span><input id="procSearch" type="search" placeholder="Rechercher un pays ou un code…" autocomplete="off" /></label>
      ${recents().length ? `<div class="recents" id="procRecents"><span class="label">RÉCENTS</span><div class="recent-row">${recents().map(code => { const c = allCountries.find(x => x.code === code); return `<button class="recent" data-country="${code}" title="${esc(c.name)}"><span class="mono">${code}</span><small>${esc(c.name)}</small></button>`; }).join('')}</div></div>` : ''}
      <div class="zones" id="procZones">${order.map(k => `<button class="zone" data-zone="${k}"><span class="mono accent">${zones[k].icon}</span><strong>${zones[k].label}</strong><small>${zones[k].list.length} pays · <em>${zones[k].list.filter(c => hasAny(c.code)).length} avec spécimens</em></small></button>`).join('')}</div>
      <div class="list scroll" id="procResults" hidden></div>
    </div>`;
    const input = body.querySelector('#procSearch'), res = body.querySelector('#procResults'), zl = body.querySelector('#procZones');
    input.addEventListener('input', () => {
      const q = norm(input.value.trim());
      zl.hidden = !!q; res.hidden = !q; const rc = body.querySelector('#procRecents'); if (rc) rc.hidden = !!q;
      if (!q) return;
      const rows = allCountries.filter(c => norm(`${c.name} ${c.code}`).includes(q) && (!onlySpec || hasAny(c.code))).sort((a, b) => a.name.localeCompare(b.name, 'fr'));
      res.innerHTML = rows.length ? rows.map(countryRow).join('') : '<p class="empty">Aucun pays ne correspond.</p>';
      bindCountries(res, null);
    });
    body.querySelectorAll('[data-zone]').forEach(b => b.addEventListener('click', () => renderZone(b.dataset.zone)));
    const rc = body.querySelector('#procRecents'); if (rc) bindCountries(rc, null);
    if (focus) setTimeout(() => input.focus(), 50);
  }

  // Écran 2 : pays d'une zone (seule la liste défile)
  function renderZone(key) {
    freeUrls();
    const z = zones[key];
    App.header({ title: z.label, back: () => renderHome() });
    body.innerHTML = `<div class="pad stack fill">
      <label class="search"><span>⌕</span><input id="zoneSearch" type="search" placeholder="Filtrer ${z.list.length} pays…" autocomplete="off" /></label>
      ${filterBar()}
      <div class="list scroll" id="zoneList"></div>
      ${key === 'schengen' ? '<p class="foot">29 États Schengen à la date de cette version : composition à revérifier.</p>' : ''}
    </div>`;
    const input = body.querySelector('#zoneSearch'), list = body.querySelector('#zoneList');
    const draw = () => {
      const q = norm(input.value.trim());
      const rows = z.list.filter(c => norm(`${c.name} ${c.code}`).includes(q) && (!onlySpec || hasAny(c.code)));
      list.innerHTML = rows.length ? rows.map(countryRow).join('') : '<p class="empty">Aucun pays ne correspond.</p>';
      bindCountries(list, key);
    };
    input.addEventListener('input', draw); draw();
    body.querySelector('#onlySpec').addEventListener('click', ev => { onlySpec = !onlySpec; ev.currentTarget.classList.toggle('on', onlySpec); ev.currentTarget.setAttribute('aria-pressed', onlySpec); ev.currentTarget.textContent = (onlySpec ? '✓ ' : '') + 'Avec spécimen'; draw(); });
  }

  // Écran 3 : fiche pays, un onglet par document. Seule la zone des pièces défile.
  function renderCountry(code, from, docType) {
    freeUrls();
    const c = allCountries.find(x => x.code === code);
    const docs = documentsFor(c);
    const d = docs.find(x => x.type === docType) || docs[0];
    App.header({ title: c.name, back: () => from ? renderZone(from) : renderHome() });
    const short = { passport: 'Passeport', id: c.code === 'IRL' ? 'Carte passeport' : 'CNI / eCNI', none: 'CNI', residence: 'Titre de séjour' };
    const commons = (SPEC[c.code] && SPEC[c.code][d.type]) || [];
    body.innerHTML = `<div class="pad stack fill">
      <div class="row"><span class="chip mono">${c.code}</span><span class="muted small">${tags(c) || 'Hors UE'}</span></div>
      <div class="seg" role="tablist">${docs.map(x => `<button role="tab" class="${x === d ? 'on' : ''}" aria-selected="${x === d}" data-doc="${x.type}">${short[x.type]}${x.type !== 'none' && has(c.code, x.type) ? ' <span class="dot"></span>' : ''}</button>`).join('')}</div>
      <div class="scroll specs">
        <p class="muted small">${esc(d.detail)}</p>
        ${commons.map(img => `<figure class="spec"><button class="spec-img" data-src="${img.thumb}" data-src-full="${img.thumb.replace(/\/(\d+)px-/, '/1280px-')}" data-cap="${esc(`${c.name} · ${d.name} · ${img.label || ''} — ${img.license}${img.artist ? ', ' + img.artist : ''}`)}" data-source="${img.page}" aria-label="Agrandir : ${esc(img.label || d.name)}"><img src="${img.thumb}" alt="Spécimen ${esc(d.name)} — ${esc(c.name)}" loading="lazy" /></button><figcaption><b>${esc(img.label || '')}</b> · Wikimedia Commons · ${esc(img.license)}${img.artist ? ' · ' + esc(img.artist) : ''}</figcaption></figure>`).join('')}
        <div id="ownSpecs"></div>
        ${d.type === 'none' || commons.length ? '' : '<p class="empty" id="noSpec">Pas de spécimen libre pour ce document. Ouvre PRADO ou ajoute ton image.</p>'}
      </div>
      <div class="actions">
        <a class="btn" href="${prado(c.code)}" target="_blank" rel="noopener">PRADO ↗</a>
        ${d.type === 'none' ? '' : '<label class="btn btn-primary">+ Ajouter une image<input type="file" accept="image/*" multiple id="ownAdd" hidden /></label>'}
      </div>
    </div>`;
    body.querySelectorAll('[data-doc]').forEach(b => b.addEventListener('click', () => renderCountry(code, from, b.dataset.doc)));
    bindViewer(body.querySelector('.specs'));
    pushRecent(code);
    const key = `${c.code}:${d.type}`;
    const mine = async () => (await S.all('specimens')).filter(r => r.id === key || r.id.startsWith(key + ':')).sort((a, b) => a.added - b.added);
    const drawOwn = async () => {
      const box = body.querySelector('#ownSpecs'); if (!box) return;
      let recs = [];
      try { recs = await mine(); } catch { return; }
      const empty = body.querySelector('#noSpec'); if (empty) empty.hidden = recs.length > 0;
      box.innerHTML = recs.map(r => {
        const u = URL.createObjectURL(r.blob); urls.push(u);
        return `<figure class="spec"><button class="spec-img" data-src="${u}" data-cap="${esc(`${c.name} · ${r.label || 'Mon spécimen'} (sur ce téléphone)`)}" aria-label="Agrandir : ${esc(r.label || 'Mon spécimen')}"><img src="${u}" alt="${esc(r.label || 'Mon spécimen')}" /></button><figcaption><b>${esc(r.label || 'Mon spécimen')}</b> · sur ce téléphone · <button type="button" class="link" data-del="${esc(r.id)}">Supprimer</button></figcaption></figure>`;
      }).join('');
      bindViewer(box);
      box.querySelectorAll('[data-del]').forEach(b => b.addEventListener('click', async () => { if (confirm('Supprimer cette image ?')) { await S.del('specimens', b.dataset.del); await refreshOwn(); drawOwn(); } }));
    };
    const add = body.querySelector('#ownAdd');
    if (add) add.addEventListener('change', async () => {
      const files = [...add.files]; add.value = ''; if (!files.length) return;
      const existing = (await mine()).map(r => r.label);
      const suggestions = (d.labels || []).filter(l => !existing.includes(l));
      for (const f of files) {
        const label = (prompt(`Nom de l'image (${f.name}) :`, suggestions.shift() || d.name) || '').trim() || d.name;
        await S.put('specimens', { id: `${key}:${S.uid()}`, label, blob: await S.compressImage(f), name: f.name, added: Date.now() });
      }
      await refreshOwn(); drawOwn();
    });
    drawOwn();
  }

  App.on('procedure', async opts => { await refreshOwn(); renderHome(opts.search); });
})();
