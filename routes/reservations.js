const express = require('express');
const router = express.Router();

module.exports = (db) => {
    // 1. READ ALL
    router.get('/', (req, res) => {
        db.query('SELECT * FROM Reservations', (err, results) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json(results);
        });
    });

    // 2. CREATE
    router.post('/', (req, res) => {
        const { UserID, RoomID, StartTime, EndTime, Status } = req.body;
        db.query('INSERT INTO Reservations (UserID, RoomID, StartTime, EndTime, Status) VALUES (?, ?, ?, ?, ?)', [UserID, RoomID, StartTime, EndTime, Status], (err, results) => {
            if (err) return res.status(500).json({ error: err.message });
            res.status(201).json({ id: results.insertId });
        });
    });

    // 3. UPDATE
    router.put('/:id', (req, res) => {
        const { id } = req.params;
        const {Status } = req.body;
        db.query('UPDATE Reservations SET Status = ? WHERE ReservationID = ?', [Status, id], (err, results) => {
            if (err) return res.status(500).json({ error: err.message });
            if (results.affectedRows === 0) return res.status(404).json({ message: 'Reservation not found' });
            res.json({ message: 'Reservation updated successfully' });
        });
    });

    // 4. DELETE
    router.delete('/:id', (req, res) => {
        const { id } = req.params;
        db.query('DELETE FROM Reservations WHERE ReservationID = ?', [id], (err, results) => {
            if (err) return res.status(500).json({ error: err.message });
            if (results.affectedRows === 0) return res.status(404).json({ message: 'Reservation not found' });
            res.json({ message: 'Reservation deleted successfully' });
        });
    });

    return router;
}