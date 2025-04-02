const request = require('supertest');
const express = require('express');
const ordersRouter = require('../routes/orders');

// Mock delle funzioni di utilità
jest.mock('../db', () => {
  // Creiamo un mock query standard
  const mockQuery = jest.fn();
  
  // Creiamo un mock connection che include tutti i metodi necessari
  const mockConnection = {
    query: mockQuery,
    beginTransaction: jest.fn().mockResolvedValue(true),
    commit: jest.fn().mockResolvedValue(true),
    rollback: jest.fn().mockResolvedValue(true),
    release: jest.fn().mockResolvedValue(true)
  };
  
  return {
    getConnection: jest.fn().mockResolvedValue(mockConnection)
  };
});

const pool = require('../db');

// Creazione dell'app Express per i test
const app = express();
app.use(express.json());
app.use('/orders', ordersRouter);

describe('Orders API', () => {
  beforeEach(() => {
    // Reset dei mock prima di ogni test
    jest.clearAllMocks();
  });

  // Test per la creazione di un nuovo ordine
  describe('POST /orders', () => {
    test('dovrebbe creare un nuovo ordine con successo', async () => {
      // Mock delle risposte del database
      const mockConnection = await pool.getConnection();
      
      // Mock per verificare l'utente
      mockConnection.query
        .mockResolvedValueOnce([[{ id: 1 }]]) // Utente trovato
        .mockResolvedValueOnce([[{ id: 1 }, { id: 2 }]]) // Prodotti trovati
        .mockResolvedValueOnce([{ insertId: 123 }]) // Inserimento ordine
        .mockResolvedValueOnce([{}]) // Associazione utente
        .mockResolvedValueOnce([{}]); // Associazione prodotti

      // Dati per la richiesta
      const orderData = {
        user_id: 1,
        products: [1, 2]
      };

      // Esecuzione della richiesta
      const response = await request(app)
        .post('/orders')
        .send(orderData)
        .expect(201);

      // Verifica della risposta
      expect(response.body).toEqual({
        message: 'Ordine creato con successo',
        orderId: 123
      });

      // Verifica che le query siano state chiamate con i parametri corretti
      expect(mockConnection.beginTransaction).toHaveBeenCalled();
      expect(mockConnection.query).toHaveBeenNthCalledWith(1, "SELECT id FROM users WHERE id = ?", [1]);
      expect(mockConnection.query).toHaveBeenNthCalledWith(2, "SELECT id FROM products WHERE id IN (?)", [[1, 2]]);
      expect(mockConnection.query).toHaveBeenNthCalledWith(3, "INSERT INTO orders (data_creazione) VALUES (NOW())");
      expect(mockConnection.query).toHaveBeenNthCalledWith(4, "INSERT INTO order_users (order_id, user_id) VALUES (?, ?)", [123, 1]);
      expect(mockConnection.query).toHaveBeenNthCalledWith(5, "INSERT INTO order_products (order_id, product_id) VALUES ?", [[[123, 1], [123, 2]]]);
      expect(mockConnection.commit).toHaveBeenCalled();
      expect(mockConnection.release).toHaveBeenCalled();
    });
  });

  // Test per ottenere gli ordini
  describe('GET /orders', () => {
    test('dovrebbe recuperare tutti gli ordini con successo', async () => {
      // Mock della risposta del database
      const mockConnection = await pool.getConnection();
      const mockOrdersData = [
        {
          order_id: 1,
          data_creazione: '2025-03-30T10:00:00Z',
          user_id: 1,
          user_nome: 'Mario',
          user_cognome: 'Rossi',
          user_email: 'mario@example.com',
          product_id: 101,
          product_nome: 'Prodotto A'
        },
        {
          order_id: 1,
          data_creazione: '2025-03-30T10:00:00Z',
          user_id: 1,
          user_nome: 'Mario',
          user_cognome: 'Rossi',
          user_email: 'mario@example.com',
          product_id: 102,
          product_nome: 'Prodotto B'
        }
      ];

      mockConnection.query.mockResolvedValueOnce([mockOrdersData]);

      // Esecuzione della richiesta
      const response = await request(app)
        .get('/orders')
        .expect(200);

      // Verifica che la query sia stata chiamata
      const expectedQueryPart = "SELECT o.id AS order_id, o.data_creazione, u.id AS user_id, u.nome AS user_nome, u.cognome AS user_cognome, u.email AS user_email, p.id AS product_id, p.nome AS product_nome FROM orders o LEFT JOIN";
      expect(mockConnection.query).toHaveBeenCalledWith(
        expect.stringContaining(expectedQueryPart),
        []
      );
      
      // Verifica della risposta
      expect(response.body).toEqual(mockOrdersData);
      expect(mockConnection.release).toHaveBeenCalled();
    });

    test('dovrebbe filtrare gli ordini per data con successo', async () => {
      // Mock della risposta del database con filtro per data
      const mockConnection = await pool.getConnection();
      mockConnection.query.mockResolvedValueOnce([[
        {
          order_id: 2,
          data_creazione: '2025-03-31T10:00:00Z',
          user_id: 2,
          user_nome: 'Luigi',
          user_cognome: 'Verdi',
          user_email: 'luigi@example.com',
          product_id: 201,
          product_nome: 'Prodotto C'
        }
      ]]);

      // Data per il filtro
      const filterDate = '2025-03-31';

      // Esecuzione della richiesta
      await request(app)
        .get(`/orders?data=${filterDate}`)
        .expect(200);

      // Verifica che la query sia stata chiamata con i parametri corretti
      expect(mockConnection.query).toHaveBeenCalledWith(
        expect.stringContaining("WHERE DATE(o.data_creazione) = ?"),
        [filterDate]
      );
      expect(mockConnection.release).toHaveBeenCalled();
    });
  });

  // Test per l'aggiornamento di un ordine
  describe('PUT /orders/:id', () => {
    test('dovrebbe aggiornare un ordine con successo', async () => {
      // Mock delle risposte del database
      const mockConnection = await pool.getConnection();
      mockConnection.query
        .mockResolvedValueOnce([[{ id: 5 }]]) // Ordine trovato (checkOrderExists)
        .mockResolvedValueOnce([{}]) // DELETE FROM order_users
        .mockResolvedValueOnce([{}]) // DELETE FROM order_products
        .mockResolvedValueOnce([{}]) // INSERT INTO order_users
        .mockResolvedValueOnce([{}]); // INSERT INTO order_products

      // Dati per l'aggiornamento
      const updateData = {
        utenti: [3],
        prodotti: [301, 302]
      };

      // Esecuzione della richiesta
      const response = await request(app)
        .put('/orders/5')
        .send(updateData)
        .expect(200);

      // Verifica della risposta
      expect(response.body).toEqual({
        message: 'Ordine aggiornato con successo'
      });

      // Verifica che le query siano state chiamate con i parametri corretti
      expect(mockConnection.beginTransaction).toHaveBeenCalled();
      expect(mockConnection.query).toHaveBeenNthCalledWith(1, "SELECT id FROM orders WHERE id = ?", ["5"]);
      expect(mockConnection.query).toHaveBeenNthCalledWith(2, "DELETE FROM order_users WHERE order_id = ?", ["5"]);
      expect(mockConnection.query).toHaveBeenNthCalledWith(3, "DELETE FROM order_products WHERE order_id = ?", ["5"]);
      expect(mockConnection.query).toHaveBeenNthCalledWith(4, "INSERT INTO order_users (order_id, user_id) VALUES ?", [updateData.utenti.map(userId => ["5", userId])]);
      expect(mockConnection.query).toHaveBeenNthCalledWith(5, "INSERT INTO order_products (order_id, product_id) VALUES ?", [updateData.prodotti.map(productId => ["5", productId])]);
      expect(mockConnection.commit).toHaveBeenCalled();
      expect(mockConnection.release).toHaveBeenCalled();
    });
  });

  // Test per l'eliminazione di un ordine
  describe('DELETE /orders/:id', () => {
    test('dovrebbe eliminare un ordine con successo', async () => {
      // Mock delle risposte del database
      const mockConnection = await pool.getConnection();
      mockConnection.query
        .mockResolvedValueOnce([[{ id: 10 }]]) // Ordine trovato (checkOrderExists)
        .mockResolvedValueOnce([{}]) // DELETE FROM order_products
        .mockResolvedValueOnce([{}]) // DELETE FROM order_users
        .mockResolvedValueOnce([{}]); // DELETE FROM orders

      // Esecuzione della richiesta
      const response = await request(app)
        .delete('/orders/10')
        .expect(200);

      // Verifica della risposta
      expect(response.body).toEqual({
        message: 'Ordine eliminato con successo'
      });

      // Verifica che le query siano state chiamate con i parametri corretti
      expect(mockConnection.query).toHaveBeenNthCalledWith(1, "SELECT id FROM orders WHERE id = ?", ["10"]);
      expect(mockConnection.query).toHaveBeenNthCalledWith(2, "DELETE FROM order_products WHERE order_id = ?", ["10"]);
      expect(mockConnection.query).toHaveBeenNthCalledWith(3, "DELETE FROM order_users WHERE order_id = ?", ["10"]);
      expect(mockConnection.query).toHaveBeenNthCalledWith(4, "DELETE FROM orders WHERE id = ?", ["10"]);
      expect(mockConnection.release).toHaveBeenCalled();
    });
  });
});