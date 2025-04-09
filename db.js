require('dotenv').config();
const knex = require('knex')({
  client: 'mysql2',
  connection: {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
  },
  pool: { min: 0, max: 7 }
});

// Test della connessione
knex.raw('SELECT 1 + 1 AS result')
  .then(() => console.log('Connessione al database riuscita con Knex!'))
  .catch(err => console.error('❌ Errore di connessione al database:', err));

module.exports = knex;