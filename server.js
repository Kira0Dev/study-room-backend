require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mysql = require('mysql2');

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Connection to Railway
const db = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT,
    waitForConnections: true,
    connectionLimit: 10
});

console.log('Connected to database:', db.config.connectionConfig.database);

// Routes
const roomsRouter = require('./routes/rooms');
const featuresRouter = require('./routes/features');
const roomsFeaturesRouter = require('./routes/rooms_features');
const reservationsRouter = require('./routes/reservations');
const authRouter = require('./routes/auth');

app.use('/rooms', roomsRouter(db)); 
app.use('/features', featuresRouter(db));
app.use('/rooms-features', roomsFeaturesRouter(db));
app.use('/reservations', reservationsRouter(db));
app.use('/auth', authRouter(db));

// Initialize server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});