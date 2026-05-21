require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mysql = require('mysql2');

const app = express();


app.use(cors({
    origin: [
        'https://study-room-reservation-system.vercel.app',
        'http://localhost:5173'
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
}));


app.use(express.json());
app.use((req, res, next) => {
    if (req.method === 'OPTIONS') {
        return res.sendStatus(200);
    }
    next();
});




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


const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

console.log('DB config', db.config.connectionConfig);

app.get('/_db-test', (req, res) => {
  db.query('SELECT 1 + 1 AS result', (err, results) => {
    if (err) return res.status(500).json({ ok: false, error: err.message });
    res.json({ ok: true, result: results[0].result });
  });
});
