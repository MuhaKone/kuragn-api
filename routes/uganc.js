const express = require('express');
const router = express.Router();
const { body, param } = require('express-validator');
const { validate } = require('../middleware/validators');

// ─── In-memory data ───────────────────────────────────────────────────────────
let etudiants = [
  { id: 'ETU-001', nom: 'Diallo', prenom: 'Mamadou', email: 'mamadou.diallo@uganc.edu.gn', telephone: '620111001', filiere: 'Informatique', niveau: 'L2', anneeInscription: 2023, statut: 'actif', notesMoyenne: 14.5 },
  { id: 'ETU-002', nom: 'Bah', prenom: 'Fatoumata', email: 'fatoumata.bah@uganc.edu.gn', telephone: '621222002', filiere: 'Médecine', niveau: 'M1', anneeInscription: 2022, statut: 'actif', notesMoyenne: 16.2 },
  { id: 'ETU-003', nom: 'Condé', prenom: 'Sékou', email: 'sekou.conde@uganc.edu.gn', telephone: '622333003', filiere: 'Droit', niveau: 'L3', anneeInscription: 2022, statut: 'actif', notesMoyenne: 12.8 },
  { id: 'ETU-004', nom: 'Camara', prenom: 'Aissatou', email: 'aissatou.camara@uganc.edu.gn', telephone: '623444004', filiere: 'Économie', niveau: 'L1', anneeInscription: 2024, statut: 'actif', notesMoyenne: null },
];

let notes = [
  { id: 1, etudiantId: 'ETU-001', matiere: 'Algorithmes', note: 15, coefficient: 3, semestre: 'S3', annee: '2023-2024' },
  { id: 2, etudiantId: 'ETU-001', matiere: 'Bases de données', note: 14, coefficient: 3, semestre: 'S3', annee: '2023-2024' },
  { id: 3, etudiantId: 'ETU-001', matiere: 'Réseaux', note: 13, coefficient: 2, semestre: 'S3', annee: '2023-2024' },
  { id: 4, etudiantId: 'ETU-002', matiere: 'Anatomie', note: 17, coefficient: 4, semestre: 'S1', annee: '2023-2024' },
  { id: 5, etudiantId: 'ETU-002', matiere: 'Physiologie', note: 15.5, coefficient: 4, semestre: 'S1', annee: '2023-2024' },
  { id: 6, etudiantId: 'ETU-003', matiere: 'Droit civil', note: 12, coefficient: 3, semestre: 'S5', annee: '2023-2024' },
];

let filieres = [
  { id: 1, nom: 'Informatique', departement: 'Sciences et Technologies', niveaux: ['L1','L2','L3','M1','M2'] },
  { id: 2, nom: 'Médecine', departement: 'Sciences de la Santé', niveaux: ['PCEM1','PCEM2','D1','D2','D3','D4','Internat'] },
  { id: 3, nom: 'Droit', departement: 'Sciences Juridiques', niveaux: ['L1','L2','L3','M1','M2'] },
  { id: 4, nom: 'Économie', departement: 'Sciences Économiques', niveaux: ['L1','L2','L3','M1','M2'] },
  { id: 5, nom: 'Pharmacie', departement: 'Sciences de la Santé', niveaux: ['P1','P2','P3','P4','P5'] },
];

let etuCounter = 5;
let noteCounter = notes.length + 1;

const calculerMoyenne = (notesEtudiant) => {
  if (!notesEtudiant.length) return null;
  const totalPoints = notesEtudiant.reduce((s, n) => s + n.note * n.coefficient, 0);
  const totalCoeff = notesEtudiant.reduce((s, n) => s + n.coefficient, 0);
  return Math.round((totalPoints / totalCoeff) * 100) / 100;
};

// ─── GET /api/uganc/filieres ──────────────────────────────────────────────────
router.get('/filieres', (req, res) => {
  res.status(200).json({ data: filieres, total: filieres.length });
});

// ─── GET /api/uganc/etudiants ─────────────────────────────────────────────────
router.get('/etudiants', (req, res) => {
  let result = [...etudiants];
  const { filiere, niveau, statut } = req.query;
  if (filiere) result = result.filter(e => e.filiere.toLowerCase() === filiere.toLowerCase());
  if (niveau) result = result.filter(e => e.niveau === niveau);
  if (statut) result = result.filter(e => e.statut === statut);
  res.status(200).json({ data: result, total: result.length });
});

// ─── POST /api/uganc/etudiants ────────────────────────────────────────────────
router.post('/etudiants',
  body('nom').notEmpty().withMessage('Nom requis'),
  body('prenom').notEmpty().withMessage('Prénom requis'),
  body('email').isEmail().withMessage('Email valide requis'),
  body('telephone').matches(/^(620|621|622|623|624|625|626|627|628|629|655|656|657|658|659|660|661|662)\d{6}$/).withMessage('Numéro guinéen invalide'),
  body('filiere').notEmpty().withMessage('Filière requise'),
  body('niveau').notEmpty().withMessage('Niveau requis'),
  validate,
  (req, res) => {
    const { nom, prenom, email, telephone, filiere, niveau } = req.body;

    const emailExistant = etudiants.find(e => e.email === email);
    if (emailExistant) return res.status(409).json({ error: 'Email déjà utilisé', code: 409 });

    const filiereValide = filieres.find(f => f.nom.toLowerCase() === filiere.toLowerCase());
    if (!filiereValide) return res.status(400).json({ error: `Filière "${filiere}" inexistante à l'UGANC`, code: 400 });

    const nouvelEtudiant = {
      id: `ETU-${String(etuCounter++).padStart(3, '0')}`,
      nom, prenom, email, telephone,
      filiere: filiereValide.nom,
      niveau, statut: 'actif',
      anneeInscription: new Date().getFullYear(),
      notesMoyenne: null,
      inscritLe: new Date().toISOString()
    };
    etudiants.push(nouvelEtudiant);
    res.status(201).json({ data: nouvelEtudiant, message: `${prenom} ${nom} inscrit(e) avec succès à l'UGANC` });
  }
);

// ─── GET /api/uganc/etudiants/:id ─────────────────────────────────────────────
router.get('/etudiants/:id', (req, res) => {
  const etudiant = etudiants.find(e => e.id === req.params.id);
  if (!etudiant) return res.status(404).json({ error: 'Étudiant non trouvé', code: 404 });
  res.status(200).json({ data: etudiant });
});

// ─── PUT /api/uganc/etudiants/:id ─────────────────────────────────────────────
router.put('/etudiants/:id',
  body('email').optional().isEmail(),
  body('telephone').optional().matches(/^(620|621|622|623|624|625|626|627|628|629|655|656|657|658|659|660|661|662)\d{6}$/),
  validate,
  (req, res) => {
    const index = etudiants.findIndex(e => e.id === req.params.id);
    if (index === -1) return res.status(404).json({ error: 'Étudiant non trouvé', code: 404 });

    const champsInterdits = ['id', 'anneeInscription', 'inscritLe'];
    const updates = Object.fromEntries(
      Object.entries(req.body).filter(([k]) => !champsInterdits.includes(k))
    );
    etudiants[index] = { ...etudiants[index], ...updates, modifieLe: new Date().toISOString() };
    res.status(200).json({ data: etudiants[index], message: 'Dossier mis à jour' });
  }
);

// ─── GET /api/uganc/etudiants/:id/notes ──────────────────────────────────────
router.get('/etudiants/:id/notes', (req, res) => {
  const etudiant = etudiants.find(e => e.id === req.params.id);
  if (!etudiant) return res.status(404).json({ error: 'Étudiant non trouvé', code: 404 });

  const notesEtu = notes.filter(n => n.etudiantId === req.params.id);
  const moyenne = calculerMoyenne(notesEtu);

  const mention = moyenne === null ? 'N/A' :
    moyenne >= 16 ? 'Très Bien' :
    moyenne >= 14 ? 'Bien' :
    moyenne >= 12 ? 'Assez Bien' :
    moyenne >= 10 ? 'Passable' : 'Insuffisant';

  res.status(200).json({
    data: {
      etudiant: { id: etudiant.id, nom: `${etudiant.prenom} ${etudiant.nom}`, filiere: etudiant.filiere },
      notes: notesEtu,
      moyenne,
      mention,
      admis: moyenne !== null && moyenne >= 10
    }
  });
});

// ─── POST /api/uganc/etudiants/:id/notes ─────────────────────────────────────
router.post('/etudiants/:id/notes',
  body('matiere').notEmpty().withMessage('Matière requise'),
  body('note').isFloat({ min: 0, max: 20 }).withMessage('Note entre 0 et 20'),
  body('coefficient').isInt({ min: 1, max: 6 }).withMessage('Coefficient entre 1 et 6'),
  body('semestre').notEmpty().withMessage('Semestre requis'),
  validate,
  (req, res) => {
    const etudiant = etudiants.find(e => e.id === req.params.id);
    if (!etudiant) return res.status(404).json({ error: 'Étudiant non trouvé', code: 404 });

    const { matiere, note, coefficient, semestre, annee = '2024-2025' } = req.body;
    const nouvelleNote = { id: noteCounter++, etudiantId: req.params.id, matiere, note, coefficient, semestre, annee };
    notes.push(nouvelleNote);

    // Update student average
    const toutesNotes = notes.filter(n => n.etudiantId === req.params.id);
    const index = etudiants.findIndex(e => e.id === req.params.id);
    etudiants[index].notesMoyenne = calculerMoyenne(toutesNotes);

    res.status(201).json({ data: nouvelleNote, message: 'Note ajoutée' });
  }
);

// ─── GET /api/uganc/stats ─────────────────────────────────────────────────────
router.get('/stats', (req, res) => {
  const total = etudiants.length;
  const actifs = etudiants.filter(e => e.statut === 'actif').length;
  const parFiliere = filieres.map(f => ({
    filiere: f.nom,
    count: etudiants.filter(e => e.filiere === f.nom).length
  }));
  res.status(200).json({ data: { total, actifs, parFiliere } });
});

module.exports = router;
