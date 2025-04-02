const request = require('supertest');
const app = require('../server');

// Preparazione del mock
jest.mock('../db', () => {
    return {
        execute: jest.fn(),
        query: jest.fn(),
    };
});

describe('Users API', () => {
    let pool;

    beforeEach(() => {
        // Riottieni il modulo mockato prima di ogni test
        pool = require('../db');
        
        // Imposta comportamenti di default per i mock
        pool.execute.mockImplementation((query, params) => {
            // Simula risposte per diverse query
            if (query.includes('INSERT')) {
                return [{ insertId: 1, affectedRows: 1 }];
            }
            if (query.includes('UPDATE')) {
                return [{ affectedRows: 1 }];
            }
            if (query.includes('DELETE')) {
                return [{ affectedRows: 1 }];
            }
            if (query.includes('SELECT')) {
                return [
                    [
                        { 
                            id: 1, 
                            nome: 'Mario', 
                            cognome: 'Rossi', 
                            email: 'mario.rossi@test.com' 
                        }
                    ]
                ];
            }
            return [[]];
        });
    });

    // Test per la creazione di un utente
    test('POST /users - Creazione di un nuovo utente', async () => {
        const newUser = {
            nome: 'Mario',
            cognome: 'Rossi',
            email: 'mario.rossi@test.com'
        };

        const response = await request(app)
            .post('/users')
            .send(newUser);

        expect(response.statusCode).toBe(201);
        expect(response.body.message).toBe('Utente creato con successo');
        expect(response.body.userId).toBeDefined();
    });

    // Test per recupero degli utenti
    test('GET /users - Recupero degli utenti', async () => {
        const response = await request(app).get('/users');

        expect(response.statusCode).toBe(200);
        expect(Array.isArray(response.body)).toBe(true);
        expect(response.body.length).toBeGreaterThan(0);
    });

    // Test per aggiornamento utente
    test('PUT /users/:id - Aggiornamento di un utente', async () => {
        const updatedUser = {
            nome: 'Mario',
            cognome: 'Bianchi',
            email: 'mario.bianchi@test.com'
        };

        const response = await request(app)
            .put('/users/1')
            .send(updatedUser);

        expect(response.statusCode).toBe(200);
        expect(response.body.message).toBe('Utente aggiornato con successo');
    });

    // Test per eliminazione utente
    test('DELETE /users/:id - Eliminazione di un utente', async () => {
        const response = await request(app).delete('/users/1');

        expect(response.statusCode).toBe(200);
        expect(response.body.message).toBe('Utente eliminato con successo');
    });
});