const express = require("express");
const db = require("../db");
const router = express.Router();

// Creare un nuovo ordine
router.post("/", async (req, res) => {
    const { user_id, products } = req.body;
    if (!user_id || !Array.isArray(products) || products.length === 0) {
        return res.status(400).json({ error: "user_id e products sono richiesti" });
    }

    try {
        const orderId = await db.transaction(async trx => {
            // Verifica utente
            const userExists = await trx('users').where('id', user_id).first();
            if (!userExists) throw new Error("Utente non trovato");

            // Verifica prodotti
            const validProducts = await trx('products')
                .whereIn('id', products)
                .select('id');
                
            if (validProducts.length !== products.length) {
                throw new Error("Uno o più prodotti non esistono");
            }

            // Creazione ordine
            const [orderId] = await trx('orders').insert({ 
                data_creazione: db.fn.now() 
            });

            // Associazioni
            await trx('order_users').insert({ order_id: orderId, user_id });
            await trx('order_products').insert(
                products.map(productId => ({ order_id: orderId, product_id: productId }))
            );

            return orderId;
        });

        res.status(201).json({ 
            message: "Ordine creato con successo", 
            orderId 
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Ottenere tutti gli ordini con filtri e paginazione
router.get("/", async (req, res) => {
    try {
        const { data, product_id, page = 1 } = req.query;
        const limit = 10;
        const offset = (page - 1) * limit;

        const query = db('orders as o')
            .leftJoin('order_users as ou', 'o.id', 'ou.order_id')
            .leftJoin('users as u', 'ou.user_id', 'u.id')
            .leftJoin('order_products as op', 'o.id', 'op.order_id')
            .leftJoin('products as p', 'op.product_id', 'p.id')
            .select(
                'o.id as order_id',
                'o.data_creazione',
                'u.id as user_id',
                'u.nome as user_nome',
                'u.cognome as user_cognome',
                'u.email as user_email',
                'p.id as product_id',
                'p.nome as product_nome'
            )
            .orderBy('o.data_creazione', 'desc')
            .limit(limit)
            .offset(offset);

        if (data) {
            query.whereRaw('DATE(o.data_creazione) = ?', [data]);
        }

        if (product_id) {
            query.whereExists(
                db.select('*')
                    .from('order_products')
                    .whereRaw('order_products.order_id = o.id')
                    .where('product_id', product_id)
            );
        }

        const orders = await query;
        
        // Conta totale ordini
        const countQuery = db('orders').count('* as count').first();
        if (data || product_id) {
            countQuery.modify(q => {
                if (data) q.whereRaw('DATE(data_creazione) = ?', [data]);
                if (product_id) {
                    q.whereExists(
                        db.select('*')
                            .from('order_products')
                            .whereRaw('order_products.order_id = orders.id')
                            .where('product_id', product_id)
                    );
                }
            });
        }
        
        const total = await countQuery;
        const totalPages = Math.ceil(total.count / limit);

        res.json({
            data: orders,
            pagination: {
                currentPage: Number(page),
                totalPages,
                totalItems: total.count,
                itemsPerPage: limit
            }
        });
    } catch (error) {
        res.status(500).json({ message: "Errore interno del server" });
    }
});

// Aggiornare un ordine
router.put("/:id", async (req, res) => {
    const orderId = req.params.id;
    const { utenti, prodotti } = req.body;
    
    if (!Array.isArray(utenti) || !Array.isArray(prodotti)) {
        return res.status(400).json({ message: "Dati non validi" });
    }

    try {
        await db.transaction(async trx => {
            const orderExists = await trx('orders').where('id', orderId).first();
            if (!orderExists) throw new Error("Ordine non trovato");

            // Elimina e ricrea associazioni
            await trx('order_users').where('order_id', orderId).del();
            await trx('order_products').where('order_id', orderId).del();

            if (utenti.length > 0) {
                await trx('order_users').insert(
                    utenti.map(userId => ({ order_id: orderId, user_id: userId }))
            )}

            if (prodotti.length > 0) {
                await trx('order_products').insert(
                    prodotti.map(productId => ({ order_id: orderId, product_id: productId }))
             )}
        });

        res.json({ message: "Ordine aggiornato con successo" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Eliminare un ordine
router.delete("/:id", async (req, res) => {
    const { id } = req.params;

    try {
        await db.transaction(async trx => {
            const orderExists = await trx('orders').where('id', id).first();
            if (!orderExists) throw new Error("Ordine non trovato");

            await trx('order_products').where('order_id', id).del();
            await trx('order_users').where('order_id', id).del();
            await trx('orders').where('id', id).del();
        });

        res.status(200).json({ message: "Ordine eliminato con successo" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;