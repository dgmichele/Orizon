const express = require('express');
const db = require('../db');
const router = express.Router();

// Creare un nuovo ordine (POST /orders)
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
            const validProducts = await trx('products') // SELECT id FROM products WHERE id IN (coincide all'array della richiesta es: [1,2,3])
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
            await trx('order_users').insert({ order_id: orderId, user_id }); // Collego l'utente all’ordine
            await trx('order_products').insert(
                products.map(productId => ({ order_id: orderId, product_id: productId })) // Collego ogni prodotto all’ordine
            );

            return orderId; // Ritorno l'ID dell'ordine per poterlo usare fuori (nella risposta)
        });

        res.status(201).json({ 
            message: "Ordine creato con successo", 
            orderId 
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Ottenere tutti gli ordini con filtri e paginazione (GET /orders)
router.get("/", async (req, res) => {
    try {
        const { data, product_id, page = 1 } = req.query;
        const limit = 10;
        const offset = (page - 1) * limit;

        // Funzione per applicare i filtri comuni
        const applyFilters = (query) => {
            // Filtra gli ordini in base alla data di creazione
            if (data) {
                query.whereRaw('DATE(o.data_creazione) = ?', [data]);
            }
            
            // Filtra gli ordini che hanno il prodotto specificato
            if (product_id) {
                query.whereExists(
                    db.select('*')
                        .from('order_products')
                        .whereRaw('order_products.order_id = o.id')
                        .where('product_id', product_id)
                );
            }
            
            return query;
        };

        // Costruisci la query di base
        let ordersQuery = db('orders as o')
            .leftJoin('order_users as ou', 'o.id', 'ou.order_id')  // LEFT JOIN order_users ou ON o.id = ou.order_id
            .leftJoin('users as u', 'ou.user_id', 'u.id') // LEFT JOIN users u ON ou.user_id = u.id
            .leftJoin('order_products as op', 'o.id', 'op.order_id') // LEFT JOIN order_products op ON o.id = op.order_id
            .leftJoin('products as p', 'op.product_id', 'p.id') // LEFT JOIN products p ON op.product_id = p.id
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
            .orderBy('o.data_creazione', 'desc');
        
        // Applica i filtri comuni
        ordersQuery = applyFilters(ordersQuery);
        
        // Filtro aggiuntivo specifico per la query di selezione
        if (product_id) {
            ordersQuery.andWhere('p.id', product_id);
        }

        // Query per contare il totale degli ordini
        let countQuery = db('orders as o').countDistinct('o.id as count');
        
        // Applica gli stessi filtri alla query di conteggio
        countQuery = applyFilters(countQuery);

        // Esegui entrambe le query in parallelo
        const [orders, totalResult] = await Promise.all([
            ordersQuery.limit(limit).offset(offset),
            countQuery.first()
        ]);

        // Calcola informazioni di paginazione
        const total = totalResult.count;
        const totalPages = Math.ceil(total / limit);

        // Controlla se ci sono ordini
        if (orders.length === 0) {
            return res.status(404).send("Nessun ordine trovato");
        }

        res.json({
            data: orders,
            pagination: {
                currentPage: Number(page),
                totalPages,
                totalItems: total,
                itemsPerPage: limit
            }
        });
    } catch (error) {
        console.error(error);
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

            await trx('order_products').where('order_id', id).del(); // DELETE FROM order_products WHERE order_id = id
            await trx('order_users').where('order_id', id).del();
            await trx('orders').where('id', id).del();
        });

        res.status(200).json({ message: "Ordine eliminato con successo" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;