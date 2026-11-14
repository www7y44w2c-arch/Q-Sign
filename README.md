# S'kam

Application web mobile (PWA) d'aide à la vérification documentaire : HTML, CSS et JavaScript, sans dépendance ni serveur. Publiée sur GitHub Pages : https://www7y44w2c-arch.github.io/Q-Sign/

## Onglets
- **Accueil** : tableau de bord — salutation avec ton prénom, carte **Planning** (horaires du jour, temps écoulé / restant, objectif du jour et rythme nécessaire, prochain service), aujourd'hui (dossiers, heures en temps réel, cadence, % d'objectif, +1), mois (total, paliers, projection, moyenne, jours prévus d'après le planning), graphique **Dossiers | Heures** (7 derniers jours ou heures faites / prévues de la semaine), raccourcis. Toucher la salutation ou la carte Planning pour saisir prénom et horaires.

Interface pensée comme une application : chaque écran tient sur la hauteur du téléphone, avec un bouton retour dans l'en-tête ; seules les listes et les fiches de spécimens défilent.
- **Procédure** : zones (Schengen, Europe, Afrique, Amériques, Asie & Moyen-Orient, Océanie), puis pays. Pastilles PASS / ID sur chaque pays quand un spécimen est disponible, filtre « Avec spécimen ». Par pays : passeport (2e et 3e de couverture), CNI / eCNI, titre de séjour pour la France. Spécimens à licence libre de Wikimedia Commons (auteur et licence affichés), lien direct vers PRADO, ajout de ses propres images.
- **Contrôles** : repère de vérification à distance en 6 étapes (recevabilité, référence, cohérence interne et MRZ, cohérence du dossier, personne, décision tracée), puis « +1 dossier ».
- **Calcul** : calculette (pavé numérique : `=` fixe le total, `+` / `−` ajoutent ou retirent, `h` fixe les heures, chrono de shift `▶ Start` / `⏸ Pause` / `▶ Reprendre` / `■ Fin` (heure du téléphone, pauses déduites des heures et de la cadence ; taper `830` avant `▶` pour démarrer ou corriger à 8 h 30)), choix du jour, objectif à 80 dossiers/heure ; vue Mois avec projection et paliers (9 000 / 12 000 / 14 000), tous réglables.
- Depuis l'accueil : **Cas complexes** (fiches anonymisées avec pièces jointes), **Formation** (11 cas fictifs de vérification à distance, réponses mélangées), **Sources officielles** (PRADO, OACI Doc 9303, ANSSI PVID, ANTS, Service-Public, Frontex).

## Données
Tout ce qui est saisi reste sur l'appareil (localStorage et IndexedDB) : rien n'est envoyé sur Internet. Des boutons d'export / import permettent de sauvegarder le Calcul, les cas complexes et les spécimens ajoutés.

## Fichiers
| Fichier | Rôle |
| --- | --- |
| `index.html`, `styles.css` | Structure et thème (noir / blanc / violet) |
| `app.js` | Navigation, entraînement, installation |
| `store.js` | Stockage local (IndexedDB / localStorage) |
| `procedure.js`, `specimens.js` | Onglet Procédure et liste des spécimens Commons |
| `calcul.js` | Onglet Calcul |
| `reference.js` | Cas complexes |
| `sw.js`, `manifest.webmanifest`, `icons/` | Mode hors ligne et installation |

## Tester en local
`python -m http.server 8000` puis http://localhost:8000

## Limites
- Les spécimens ne couvrent pas tous les pays ; PRADO reste la référence officielle.
- Aucune donnée client (nom, numéro, copie de pièce réelle) ne doit être saisie. Les procédures et outils de l'employeur priment.
