const express = require('express');
const db = require('../db'); 
const router = express.Router();

// Creare un nuovo prodotto (POST /products)
router.post('/', async (req, res) => {
    try {
        const { nome } = req.body;

        if (!nome) {
            return res.status(400).json({ error: "Devi inserire un nome" });
        }

        const query = "INSERT INTO products (nome) VALUES (?)";
        const [result] = await db.execute(query, [nome]);

        res.status(201).json({ message: "Prodotto creato con successo", productId: result.insertId });
    } catch (error) {
        console.error("Errore nell'inserimento del prodotto:", error);
        res.status(500).json({ error: "Errore del server" });
    }
});

// Ottenere tutti i prodotti (GET /products)
router.get('/', async (req, res) => {
    try {
        const [rows] = await db.execute("SELECT * FROM products");
        res.json(rows);
    } catch (error) {
        console.error("Errore nel recupero dei prodotti:", error);
        res.status(500).json({ error: "Errore del server" });
    }
});

// Aggiornare un prodotto (PUT /products/:id)
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { nome } = req.body;

        if (!nome) {
            return res.status(400).json({ error: "Inserisci un nome per la modifica" });
        }

        const query = "UPDATE products SET nome = ? WHERE id = ?";
        const [result] = await db.execute(query, [nome, id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: "Prodotto non trovato" });
        }

        res.json({ message: "Prodotto aggiornato con successo" });
    } catch (error) {
        console.error("Errore nell'aggiornamento del prodotto:", error);
        res.status(500).json({ error: "Errore del server" });
    }
});

// Eliminare un prodotto (DELETE /products/:id)
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const query = "DELETE FROM products WHERE id = ?";
        const [result] = await db.execute(query, [id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: "Prodotto non trovato" });
        }

        res.json({ message: "Prodotto eliminato con successo" });
    } catch (error) {
        console.error("Errore nella cancellazione del prodotto:", error);
        res.status(500).json({ error: "Errore del server" });
    }
});

module.exports = router;