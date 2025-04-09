const app = require('./server');
const PORT = process.env.PORT || 3000;

// Avviamo il server
app.listen(PORT, () => {
  console.log(`✅ Server avviato su http://localhost:${PORT}`);
});