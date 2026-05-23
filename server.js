const express = require('express');
const cors = require('cors');
const helmet = require('helmet');

const marchéRouter = require('./routes/marche');
const moneyRouter = require('./routes/money');
const ugancRouter = require('./routes/uganc');
const pharmacieRouter = require('./routes/pharmacie');

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());

// Request logger
app.use((req, res, next) => {
  const ts = new Date().toISOString();
  console.log(`[${ts}] ${req.method} ${req.originalUrl}`);
  next();
});

// Routes
app.use('/api/marche', marchéRouter);
app.use('/api/money', moneyRouter);
app.use('/api/uganc', ugancRouter);
app.use('/api/pharmacie', pharmacieRouter);

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    service: 'Guinée API Backend',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    endpoints: ['/api/marche', '/api/money', '/api/uganc', '/api/pharmacie']
  });
});

// 404
app.use((req, res) => {
  res.status(404).json({ error: 'Route non trouvée', code: 404 });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Erreur interne du serveur', code: 500 });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🇬🇳  Guinée API démarrée sur le port ${PORT}`);
});

module.exports = app;
