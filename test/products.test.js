const request = require('supertest');
const app = require('../server');

// Mock del modulo db
jest.mock('../db', () => ({
  execute: jest.fn(),
  query: jest.fn()
}));

const pool = require('../db');

describe('Products API', () => {
  // Resetta i mock prima di ogni test
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /products', () => {
    test('dovrebbe restituire tutti i prodotti', async () => {
      // Mock della risposta del database
      const mockProducts = [
        { id: 1, nome: 'Prodotto 1' },
        { id: 2, nome: 'Prodotto 2' }
      ];
      
      // Configurazione del mock
      pool.execute.mockResolvedValue([mockProducts]);

      // Esecuzione della richiesta
      const response = await request(app)
        .get('/products')
        .expect('Content-Type', /json/)
        .expect(200);

      // Verifica che pool.execute sia stato chiamato correttamente
      expect(pool.execute).toHaveBeenCalledWith("SELECT * FROM products");
      
      // Verifica della risposta
      expect(response.body).toEqual(mockProducts);
    });
  });

  describe('POST /products', () => {
    test('dovrebbe creare un nuovo prodotto', async () => {
      // Mock della risposta del database
      const mockResult = { insertId: 1 };
      pool.execute.mockResolvedValue([mockResult]);

      // Dati del prodotto da creare
      const newProduct = { nome: 'Nuovo Prodotto' };

      // Esecuzione della richiesta
      const response = await request(app)
        .post('/products')
        .send(newProduct)
        .expect('Content-Type', /json/)
        .expect(201);

      // Verifica che pool.execute sia stato chiamato correttamente
      expect(pool.execute).toHaveBeenCalledWith("INSERT INTO products (nome) VALUES (?)", ['Nuovo Prodotto']);
      
      // Verifica della risposta
      expect(response.body).toHaveProperty('message', 'Prodotto creato con successo');
      expect(response.body).toHaveProperty('productId', 1);
    });
  });

  describe('PUT /products/:id', () => {
    test('dovrebbe aggiornare un prodotto esistente', async () => {
      // Mock della risposta del database
      const mockResult = { affectedRows: 1 };
      pool.execute.mockResolvedValue([mockResult]);

      // Dati per l'aggiornamento
      const updatedProduct = { nome: 'Prodotto Aggiornato' };
      const productId = 1;

      // Esecuzione della richiesta
      const response = await request(app)
        .put(`/products/${productId}`)
        .send(updatedProduct)
        .expect('Content-Type', /json/)
        .expect(200);

      // Verifica che pool.execute sia stato chiamato correttamente
      expect(pool.execute).toHaveBeenCalledWith("UPDATE products SET nome = ? WHERE id = ?", 
        ['Prodotto Aggiornato', '1']);
      
      // Verifica della risposta
      expect(response.body).toHaveProperty('message', 'Prodotto aggiornato con successo');
    });
  });

  describe('DELETE /products/:id', () => {
    test('dovrebbe eliminare un prodotto esistente', async () => {
      // Mock della risposta del database
      const mockResult = { affectedRows: 1 };
      pool.execute.mockResolvedValue([mockResult]);

      const productId = 1;

      // Esecuzione della richiesta
      const response = await request(app)
        .delete(`/products/${productId}`)
        .expect('Content-Type', /json/)
        .expect(200);

      // Verifica che pool.execute sia stato chiamato correttamente
      expect(pool.execute).toHaveBeenCalledWith("DELETE FROM products WHERE id = ?", ['1']);
      
      // Verifica della risposta
      expect(response.body).toHaveProperty('message', 'Prodotto eliminato con successo');
    });
  });
});