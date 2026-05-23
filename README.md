# 🇬🇳 Guinée API — Backend REST Complet

API REST développée dans le cadre du **Projet 2 DecodeLabs** : Backend API Development.
4 modules couvrant des services guinéens réels.

## Démarrage rapide

```bash
npm install
npm start
# Serveur sur http://localhost:3000
```

---

## 1. Marché Madina — `/api/marche`

| Méthode | Route | Description |
|---------|-------|-------------|
| GET | `/api/marche/produits` | Lister tous les produits (filtres: categorie, disponible, quartier, search) |
| GET | `/api/marche/produits/:id` | Détail d'un produit |
| POST | `/api/marche/produits` | Ajouter un produit |
| PUT | `/api/marche/produits/:id` | Modifier prix/stock |
| DELETE | `/api/marche/produits/:id` | Supprimer un produit |
| GET | `/api/marche/stats` | Statistiques du marché |
| GET | `/api/marche/produits/categories` | Liste des catégories |

**Exemple POST :**
```json
{
  "nom": "Gombo séché",
  "categorie": "Légumes",
  "prix": 8000,
  "unite": "kg",
  "stock": 50,
  "vendeur": "Kadiatou Kouyaté",
  "quartier": "Madina"
}
```

---

## 2. Orange Money Guinée — `/api/money`

| Méthode | Route | Description |
|---------|-------|-------------|
| POST | `/api/money/auth` | Connexion (téléphone + PIN) |
| POST | `/api/money/comptes` | Créer un compte |
| GET | `/api/money/comptes/:telephone` | Consulter le solde |
| POST | `/api/money/transferts` | Effectuer un transfert |
| GET | `/api/money/transactions/:id` | Statut d'une transaction |
| GET | `/api/money/historique/:telephone` | Historique des transactions |

**Numéros valides (Guinée) :** 620XXXXXX, 621XXXXXX, 622XXXXXX ... 662XXXXXX

**Exemple transfert :**
```json
{
  "expediteurTel": "620000001",
  "destinataireTel": "621000002",
  "montant": 200000,
  "note": "Paiement loyer"
}
```

---

## 3. UGANC — Université `/api/uganc`

| Méthode | Route | Description |
|---------|-------|-------------|
| GET | `/api/uganc/filieres` | Liste des filières |
| GET | `/api/uganc/etudiants` | Lister les étudiants |
| POST | `/api/uganc/etudiants` | Inscrire un étudiant |
| GET | `/api/uganc/etudiants/:id` | Dossier étudiant |
| PUT | `/api/uganc/etudiants/:id` | Modifier le dossier |
| GET | `/api/uganc/etudiants/:id/notes` | Bulletin de notes + moyenne |
| POST | `/api/uganc/etudiants/:id/notes` | Ajouter une note |
| GET | `/api/uganc/stats` | Statistiques université |

**Filières disponibles :** Informatique, Médecine, Droit, Économie, Pharmacie

---

## 4. Pharmacies Conakry — `/api/pharmacie`

| Méthode | Route | Description |
|---------|-------|-------------|
| GET | `/api/pharmacie` | Lister (filtres: commune, garde, ouvert, lat, lon) |
| GET | `/api/pharmacie/garde` | Pharmacies de garde uniquement |
| GET | `/api/pharmacie/medicaments` | Chercher un médicament |
| GET | `/api/pharmacie/medicaments/:id/disponibilite` | Où trouver un médicament |
| GET | `/api/pharmacie/:id` | Détail pharmacie |
| POST | `/api/pharmacie` | Enregistrer une pharmacie |
| PUT | `/api/pharmacie/:id/statut` | Ouvrir/fermer |

**Recherche par proximité :**
```
GET /api/pharmacie?lat=9.537&lon=-13.677&ouvert=true
```

# Health check
curl http://localhost:3000/api/health

# Produits du marché
curl http://localhost:3000/api/marche/produits

# Solde Orange Money
curl http://localhost:3000/api/money/comptes/620000001

# Pharmacies de garde
curl http://localhost:3000/api/pharmacie/garde

# Notes d'un étudiant
curl http://localhost:3000/api/uganc/etudiants/ETU-001/notes

---

## Codes HTTP utilisés

| Code | Signification |
|------|--------------|
| 200 | Succès |
| 201 | Ressource créée |
| 400 | Données invalides |
| 401 | Non authentifié |
| 403 | Accès interdit |
| 404 | Ressource introuvable |
| 409 | Conflit (doublon) |
| 422 | Entité non traitable (ex: solde insuffisant) |
| 500 | Erreur serveur interne |

---

## Structure du projet

```
guinee-api/
├── server.js              # Point d'entrée
├── routes/
│   ├── marche.js          # Marché Madina
│   ├── money.js           # Orange Money GN
│   ├── uganc.js           # Université
│   └── pharmacie.js       # Pharmacies Conakry
├── middleware/
│   └── validators.js      # Validation & Auth
└── README.md
```

> **Build with Integrity. Validate Everything. Communicate Clearly. Respect the Architecture.**
> — DecodeLabs Project 2
