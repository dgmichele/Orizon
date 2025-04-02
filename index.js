const app = require('./server');
const PORT = process.env.PORT || 3000; // Usa la porta definita nel file .env, altrimenti 3000

// Test della connessione al database
async function testConnection() {
  try {
      const [rows] = await require('./db').query('SELECT 1 + 1 AS result');
      console.log('Connessione al database riuscita! Test query:', rows[0].result);
  } catch (error) {
      console.error('❌ Errore di connessione al database:', error);
  }
}

testConnection();

// Avviamo il server
app.listen(PORT, () => {
  console.log(`✅ Server avviato su http://localhost:${PORT}`);
});