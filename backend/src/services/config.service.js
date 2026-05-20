const prisma = require('../utils/prisma');
const fs = require('fs');
const path = require('path');

const CONFIG_FILE = path.join(__dirname, '../../config.json');

function leerConfig() {
  if (!fs.existsSync(CONFIG_FILE)) {
    const defaults = {
      nombreTaller: 'VELTRA',
      slogan: 'Taller Mecánico',
      telefono: '',
      email: '',
      direccion: '',
      ruc: '',
      moneda: 'USD',
      impuestoPct: 0,
      stockMinimoDefecto: 5,
      diasGarantiaDefault: 30,
    };
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(defaults, null, 2));
    return defaults;
  }
  const cfg = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
  // Normalizar campos legacy
  if (!cfg.moneda || cfg.moneda.length <= 2) cfg.moneda = 'USD';
  if (cfg.ivaPorcentaje !== undefined && cfg.impuestoPct === undefined) {
    cfg.impuestoPct = cfg.ivaPorcentaje;
  }
  return cfg;
}

async function getConfig(req, res) {
  res.json(leerConfig());
}

async function updateConfig(req, res) {
  const actual = leerConfig();
  const nueva = { ...actual, ...req.body };
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(nueva, null, 2));
  res.json(nueva);
}

module.exports = { getConfig, updateConfig };
