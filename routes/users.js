const express = require('express');
const db = require('../db'); // Importa il database
const router = express.Router();

// Creare un nuovo utente (POST /users)
router.post('/', async (req, res) => {
    try {
        const { nome, cognome, email } = req.body;

        if (!nome || !cognome || !email) {
            return res.status(400).json({ error: "Tutti i campi sono obbligatori" });
        }

        const query = "INSERT INTO users (nome, cognome, email) VALUES (?, ?, ?)";
        const [result] = await db.execute(query, [nome, cognome, email]);

        res.status(201).json({ message: "Utente creato con successo", userId: result.insertId });
    } catch (error) {
        console.error("Errore nell'inserimento dell'utente:", error);
        res.status(500).json({ error: "Errore del server" });
    }
});

// Ottenere tutti gli utenti (GET /users)
router.get('/', async (req, res) => {
    try {
        const [rows] = await db.execute("SELECT * FROM users"); // prendiamo solo il primo array che contiene gli utenti
        res.json(rows);
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

        const query = "UPDATE users SET nome = ?, cognome = ?, email = ? WHERE id = ?";
        const [result] = await db.execute(query, [nome, cognome, email, id]);

        if (result.affectedRows === 0) {
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

        const query = "DELETE FROM users WHERE id = ?";
        const [result] = await db.execute(query, [id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: "Utente non trovato" });
        }

        res.json({ message: "Utente eliminato con successo" });
    } catch (error) {
        console.error("Errore nella cancellazione dell'utente:", error);
        res.status(500).json({ error: "Errore del server" });
    }
});

module.exports = router;