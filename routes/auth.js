const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

module.exports = (db) => {

    router.post('/register', async (req, res) => {
        const { Username, Email, PasswordHash, role } = req.body;

        if (!Username || !Email || !PasswordHash) {
            return res.status(400).json({ message: 'Please fill in all required fields.' });
        }

        try {
            // Encrypyt password using bcrypt
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(PasswordHash, salt);

            // Assign default role if not provided
            const userRole = role || 'student';

            const sql = 'INSERT INTO Users (Username, Email, PasswordHash, Role) VALUES (?, ?, ?, ?)';
            db.query(sql, [Username, Email, hashedPassword, userRole], (err, result) => {
                if (err) {
                    if (err.code === 'ER_DUP_ENTRY') {
                        return res.status(400).json({ message: 'Username or email already registered.' });
                    }
                    return res.status(500).json({ error: err.message });
                }
                res.status(201).json({ message: 'User registered successfully.' });
            });

        } catch (error) {
            res.status(500).json({ error: 'Error on the server while processing the password.' });
        }
    });

    router.post('/login', (req, res) => {
        const { Email, PasswordHash } = req.body;

        if (!Email || !PasswordHash) {
            return res.status(400).json({ message: 'Please enter email and password.' });
        }

        const sql = 'SELECT * FROM Users WHERE Email = ?';
        db.query(sql, [Email], async (err, results) => {
            if (err) return res.status(500).json({ error: err.message });
            
            // Check if user exists
            if (results.length === 0) {
                return res.status(401).json({ message: 'Invalid email or password.' });
            }

            const user = results[0];

            const isMatch = await bcrypt.compare(PasswordHash, user.PasswordHash);
            if (!isMatch) {
                return res.status(401).json({ message: 'Invalid email or password.' });
            }

            // Create JWT token if login is successful
            const token = jwt.sign(
                { UserID: user.UserID, role: user.role, Username: user.Username },
                process.env.JWT_SECRET,
                { expiresIn: '2h' } 
            );

            res.json({
                message: 'Login successful',
                token,
                user: {
                    UserID: user.UserID,
                    Username: user.Username,
                    Email: user.Email,
                    role: user.role
                }
            });
        });
    });

    return router;
};