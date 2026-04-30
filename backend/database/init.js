const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

const DB_PATH = process.env.DATABASE_PATH || './backend/database/ecotroc.db';

// Initialiser la base de données
function initDatabase() {
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(DB_PATH, (err) => {
      if (err) {
        console.error('Erreur de connexion à la base de données:', err);
        reject(err);
        return;
      }

      const schemaPath = path.join(__dirname, 'schema.sql');
      const schema = fs.readFileSync(schemaPath, 'utf8');

      db.exec(schema, (err) => {
        if (err) {
          console.error('Erreur lors de l\'exécution du schéma:', err);
          reject(err);
          return;
        }
        console.log('✓ Base de données initialisée avec succès');
        db.close();
        resolve();
      });
    });
  });
}

// Obtenir une connexion à la base de données
function getDatabase() {
  return new sqlite3.Database(DB_PATH, (err) => {
    if (err) {
      console.error('Erreur de connexion:', err);
    }
  });
}

module.exports = {
  initDatabase,
  getDatabase,
  DB_PATH
};
