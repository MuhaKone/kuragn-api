const express = require('express');
const router = express.Router();
const { body, param } = require('express-validator');
const { validate, authMiddleware } = require('../middleware/validators');

// ─── In-memory stores ────────────────────────────────────────────────────────
let comptes = [
  { id: 1, telephone: '620000001', nom: 'Mamadou Diallo', solde: 500000, actif: true, creeLe: '2024-01-15T08:00:00Z' },
  { id: 2, telephone: '621000002', nom: 'Fatoumata Bah', solde: 1200000, actif: true, creeLe: '2024-02-20T10:30:00Z' },
  { id: 3, telephone: '622000003', nom: 'Ibrahima Sow', solde: 75000, actif: true, creeLe: '2024-03-10T14:00:00Z' },
  { id: 4, telephone: '623000004', nom: 'Aissatou Camara', solde: 3000000, actif: false, creeLe: '2024-01-05T09:00:00Z' },
];

let transactions = [
  { id: 'TXN-001', expediteurTel: '620000001', destinataireTel: '621000002', montant: 100000, type: 'transfert', statut: 'succès', frais: 1000, date: '2024-05-01T10:00:00Z', reference: 'REF-2024-001' },
  { id: 'TXN-002', expediteurTel: '621000002', destinataireTel: '622000003', montant: 50000, type: 'transfert', statut: 'succès', frais: 500, date: '2024-05-02T14:30:00Z', reference: 'REF-2024-002' },
  { id: 'TXN-003', expediteurTel: '622000003', destinataireTel: '620000001', montant: 200000, type: 'paiement', statut: 'échec', frais: 0, date: '2024-05-03T09:15:00Z', reference: 'REF-2024-003', raisonEchec: 'Solde insuffisant' },
];

let txCounter = transactions.length + 1;
let compteCounter = comptes.length + 1;

// ─── Frais de transfert (simulation Orange Money GN) ─────────────────────────
const calculerFrais = (montant) => {
  if (montant <= 50000)  return 500;
  if (montant <= 200000) return 1000;
  if (montant <= 500000) return 2000;
  return Math.round(montant * 0.005);
};

// ─── POST /api/money/auth ─────────────────────────────────────────────────────
router.post('/auth',
  body('telephone').matches(/^(620|621|622|623|624|625|626|627|628|629|655|656|657|658|659|660|661|662)\d{6}$/).withMessage('Numéro guinéen invalide'),
  body('code').isLength({ min: 4, max: 6 }).withMessage('Code PIN de 4 à 6 chiffres'),
  validate,
  (req, res) => {
    const { telephone } = req.body;
    const compte = comptes.find(c => c.telephone === telephone);
    if (!compte) return res.status(404).json({ error: 'Compte non trouvé', code: 404 });
    if (!compte.actif) return res.status(403).json({ error: 'Compte suspendu', code: 403 });

    // Simulate token
    const token = `Bearer token_${compte.id}_${Date.now()}`;
    res.status(200).json({
      message: 'Connexion réussie',
      token,
      compte: { id: compte.id, nom: compte.nom, telephone: compte.telephone }
    });
  }
);

// ─── POST /api/money/comptes ──────────────────────────────────────────────────
router.post('/comptes',
  body('telephone').matches(/^(620|621|622|623|624|625|626|627|628|629|655|656|657|658|659|660|661|662)\d{6}$/).withMessage('Numéro guinéen invalide (ex: 620XXXXXX)'),
  body('nom').notEmpty().withMessage('Nom requis').trim(),
  body('code').isLength({ min: 4, max: 6 }).withMessage('Code PIN requis'),
  validate,
  (req, res) => {
    const { telephone, nom } = req.body;
    const existant = comptes.find(c => c.telephone === telephone);
    if (existant) return res.status(409).json({ error: 'Ce numéro a déjà un compte', code: 409 });

    const nouveau = {
      id: compteCounter++,
      telephone, nom,
      solde: 0,
      actif: true,
      creeLe: new Date().toISOString()
    };
    comptes.push(nouveau);
    res.status(201).json({ data: nouveau, message: 'Compte Orange Money créé avec succès' });
  }
);

// ─── GET /api/money/comptes/:telephone ───────────────────────────────────────
router.get('/comptes/:telephone', (req, res) => {
  const compte = comptes.find(c => c.telephone === req.params.telephone);
  if (!compte) return res.status(404).json({ error: 'Compte non trouvé', code: 404 });
  if (!compte.actif) return res.status(403).json({ error: 'Compte suspendu', code: 403 });

  res.status(200).json({
    data: {
      telephone: compte.telephone,
      nom: compte.nom,
      solde: compte.solde,
      devise: 'GNF',
      actif: compte.actif
    }
  });
});

// ─── POST /api/money/transferts ───────────────────────────────────────────────
router.post('/transferts',
  body('expediteurTel').notEmpty().withMessage('Numéro expéditeur requis'),
  body('destinataireTel').notEmpty().withMessage('Numéro destinataire requis'),
  body('montant').isInt({ min: 1000 }).withMessage('Montant minimum 1000 GNF'),
  validate,
  (req, res) => {
    const { expediteurTel, destinataireTel, montant, note } = req.body;

    const expediteur = comptes.find(c => c.telephone === expediteurTel);
    const destinataire = comptes.find(c => c.telephone === destinataireTel);

    if (!expediteur) return res.status(404).json({ error: 'Compte expéditeur introuvable', code: 404 });
    if (!destinataire) return res.status(404).json({ error: 'Compte destinataire introuvable', code: 404 });
    if (!expediteur.actif) return res.status(403).json({ error: 'Compte expéditeur suspendu', code: 403 });

    const frais = calculerFrais(montant);
    const total = montant + frais;

    if (expediteur.solde < total) {
      const txEchec = {
        id: `TXN-${String(txCounter++).padStart(3, '0')}`,
        expediteurTel, destinataireTel, montant,
        type: 'transfert', statut: 'échec', frais,
        date: new Date().toISOString(),
        reference: `REF-${Date.now()}`,
        raisonEchec: `Solde insuffisant (solde: ${expediteur.solde} GNF, requis: ${total} GNF)`
      };
      transactions.push(txEchec);
      return res.status(422).json({ error: 'Solde insuffisant', code: 422, transaction: txEchec });
    }

    // Execute transfer
    expediteur.solde -= total;
    destinataire.solde += montant;

    const txSucces = {
      id: `TXN-${String(txCounter++).padStart(3, '0')}`,
      expediteurTel, destinataireTel, montant,
      type: 'transfert', statut: 'succès', frais,
      note: note || null,
      date: new Date().toISOString(),
      reference: `REF-${Date.now()}`
    };
    transactions.push(txSucces);

    res.status(201).json({
      data: txSucces,
      soldeMisAJour: { nouveauSolde: expediteur.solde, devise: 'GNF' },
      message: `Transfert de ${montant.toLocaleString()} GNF réussi`
    });
  }
);

// ─── GET /api/money/transactions/:id ─────────────────────────────────────────
router.get('/transactions/:id', (req, res) => {
  const tx = transactions.find(t => t.id === req.params.id);
  if (!tx) return res.status(404).json({ error: 'Transaction non trouvée', code: 404 });
  res.status(200).json({ data: tx });
});

// ─── GET /api/money/historique/:telephone ─────────────────────────────────────
router.get('/historique/:telephone', (req, res) => {
  const { telephone } = req.params;
  const compte = comptes.find(c => c.telephone === telephone);
  if (!compte) return res.status(404).json({ error: 'Compte non trouvé', code: 404 });

  const historique = transactions.filter(
    t => t.expediteurTel === telephone || t.destinataireTel === telephone
  ).sort((a, b) => new Date(b.date) - new Date(a.date));

  res.status(200).json({ data: historique, total: historique.length });
});

module.exports = router;
