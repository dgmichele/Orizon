require('dotenv').config();
// knex.js per la connessione al database e la gestione delle query
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
async function testConnection() {
  try {
    await knex.raw('SELECT 1 + 1 AS result');
    console.log('Connessione al database riuscita!');
  } catch (error) {
    console.error('❌ Errore di connessione al database:', err);
  }
}

testConnection();

module.exports = knex;