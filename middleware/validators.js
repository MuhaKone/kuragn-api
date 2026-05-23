const { validationResult } = require('express-validator');

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Données invalides',
      code: 400,
      details: errors.array().map(e => ({ champ: e.path, message: e.msg }))
    });
  }
  next();
};

// Simple token auth simulation
const authMiddleware = (req, res, next) => {
  const token = req.headers['authorization'];
  if (!token || !token.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token manquant ou invalide', code: 401 });
  }
  // In production: verify JWT here
  req.user = { id: 1, role: 'user' };
  next();
};

module.exports = { validate, authMiddleware };
