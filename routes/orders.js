const express = require("express");
const pool = require("../db");
const router = express.Router();

// Funzione di utilità per ottenere una connessione e gestire le transazioni
async function getConnection() {
    const connection = await pool.getConnection();
    return connection;
}

// Funzione di utilità per verificare se un ordine esiste
async function checkOrderExists(orderId, connection) {
    const [orderRows] = await connection.query("SELECT id FROM orders WHERE id = ?", [orderId]);
    return orderRows.length > 0;
}

// Creare un nuovo ordine
router.post("/", async (req, res) => {
    const { user_id, products } = req.body;
    if (!user_id || !Array.isArray(products) || products.length === 0) {
        return res.status(400).json({ error: "user_id e products sono richiesti" });
    }

    const connection = await getConnection();
    try {
        await connection.beginTransaction();

        // Verifica utente
        const [userRows] = await connection.query("SELECT id FROM users WHERE id = ?", [user_id]);
        if (userRows.length === 0) throw new Error("Utente non trovato");

        // Verifica prodotti
        const [productRows] = await connection.query("SELECT id FROM products WHERE id IN (?)", [products]);
        if (productRows.length !== products.length) throw new Error("Uno o più prodotti non esistono");

        // Creazione ordine
        const [orderResult] = await connection.query("INSERT INTO orders (data_creazione) VALUES (NOW())");
        const orderId = orderResult.insertId;

        // Associazioni dell'ordine con l'utente e i prodotti
        await connection.query("INSERT INTO order_users (order_id, user_id) VALUES (?, ?)", [orderId, user_id]);
        const orderProductValues = products.map(productId => [orderId, productId]);
        await connection.query("INSERT INTO order_products (order_id, product_id) VALUES ?", [orderProductValues]);

        await connection.commit();
        res.status(201).json({ message: "Ordine creato con successo", orderId });
    } catch (error) {
        await connection.rollback();
        res.status(500).json({ error: error.message });
    } finally {
        connection.release();
    }
});

// Ottenere tutti gli ordini con filtri
router.get("/", async (req, res) => {
    const { data, product_id } = req.query;
    const connection = await getConnection();
    try {
        let query = `
                    SELECT 
                        o.id AS order_id, 
                        o.data_creazione, 
                        u.id AS user_id, 
                        u.nome AS user_nome, 
                        u.cognome AS user_cognome, 
                        u.email AS user_email, 
                        p.id AS product_id, 
                        p.nome AS product_nome
                    FROM orders o
                    LEFT JOIN order_users ou ON o.id = ou.order_id
                    LEFT JOIN users u ON ou.user_id = u.id
                    LEFT JOIN order_products op ON o.id = op.order_id
                    LEFT JOIN products p ON op.product_id = p.id
                `.replace(/\s+/g, ' ').trim(); // Normalizza gli spazi bianchi per evitare problemi di formattazione e migliorare la leggibilità della query
        const queryParams = [];
        const conditions = [];

        if (data) {
            conditions.push("DATE(o.data_creazione) = ?");
            queryParams.push(data);
        }
        if (product_id) {
            conditions.push("o.id IN (SELECT DISTINCT order_id FROM order_products WHERE product_id = ?)");
            queryParams.push(product_id);
        }
        if (conditions.length > 0) query += " WHERE " + conditions.join(" AND ");
        query += " ORDER BY o.data_creazione DESC";

        const [rows] = await connection.query(query, queryParams);
        res.json(rows);
    } catch (error) {
        res.status(500).json({ message: "Errore interno del server" });
    } finally {
        connection.release();
    }
});

// Aggiornare un ordine
router.put("/:id", async (req, res) => {
    const orderId = req.params.id;
    const { utenti, prodotti } = req.body;
    if (!Array.isArray(utenti) || !Array.isArray(prodotti)) {
        return res.status(400).json({ message: "Dati non validi" });
    }

    const connection = await getConnection();
    try {
        await connection.beginTransaction();

        if (!(await checkOrderExists(orderId, connection))) {
            throw new Error("Ordine non trovato");
        }

        await connection.query("DELETE FROM order_users WHERE order_id = ?", [orderId]);
        await connection.query("DELETE FROM order_products WHERE order_id = ?", [orderId]);

        if (utenti.length > 0) {
            await connection.query("INSERT INTO order_users (order_id, user_id) VALUES ?", [utenti.map(userId => [orderId, userId])]);
        }
        if (prodotti.length > 0) {
            await connection.query("INSERT INTO order_products (order_id, product_id) VALUES ?", [prodotti.map(productId => [orderId, productId])]);
        }

        await connection.commit();
        res.json({ message: "Ordine aggiornato con successo" });
    } catch (error) {
        await connection.rollback();
        res.status(500).json({ message: error.message });
    } finally {
        connection.release();
    }
});

// Eliminare un ordine
router.delete("/:id", async (req, res) => {
    const { id } = req.params;
    const connection = await getConnection();
    try {
        if (!(await checkOrderExists(id, connection))) {
            return res.status(404).json({ message: "Ordine non trovato" });
        }
        await connection.query("DELETE FROM order_products WHERE order_id = ?", [id]);
        await connection.query("DELETE FROM order_users WHERE order_id = ?", [id]);
        await connection.query("DELETE FROM orders WHERE id = ?", [id]);
        res.status(200).json({ message: "Ordine eliminato con successo" });
    } catch (error) {
        res.status(500).json({ message: "Errore interno del server" });
    } finally {
        connection.release();
    }
});

module.exports = router;