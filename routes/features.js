const express = require('express');
const router = express.Router();

module.exports = (db) => {
    // 1. READ ALL
    router.get('/', (req, res) => {
        db.query('SELECT * FROM Features', (err, results) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json(results);
        });
    });

    // 2. CREATE
    router.post('/', (req, res) => {
        const{FeatureName} = req.body;
        db.query('INSERT INTO Features (FeatureName) VALUES (?)', [FeatureName], (err, results) => {
            if (err) return res.status(500).json({ error: err.message });
            res.status(201).json({ id: results.insertId });
        });
    });

    // 3. UPDATE
    router.put('/:id', (req, res) => {
        const { id } = req.params;
        const { FeatureName } = req.body;
        db.query('UPDATE Features SET FeatureName = ? WHERE id = ?', [FeatureName, id], (err, results) => {
            if (err) return res.status(500).json({ error: err.message });
            if (results.affectedRows === 0) return res.status(404).json({ message: 'Feature not found' });
            res.json({ message: 'Feature updated successfully' });
        });
    });

    // 4. DELETE
    router.delete('/:id', (req, res) => {
        const { id } = req.params;
        db.query('DELETE FROM Features WHERE id = ?', [id], (err, results) => {
            if (err) return res.status(500).json({ error: err.message });
            if (results.affectedRows === 0) return res.status(404).json({ message: 'Feature not found' });
            res.json({ message: 'Feature deleted successfully' });
        });
    });

    return router;
}