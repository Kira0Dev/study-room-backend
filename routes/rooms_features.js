const express = require('express');
const router = express.Router();

module.exports = (db) => {

    /*implement to return all features of a room on a "feature1, feature2, feature3" format
    SELECT f.FeatureName
    FROM Rooms_Features rf
    JOIN Features f ON rf.FeatureID = f.FeatureID
    WHERE rf.RoomID = 1
    GROUP BY f.FeatureName
    */

    router.get('/room/:id', (req, res) => {
        const { id } = req.params;
    
        const query = `
            SELECT GROUP_CONCAT(f.FeatureName SEPARATOR ', ') AS features
            FROM Rooms_Features rf
            JOIN Features f ON rf.FeatureID = f.FeatureID
            WHERE rf.RoomID = ?
        `;

        db.query(query, [id], (err, results) => {
            if (err) return res.status(500).json({ error: err.message });
            const features = results[0]?.features || "";
            res.json({ features });
        });
    });
    /*
    // 1. READ ALL
    router.get('/', (req, res) => {
        db.query('SELECT * FROM Reservations', (err, results) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json(results);
        });
    });
    */
    // 2. CREATE
    router.post('/', (req, res) => {
        const {RoomID, FeatureID} = req.body;
        db.query('INSERT INTO Rooms_Features (RoomID, FeatureID) VALUES (?, ?)', [RoomID, FeatureID], (err, results) => {
            if (err) return res.status(500).json({ error: err.message });
            res.status(201).json({ id: results.insertId });
        });
    });

    // 3. UPDATE
    router.put('/:id', (req, res) => {
        const { id } = req.params;
        const { RoomID, FeatureID } = req.body;
        db.query('UPDATE Rooms_Features SET RoomID = ?, FeatureID = ? WHERE id = ?', [RoomID, FeatureID, id], (err, results) => {
            if (err) return res.status(500).json({ error: err.message });
            if (results.affectedRows === 0) return res.status(404).json({ message: 'Rooms_Feature not found' });
            res.json({ message: 'Rooms_Feature updated successfully' });
        });
    });

    // 4. DELETE
    router.delete('/:id', (req, res) => {
        const { id } = req.params;
        db.query('DELETE FROM Rooms_Features WHERE id = ?', [id], (err, results) => {
            if (err) return res.status(500).json({ error: err.message });
            if (results.affectedRows === 0) return res.status(404).json({ message: 'Rooms_Feature not found' });
            res.json({ message: 'Rooms_Feature deleted successfully' });
        });
    });

    return router;
}