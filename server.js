const express = require('express'); // Importa Express
const app = express(); // Crea l'applicazione Express
const usersRoutes = require('./routes/users'); // Importa le route degli utenti
const productsRoutes = require('./routes/products'); // Importa le route dei prodotti
const orderRoutes = require('./routes/orders'); // Importa le route degli ordini

// Middleware
app.use(express.json()); // Permette di leggere il body delle richieste in formato JSON
app.use('/users', usersRoutes); // Usa il router degli utenti
app.use('/products', productsRoutes); // Usa il router dei prodotti
app.use('/orders', orderRoutes); // Usa il router degli ordini

// Route di prova
app.get('/', (req, res) => {
  res.send('Benvenuto in Orizon!');
});

// Esportiamo l'app senza avviare il server
module.exports = app;