# Orizon

**Orizon** è un'applicazione backend che simula la logica di business di un'agenzia di viaggi fittizia. Il progetto espone API REST per la gestione di utenti, prodotti e ordini, offrendo un ambiente ideale per sperimentare e imparare la costruzione di un'API con logica di business realistica.

## Tecnologie e Framework Utilizzati

- **Node.js** – Ambiente di esecuzione JavaScript lato server.
- **Express** – Framework per la creazione di API REST in maniera semplice ed efficiente.
- **MySQL** – Database relazionale utilizzato per la persistenza dei dati.
- **mysql2** – Driver per interfacciarsi con MySQL in modo asincrono (necessario per knex.js).
- **dotenv** – Gestione delle variabili di ambiente.
- **Nodemon** – Strumento per lo sviluppo che riavvia automaticamente il server ad ogni modifica.
- **Knex** - Query builder per ottimizzare la gestione del database

## Struttura e Funzionamento delle API

Il progetto è organizzato in moduli che gestiscono le diverse risorse (utenti, prodotti, ordini) e la loro logica di business. Di seguito una breve descrizione dei file principali:

- **`index.js`**

  - Punto di ingresso dell'applicazione e avvia il server sulla porta specificata.

- **`server.js`**

  - Configura l'applicazione Express.
  - Imposta i middleware per il parsing del JSON.
  - Inietta le route per la gestione di utenti, prodotti e ordini.
  - Definisce una route di prova per la root ("/").

- **`db.js`**

  - Con knex.js si configura la connessione a MySQL utilizzando le variabili di ambiente.
  - Effettua un test di connessione al database.

- **`migration.sql`**

  - File che serve a ricostruire la struttura del database.

- **`routes/users.js`**

  - **POST**: Crea un nuovo utente richiedendo nome, cognome ed email.
  - **GET**: Recupera la lista di tutti gli utenti.
  - **PUT**: Aggiorna le informazioni di un utente specificato tramite ID.
  - **DELETE**: Elimina un utente in base all'ID fornito.

- **`routes/products.js`**

  - **POST**: Crea un nuovo prodotto richiedendo il nome.
  - **GET**: Recupera tutti i prodotti.
  - **PUT**: Aggiorna il nome di un prodotto esistente tramite ID.
  - **DELETE**: Elimina un prodotto in base all'ID.

- **`routes/orders.js`**

  - **POST**: Crea un nuovo ordine associando un utente e uno o più prodotti, gestendo transazioni e associazioni in tabelle dedicate.
  - **GET**: Recupera tutti gli ordini, con possibilità di filtrarli per data o per ID di prodotto tramite query string.
  - **PUT**: Aggiorna un ordine esistente modificando le associazioni con utenti e prodotti.
  - **DELETE**: Elimina un ordine e rimuove tutte le relative associazioni.

## Requisiti

- **Node.js** (versione consigliata 14.x o superiore)
- **MySQL** (per il database)
- **npm** (Node Package Manager)

## Installazione

1. **Clona il repository:**

Digita prima:

    git clone https://github.com/dgmichele/Orizon.git

E poi:

    cd orizon

2. **Installa le dipendenze:**

Digita:

    npm install

## Configurazione

1. **Crea un file `.env`** nella root del progetto e inserisci le seguenti variabili di ambiente:

   DB_HOST=localhost

   DB_USER=root

   DB_PASSWORD=latuapassword

   DB_NAME=nomedeltuodatabase

   DB_PORT=3306

   PORT=3000

2. **Assicurati di avere un database MySQL** con il nome indicato in `DB_NAME`. Dovrai creare le tabelle per `users`, `products`, `orders`, `order_users` e `order_products` secondo le specifiche della tua applicazione.

## Utilizzo

1. **Avvia il server:**

Per avviare il server utilizza il comando:

    npm start

Oppure, per avviare in modalità sviluppo con **nodemon**:

    npm run dev

2. **Accedi all'API** visitando [http://localhost:3000](http://localhost:3000) nel tuo browser. La root mostra un messaggio di benvenuto: "Benvenuto in Orizon!".
