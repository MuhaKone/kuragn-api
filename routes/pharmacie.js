const express = require('express');
const router = express.Router();
const { body, param, query } = require('express-validator');
const { validate } = require('../middleware/validators');

// ─── Data ─────────────────────────────────────────────────────────────────────
let pharmacies = [
  { id: 1, nom: 'Pharmacie Centrale Kaloum', quartier: 'Kaloum', commune: 'Kaloum', adresse: 'Avenue de la République, Kaloum', telephone: '622100001', latitude: 9.5370, longitude: -13.6773, horaires: '07h-22h', garde: true, specialites: ['Général'], note: 4.5, ouvert: true },
  { id: 2, nom: 'Pharmacie Hamdallaye', quartier: 'Hamdallaye', commune: 'Ratoma', adresse: 'Carrefour Hamdallaye', telephone: '622100002', latitude: 9.5810, longitude: -13.6520, horaires: '08h-21h', garde: false, specialites: ['Pédiatrie', 'Général'], note: 4.2, ouvert: true },
  { id: 3, nom: 'Pharmacie Matam', quartier: 'Matam', commune: 'Matam', adresse: 'Boulevard du Commerce, Matam', telephone: '622100003', latitude: 9.5620, longitude: -13.6650, horaires: '08h-20h', garde: false, specialites: ['Général'], note: 3.9, ouvert: true },
  { id: 4, nom: 'Pharmacie Ratoma Centre', quartier: 'Ratoma', commune: 'Ratoma', adresse: 'Rue principale de Ratoma', telephone: '622100004', latitude: 9.5950, longitude: -13.6480, horaires: '07h-23h', garde: true, specialites: ['Général', 'Maternité'], note: 4.7, ouvert: true },
  { id: 5, nom: 'Pharmacie Dixinn', quartier: 'Dixinn', commune: 'Dixinn', adresse: 'Avenue Patrice Lumumba, Dixinn', telephone: '622100005', latitude: 9.5500, longitude: -13.6700, horaires: '07h-21h', garde: false, specialites: ['Général'], note: 4.0, ouvert: false },
  { id: 6, nom: 'Pharmacie Kipé', quartier: 'Kipé', commune: 'Ratoma', adresse: 'Route de Kipé', telephone: '622100006', latitude: 9.6020, longitude: -13.6350, horaires: '08h-22h', garde: true, specialites: ['Général', 'Ophtalmologie'], note: 4.3, ouvert: true },
];

let medicaments = [
  { id: 1, nom: 'Paracétamol 500mg', categorie: 'Antalgique', prixMoyen: 2500, ordonnance: false, disponibleDans: [1, 2, 3, 4, 6] },
  { id: 2, nom: 'Amoxicilline 500mg', categorie: 'Antibiotique', prixMoyen: 12000, ordonnance: true, disponibleDans: [1, 4, 6] },
  { id: 3, nom: 'Artéméther-Luméfantrine', categorie: 'Antipaludéen', prixMoyen: 18000, ordonnance: false, disponibleDans: [1, 2, 3, 4, 5, 6] },
  { id: 4, nom: 'SRO (Sels de Réhydratation)', categorie: 'Réhydratation', prixMoyen: 1500, ordonnance: false, disponibleDans: [1, 2, 3, 4, 6] },
  { id: 5, nom: 'Metformine 500mg', categorie: 'Antidiabétique', prixMoyen: 8000, ordonnance: true, disponibleDans: [1, 4] },
  { id: 6, nom: 'Ibuprofen 400mg', categorie: 'Anti-inflammatoire', prixMoyen: 5000, ordonnance: false, disponibleDans: [1, 2, 4, 6] },
];

let pharmaCounter = pharmacies.length + 1;

// Distance calculation (Haversine)
const distanceKm = (lat1, lon1, lat2, lon2) => {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180) * Math.cos(lat2*Math.PI/180) * Math.sin(dLon/2)**2;
  return Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)) * 10) / 10;
};

// ─── GET /api/pharmacie ───────────────────────────────────────────────────────
router.get('/', (req, res) => {
  let result = [...pharmacies];
  const { commune, garde, ouvert, lat, lon } = req.query;

  if (commune) result = result.filter(p => p.commune.toLowerCase() === commune.toLowerCase());
  if (garde === 'true') result = result.filter(p => p.garde);
  if (ouvert === 'true') result = result.filter(p => p.ouvert);

  // Add distance if coordinates provided
  if (lat && lon) {
    const uLat = parseFloat(lat);
    const uLon = parseFloat(lon);
    result = result.map(p => ({ ...p, distanceKm: distanceKm(uLat, uLon, p.latitude, p.longitude) }));
    result.sort((a, b) => a.distanceKm - b.distanceKm);
  }

  res.status(200).json({ data: result, total: result.length });
});

// ─── GET /api/pharmacie/garde ─────────────────────────────────────────────────
router.get('/garde', (req, res) => {
  const enGarde = pharmacies.filter(p => p.garde && p.ouvert);
  res.status(200).json({
    data: enGarde,
    total: enGarde.length,
    message: enGarde.length > 0 ? `${enGarde.length} pharmacie(s) de garde disponible(s)` : 'Aucune pharmacie de garde disponible'
  });
});

// ─── GET /api/pharmacie/medicaments ──────────────────────────────────────────
router.get('/medicaments', (req, res) => {
  const { search, categorie } = req.query;
  let result = [...medicaments];
  if (search) result = result.filter(m => m.nom.toLowerCase().includes(search.toLowerCase()));
  if (categorie) result = result.filter(m => m.categorie.toLowerCase() === categorie.toLowerCase());
  res.status(200).json({ data: result, total: result.length, devise: 'GNF' });
});

// ─── GET /api/pharmacie/medicaments/:id/disponibilite ────────────────────────
router.get('/medicaments/:id/disponibilite', (req, res) => {
  const med = medicaments.find(m => m.id === parseInt(req.params.id));
  if (!med) return res.status(404).json({ error: 'Médicament non trouvé', code: 404 });

  const pharmaciesDisponibles = pharmacies.filter(p => med.disponibleDans.includes(p.id));
  res.status(200).json({
    data: {
      medicament: { id: med.id, nom: med.nom, prixMoyen: med.prixMoyen, ordonnance: med.ordonnance },
      pharmacies: pharmaciesDisponibles,
      totalPharmacies: pharmaciesDisponibles.length
    }
  });
});

// ─── GET /api/pharmacie/:id ───────────────────────────────────────────────────
router.get('/:id',
  param('id').isInt({ min: 1 }),
  validate,
  (req, res) => {
    const pharmacie = pharmacies.find(p => p.id === parseInt(req.params.id));
    if (!pharmacie) return res.status(404).json({ error: 'Pharmacie non trouvée', code: 404 });
    res.status(200).json({ data: pharmacie });
  }
);

// ─── POST /api/pharmacie ──────────────────────────────────────────────────────
router.post('/',
  body('nom').notEmpty().withMessage('Nom requis'),
  body('quartier').notEmpty().withMessage('Quartier requis'),
  body('commune').notEmpty().withMessage('Commune requise'),
  body('telephone').matches(/^(620|621|622|623|624|625|626|627|628|629|655|656|657|658|659|660|661|662)\d{6}$/).withMessage('Numéro guinéen invalide'),
  body('latitude').isFloat({ min: 9.0, max: 10.5 }).withMessage('Latitude invalide pour Conakry'),
  body('longitude').isFloat({ min: -14.0, max: -13.0 }).withMessage('Longitude invalide pour Conakry'),
  validate,
  (req, res) => {
    const { nom, quartier, commune, adresse, telephone, latitude, longitude, horaires, garde, specialites } = req.body;
    const nouvelle = {
      id: pharmaCounter++,
      nom, quartier, commune,
      adresse: adresse || `${quartier}, ${commune}`,
      telephone, latitude, longitude,
      horaires: horaires || '08h-20h',
      garde: garde || false,
      specialites: specialites || ['Général'],
      note: null,
      ouvert: true,
      creeLe: new Date().toISOString()
    };
    pharmacies.push(nouvelle);
    res.status(201).json({ data: nouvelle, message: 'Pharmacie enregistrée' });
  }
);

// ─── PUT /api/pharmacie/:id/statut ────────────────────────────────────────────
router.put('/:id/statut',
  param('id').isInt({ min: 1 }),
  body('ouvert').isBoolean().withMessage('ouvert doit être true ou false'),
  validate,
  (req, res) => {
    const index = pharmacies.findIndex(p => p.id === parseInt(req.params.id));
    if (index === -1) return res.status(404).json({ error: 'Pharmacie non trouvée', code: 404 });
    pharmacies[index].ouvert = req.body.ouvert;
    if (req.body.garde !== undefined) pharmacies[index].garde = req.body.garde;
    res.status(200).json({ data: pharmacies[index], message: 'Statut mis à jour' });
  }
);

module.exports = router;
