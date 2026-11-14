(() => {
  const PRADO = 'https://www.consilium.europa.eu/prado/fr/search-by-document-country.html';
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

  function documentsFor(c) {
    const europe = UE.includes(c.code) || SCHENGEN.includes(c.code);
    if (!europe) return [
      { type: 'passport', name: 'Passeport', detail: 'Document de voyage' },
      { type: 'id', name: "Carte d'identité et autres titres", detail: 'Selon les documents délivrés par le pays et répertoriés dans PRADO' }
    ];
    const docs = [{ type: 'passport', name: 'Passeport', detail: 'Document de voyage' }];
    if (c.code === 'DNK') docs.push({ type: 'none', name: "Pas de carte nationale d'identité", detail: "Le Danemark ne délivre pas de carte d'identité nationale : vérifier les autres titres dans PRADO" });
    else if (c.code === 'IRL') docs.push({ type: 'id', name: 'Carte passeport', detail: "Passport card, utilisée comme document d'identité" });
    else docs.push({ type: 'id', name: "Carte d'identité", detail: 'Document national' });
    docs.push({ type: 'residence', name: 'Titre de séjour', detail: 'Modèle uniforme européen délivré aux ressortissants de pays tiers' });
    return docs;
  }

  const esc = s => s.replace(/[&<>"']/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]));
  const body = document.getElementById('procBody');
  const tags = c => (SCHENGEN.includes(c.code) ? ' · Schengen' : '') + (UE.includes(c.code) ? ' · UE' : '');

  function renderZones() {
    body.innerHTML = `<div class="quick-grid">${order.map(k => { const z = zones[k]; return `<button class="quick-card" data-zone="${k}"><span class="quick-icon ${z.cls}">${z.icon}</span><strong>${z.label}</strong><small>${z.list.length} pays</small><span class="card-arrow">↗</span></button>`; }).join('')}</div>`;
    body.querySelectorAll('[data-zone]').forEach(b => b.addEventListener('click', () => renderZone(b.dataset.zone)));
  }

  function renderZone(key) {
    const z = zones[key];
    body.innerHTML = `<button class="secondary-btn proc-back" data-back>← Toutes les zones</button>
      <div class="section-head"><div><div class="eyebrow">ZONE</div><h2>${z.label}</h2></div><span class="tiny-tag">${z.list.length} PAYS</span></div>
      <label class="searchbox"><span>⌕</span><input id="procSearch" type="search" placeholder="Pays ou code…" autocomplete="off" /></label>
      <div class="document-list proc-list" id="procList"></div>
      <div class="empty-state" id="procEmpty" hidden>Aucun pays ne correspond.</div>
      ${key === 'schengen' ? '<div class="notice"><strong>Composition à vérifier</strong><p>Liste des 29 États Schengen connue à la date de cette version. Vérifie toujours la composition à jour sur le site de la Commission européenne.</p></div>' : ''}`;
    const draw = () => {
      const q = document.getElementById('procSearch').value.trim().toLocaleLowerCase('fr');
      const rows = z.list.filter(c => `${c.name} ${c.code}`.toLocaleLowerCase('fr').includes(q));
      document.getElementById('procList').innerHTML = rows.map(c => `<button class="doc-card" data-country="${c.code}"><span class="flag">${c.code}</span><span class="doc-info"><strong>${esc(c.name)}</strong><small>${documentsFor(c).length} documents de référence${tags(c)}${SPEC[c.code] ? ' · spécimens' : ''}</small></span><span class="doc-arrow">↗</span></button>`).join('');
      document.getElementById('procEmpty').hidden = rows.length > 0;
      body.querySelectorAll('[data-country]').forEach(b => b.addEventListener('click', () => renderCountry(key, b.dataset.country)));
    };
    document.getElementById('procSearch').addEventListener('input', draw);
    body.querySelector('[data-back]').addEventListener('click', renderZones);
    draw();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  const SPEC = window.SPECIMENS || {};
  const S = window.BVStore;
  const pageUrls = [];

  function docCard(c, d) {
    const commons = (SPEC[c.code] && SPEC[c.code][d.type]) || [];
    const gallery = commons.map(img => `<figure class="spec-fig"><a href="${img.page}" target="_blank" rel="noopener"><img src="${img.thumb}" alt="Spécimen ${esc(d.name)} ${esc(c.name)}" loading="lazy" /></a>
      <figcaption>${esc(img.label || '')}${img.label ? ' · ' : ''}Wikimedia Commons · ${esc(img.license)}${img.artist ? ' · ' + esc(img.artist) : ''}</figcaption></figure>`).join('');
    const canUpload = d.type !== 'none';
    return `<div class="spec-card" data-doc="${d.type}">
      <div class="spec-head"><span class="source-icon">${c.code}</span><span><strong>${esc(d.name)}</strong><small>${esc(d.detail)}</small></span></div>
      ${gallery ? `<div class="spec-gallery">${gallery}</div>` : (d.type === 'passport' || d.type === 'id') ? '<p class="spec-empty">Pas de spécimen à licence libre trouvé pour ce document. Consulte PRADO ou ajoute ton image.</p>' : ''}
      <div class="spec-own" data-own="${c.code}:${d.type}"></div>
      <div class="calc-actions">
        <a class="secondary-btn spec-link" href="${PRADO}" target="_blank" rel="noopener">PRADO (pays : ${c.code}) ↗</a>
        ${canUpload ? `<label class="secondary-btn">+ Mon spécimen<input type="file" accept="image/*" data-upload="${c.code}:${d.type}" hidden /></label>` : ''}
      </div></div>`;
  }

  async function drawOwn(key) {
    const box = body.querySelector(`[data-own="${key}"]`); if (!box || !S) return;
    let rec; try { rec = await S.get('specimens', key); } catch { return; }
    if (!rec) { box.innerHTML = ''; return; }
    const u = URL.createObjectURL(rec.blob); pageUrls.push(u);
    box.innerHTML = `<figure class="spec-fig"><a href="${u}" target="_blank" rel="noopener"><img src="${u}" alt="Mon spécimen" /></a><figcaption>Mon spécimen · enregistré sur ce téléphone · <button type="button" class="spec-del" data-del="${key}">Supprimer</button></figcaption></figure>`;
    box.querySelector('[data-del]').addEventListener('click', async () => { if (confirm('Supprimer ton image de spécimen ?')) { await S.del('specimens', key); drawOwn(key); } });
  }

  function renderCountry(zoneKey, code) {
    pageUrls.splice(0).forEach(u => URL.revokeObjectURL(u));
    const c = allCountries.find(x => x.code === code);
    const docs = documentsFor(c);
    body.innerHTML = `<button class="secondary-btn proc-back" data-back>← ${zones[zoneKey].label}</button>
      <div class="section-head"><div><div class="eyebrow">DOSSIER PAYS · CODE ${c.code}</div><h2>${esc(c.name)}</h2></div><span class="tiny-tag">${tags(c).replace(/^ · /, '') || 'HORS UE'}</span></div>
      <div class="source-list">${docs.map(d => docCard(c, d)).join('')}</div>
      <div class="notice"><strong>Spécimens</strong><p>Les images publiques viennent de Wikimedia Commons (licence libre, auteur indiqué ; touche une image pour voir sa source). Pour la référence officielle et toutes les versions, consulte PRADO et choisis le pays <b>${c.code}</b>. Ajoute uniquement des spécimens, jamais la pièce d'un client.</p></div>`;
    body.querySelector('[data-back]').addEventListener('click', () => renderZone(zoneKey));
    docs.forEach(d => drawOwn(`${c.code}:${d.type}`));
    body.querySelectorAll('[data-upload]').forEach(inp => inp.addEventListener('change', async () => {
      const f = inp.files[0]; if (!f || !S) return;
      const blob = await S.compressImage(f);
      await S.put('specimens', { id: inp.dataset.upload, blob, name: f.name, added: Date.now() });
      inp.value = ''; drawOwn(inp.dataset.upload);
    }));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  document.querySelectorAll('[data-nav="procedure"]').forEach(b => b.addEventListener('click', renderZones));
  renderZones();
})();
