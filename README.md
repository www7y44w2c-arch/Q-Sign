# S'kam (ex BANK VERIFY AI)

Application web mobile-first (PWA) en HTML/CSS/JavaScript, sans dépendance ni API externe.

## Lancer sur un PC

- Ouvrir `index.html` directement pour tester l'interface.
- Pour tester le mode PWA/service worker, servir le dossier en HTTP local :
  - Python : `python -m http.server 8000`
  - Puis ouvrir `http://localhost:8000`

## Installer sur iPhone

Pour l'installation PWA, héberger le dossier sur une adresse HTTPS autorisée, ouvrir cette adresse dans Safari, puis utiliser **Partager > Sur l'écran d'accueil**. Le service worker nécessite HTTPS (ou localhost).

## Contenu de cette V1

- Accueil et navigation mobile en quatre onglets
- Recherche et filtres sur un petit échantillon de fiches de démonstration
- Checklist de méthode générale
- Trois exercices fictifs avec correction et score
- Liens vers des sources institutionnelles
- Cache hors ligne de l'application

## Limites importantes

- Les fiches de documents sont des placeholders de démonstration, pas un référentiel authentifiant.
- Aucun téléversement d'image, OCR, reconnaissance faciale ou analyse automatique n'est implémenté.
- Aucun document client, donnée bancaire, identité réelle ou capture QuickSign ne doit être saisi dans cette application personnelle.
- Les procédures et outils autorisés par l'employeur priment. Usage professionnel uniquement après validation explicite de l'employeur.
- Les liens externes nécessitent une connexion et peuvent évoluer.

## Suite proposée

1. Valider l'ergonomie sur iPhone.
2. Définir le schéma de données des fiches (pays, type, version, validité, source, date de vérification, limites).
3. Constituer les premières fiches à partir de sources officielles, sans reproduire de détails sensibles de sécurité qui faciliteraient la falsification.
4. Ajouter une vraie gestion des favoris, des notes non sensibles et de la progression.
