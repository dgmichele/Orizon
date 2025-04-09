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

        const [productId] = await db('products').insert({ nome });

        res.status(201).json({ 
            message: "Prodotto creato con successo", 
            productId 
        });
    } catch (error) {
        console.error("Errore nell'inserimento del prodotto:", error);
        res.status(500).json({ error: "Errore del server" });
    }
});

// Ottenere tutti i prodotti con paginazione (GET /products)
router.get('/', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = 10;
        const offset = (page - 1) * limit;

        // Query principale con paginazione
        const products = await db('products')
            .select('*')
            .limit(limit)
            .offset(offset)
            .orderBy('id', 'asc');

        // Conta totale prodotti per la paginazione
        const totalProducts = await db('products').count('* as count').first();
        const totalPages = Math.ceil(totalProducts.count / limit);

        res.json({
            data: products,
            pagination: {
                currentPage: page,
                totalPages,
                totalItems: totalProducts.count,
                itemsPerPage: limit
            }
        });
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

        const updatedRows = await db('products')
            .where({ id })
            .update({ nome });

        if (updatedRows === 0) {
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

        const deletedRows = await db('products')
            .where({ id })
            .del();

        if (deletedRows === 0) {
            return res.status(404).json({ error: "Prodotto non trovato" });
        }

        res.json({ message: "Prodotto eliminato con successo" });
    } catch (error) {
        console.error("Errore nella cancellazione del prodotto:", error);
        res.status(500).json({ error: "Errore del server" });
    }
});

module.exports = router;