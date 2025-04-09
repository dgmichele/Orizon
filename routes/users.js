const express = require('express');
const db = require('../db');
const router = express.Router();

// Creare un nuovo utente (POST /users)
router.post('/', async (req, res) => {
  try {
    const { nome, cognome, email } = req.body;
    
    if (!nome || !cognome || !email) {
      return res.status(400).json({ error: "Tutti i campi sono obbligatori" });
    }

    const [userId] = await db('users').insert({
      nome,
      cognome,
      email
    });

    res.status(201).json({ 
      message: "Utente creato con successo", 
      userId 
    });
  } catch (error) {
    console.error("Errore nell'inserimento dell'utente:", error);
    res.status(500).json({ error: "Errore del server" });
  }
});

// Ottenere tutti gli utenti con paginazione (GET /users)
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 2;
    const offset = (page - 1) * limit;

    // Query principale con paginazione
    const users = await db('users')
      .select('*')
      .limit(limit)
      .offset(offset)
      .orderBy('id', 'asc');

    // Conta totale utenti per la paginazione
    const totalUsers = await db('users').count('* as count').first();
    const totalPages = Math.ceil(totalUsers.count / limit);

    res.json({
      data: users,
      pagination: {
        currentPage: page,
        totalPages,
        totalItems: totalUsers.count,
        itemsPerPage: limit
      }
    });
  } catch (error) {
    console.error("Errore nel recupero degli utenti:", error);
    res.status(500).json({ error: "Errore del server" });
  }
});

// Aggiornare un utente (PUT /users/:id)
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { nome, cognome, email } = req.body;

    if (!nome || !cognome || !email) {
      return res.status(400).json({ error: "Tutti i campi sono obbligatori" });
    }

    const updatedRows = await db('users')
      .where({ id })
      .update({ nome, cognome, email });

    if (updatedRows === 0) {
      return res.status(404).json({ error: "Utente non trovato" });
    }

    res.json({ message: "Utente aggiornato con successo" });
  } catch (error) {
    console.error("Errore nell'aggiornamento dell'utente:", error);
    res.status(500).json({ error: "Errore del server" });
  }
});

// Eliminare un utente (DELETE /users/:id)
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const deletedRows = await db('users')
      .where({ id })
      .del();

    if (deletedRows === 0) {
      return res.status(404).json({ error: "Utente non trovato" });
    }

    res.json({ message: "Utente eliminato con successo" });
  } catch (error) {
    console.error("Errore nella cancellazione dell'utente:", error);
    res.status(500).json({ error: "Errore del server" });
  }
});

module.exports = router;