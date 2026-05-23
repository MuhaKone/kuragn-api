const express = require('express');
const router = express.Router();
const { body, param, query } = require('express-validator');
const { validate } = require('../middleware/validators');

// ─── In-memory data store ───────────────────────────────────────────────────
let produits = [
  { id: 1, nom: 'Riz local', categorie: 'Céréales', prix: 85000, unite: 'sac 50kg', stock: 120, vendeur: 'Mamadou Diallo', quartier: 'Madina', disponible: true },
  { id: 2, nom: 'Tomate fraîche', categorie: 'Légumes', prix: 5000, unite: 'kg', stock: 80, vendeur: 'Fatoumata Bah', quartier: 'Madina', disponible: true },
  { id: 3, nom: 'Huile de palme', categorie: 'Huiles', prix: 25000, unite: 'bidon 5L', stock: 45, vendeur: 'Aissatou Camara', quartier: 'Dixinn', disponible: true },
  { id: 4, nom: 'Poulet fermier', categorie: 'Viandes', prix: 80000, unite: 'pièce', stock: 30, vendeur: 'Ibrahima Sow', quartier: 'Ratoma', disponible: true },
  { id: 5, nom: 'Mangue Kent', categorie: 'Fruits', prix: 3000, unite: 'kg', stock: 0, vendeur: 'Mariama Baldé', quartier: 'Matoto', disponible: false },
  { id: 6, nom: 'Mil', categorie: 'Céréales', prix: 12000, unite: 'kg', stock: 200, vendeur: 'Ousmane Barry', quartier: 'Madina', disponible: true },
  { id: 7, nom: 'Poisson thiof', categorie: 'Poissons', prix: 35000, unite: 'kg', stock: 25, vendeur: 'Kadiatou Kouyaté', quartier: 'Kaloum', disponible: true },
  { id: 8, nom: 'Oignon', categorie: 'Légumes', prix: 4500, unite: 'kg', stock: 150, vendeur: 'Sekou Condé', quartier: 'Madina', disponible: true },
];

let nextId = produits.length + 1;

// ─── Helper ─────────────────────────────────────────────────────────────────
const findById = (id) => produits.find(p => p.id === parseInt(id));

// ─── GET /api/marche/produits ────────────────────────────────────────────────
router.get('/produits', (req, res) => {
  let result = [...produits];
  const { categorie, disponible, quartier, search } = req.query;

  if (categorie) result = result.filter(p => p.categorie.toLowerCase() === categorie.toLowerCase());
  if (disponible !== undefined) result = result.filter(p => p.disponible === (disponible === 'true'));
  if (quartier) result = result.filter(p => p.quartier.toLowerCase() === quartier.toLowerCase());
  if (search) result = result.filter(p => p.nom.toLowerCase().includes(search.toLowerCase()));

  res.status(200).json({
    data: result,
    total: result.length,
    devise: 'GNF'
  });
});

// ─── GET /api/marche/produits/categories ────────────────────────────────────
router.get('/produits/categories', (req, res) => {
  const categories = [...new Set(produits.map(p => p.categorie))];
  res.status(200).json({ data: categories });
});

// ─── GET /api/marche/produits/:id ────────────────────────────────────────────
router.get('/produits/:id',
  param('id').isInt({ min: 1 }).withMessage('ID doit être un entier positif'),
  validate,
  (req, res) => {
    const produit = findById(req.params.id);
    if (!produit) return res.status(404).json({ error: 'Produit non trouvé', code: 404 });
    res.status(200).json({ data: produit });
  }
);

// ─── POST /api/marche/produits ───────────────────────────────────────────────
router.post('/produits',
  body('nom').notEmpty().withMessage('Le nom est requis').trim(),
  body('prix').isInt({ min: 1 }).withMessage('Le prix doit être un entier positif en GNF'),
  body('unite').notEmpty().withMessage('L\'unité est requise'),
  body('categorie').notEmpty().withMessage('La catégorie est requise'),
  body('stock').optional().isInt({ min: 0 }),
  body('vendeur').optional().trim(),
  body('quartier').optional().trim(),
  validate,
  (req, res) => {
    const { nom, prix, unite, categorie, stock = 0, vendeur = 'Inconnu', quartier = 'Conakry' } = req.body;
    const nouveau = {
      id: nextId++,
      nom, categorie, prix, unite, stock,
      vendeur, quartier,
      disponible: stock > 0,
      creeLe: new Date().toISOString()
    };
    produits.push(nouveau);
    res.status(201).json({ data: nouveau, message: 'Produit ajouté avec succès' });
  }
);

// ─── PUT /api/marche/produits/:id ────────────────────────────────────────────
router.put('/produits/:id',
  param('id').isInt({ min: 1 }),
  body('prix').optional().isInt({ min: 1 }).withMessage('Prix invalide'),
  body('stock').optional().isInt({ min: 0 }),
  validate,
  (req, res) => {
    const index = produits.findIndex(p => p.id === parseInt(req.params.id));
    if (index === -1) return res.status(404).json({ error: 'Produit non trouvé', code: 404 });

    const updates = req.body;
    produits[index] = { ...produits[index], ...updates, modifieLe: new Date().toISOString() };
    if (updates.stock !== undefined) produits[index].disponible = updates.stock > 0;

    res.status(200).json({ data: produits[index], message: 'Produit mis à jour' });
  }
);

// ─── DELETE /api/marche/produits/:id ────────────────────────────────────────
router.delete('/produits/:id',
  param('id').isInt({ min: 1 }),
  validate,
  (req, res) => {
    const index = produits.findIndex(p => p.id === parseInt(req.params.id));
    if (index === -1) return res.status(404).json({ error: 'Produit non trouvé', code: 404 });
    const supprimé = produits.splice(index, 1)[0];
    res.status(200).json({ message: `Produit "${supprimé.nom}" supprimé`, id: supprimé.id });
  }
);

// ─── GET /api/marche/stats ───────────────────────────────────────────────────
router.get('/stats', (req, res) => {
  const stats = {
    totalProduits: produits.length,
    disponibles: produits.filter(p => p.disponible).length,
    enRupture: produits.filter(p => !p.disponible).length,
    categories: [...new Set(produits.map(p => p.categorie))].length,
    quartiers: [...new Set(produits.map(p => p.quartier))],
    prixMoyen: Math.round(produits.reduce((s, p) => s + p.prix, 0) / produits.length),
    devise: 'GNF'
  };
  res.status(200).json({ data: stats });
});

module.exports = router;
