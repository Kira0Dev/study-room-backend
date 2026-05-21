const express = require('express');
const router = express.Router();

module.exports = (db) => {

    // 1. READ ALL AND FILTERS
    router.get('/', (req, res) => {

        const { search, capacity, features, startTime, endTime } = req.query;

        // First select all rooms with a default status of 'Available'
        let selectClause = `
            SELECT Rooms.*,
                'Nop' AS DynamicStatus,
                (SELECT GROUP_CONCAT(f.FeatureName SEPARATOR ', ')
                    FROM Features f
                    JOIN Rooms_Features rf ON rf.FeatureID = f.FeatureID
                    WHERE rf.RoomID = Rooms.RoomID
                ) AS features
            FROM Rooms
            WHERE 1=1
        `;
        let params = [];

        // Calculate room availability based on time filters
        if (startTime && endTime) {
            selectClause = `
                SELECT Rooms.*,
                    CASE 
                        WHEN res.RoomID IS NOT NULL THEN 'Reserved'
                        ELSE 'Available'
                    END AS DynamicStatus,
                    res.ReservationID,
                    res.Status AS ReservationStatus,
                    (SELECT GROUP_CONCAT(f.FeatureName SEPARATOR ', ')
                        FROM Features f
                        JOIN Rooms_Features rf ON rf.FeatureID = f.FeatureID
                        WHERE rf.RoomID = Rooms.RoomID
                    ) AS features
                FROM Rooms 
                LEFT JOIN Reservations res ON res.RoomID = Rooms.RoomID 
                AND res.StartTime <= ? 
                AND res.EndTime >= ?
                AND res.Status IN ('pending', 'approved')
                WHERE 1=1
            `;
            params.push(endTime, startTime);
        }

        // We save this base query in a variable to keep adding filters dynamically
        let sql = selectClause;

        // Filter by name (search)
        if (search) {
            sql += ' AND Rooms.RoomName LIKE ?';
            params.push(`%${search}%`);
        }

        // Filter by capacity
        if (capacity) {
            sql += ' AND Rooms.Capacity >= ?';
            params.push(Number(capacity));
        }

        // Filter by features
        if (features) {
            const featureList = features.split(',').map(Number);
            if (featureList.length > 0) {
                const placeholders = featureList.map(() => '?').join(',');
                sql += ` AND Rooms.RoomID IN (
                    SELECT RoomID
                    FROM Rooms_Features
                    WHERE FeatureID IN (${placeholders})
                    GROUP BY RoomID
                    HAVING COUNT(DISTINCT FeatureID) = ?
                )`;
                params.push(...featureList, featureList.length);
            }
        }

        db.query(sql, params, (err, results) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json(results);
        });
    });

    // 2. CREATE 
    router.post('/', (req, res) => {
        const { RoomName, Capacity, features } = req.body;

        const sql = 'INSERT INTO Rooms (RoomName, Capacity) VALUES (?, ?)';
        db.query(sql, [RoomName, Capacity], (err, result) => {
            if (err) return res.status(500).json({ error: err.message });

            const roomId = result.insertId;

            // Insert features (if any)
            if (Array.isArray(features) && features.length > 0) {
                const values = features.map(fid => [roomId, fid]);
                const featSql = 'INSERT INTO Rooms_Features (RoomID, FeatureID) VALUES ?';

                db.query(featSql, [values], (err2) => {
                    if (err2) return res.status(500).json({ error: err2.message });
                    return res.status(201).json({ message: 'Room created successfully', roomId });
                });
            } else {
                return res.status(201).json({ message: 'Room created successfully', roomId });
            }
        });
    });


    // 3. UPDATE
    router.put('/:id', (req, res) => {
        const { id } = req.params;
        const { RoomName, Capacity, features } = req.body;

        const sql = 'UPDATE Rooms SET RoomName = ?, Capacity = ? WHERE RoomID = ?';
        db.query(sql, [RoomName, Capacity, id], (err, result) => {
            if (err) return res.status(500).json({ error: err.message });
            if (result.affectedRows === 0) return res.status(404).json({ message: 'Room not found' });

            // Remove old features
            const deleteSql = 'DELETE FROM Rooms_Features WHERE RoomID = ?';
            db.query(deleteSql, [id], (err2) => {
                if (err2) return res.status(500).json({ error: err2.message });

                // Insert new features
                if (Array.isArray(features) && features.length > 0) {
                    const values = features.map(fid => [id, fid]);
                    const insertSql = 'INSERT INTO Rooms_Features (RoomID, FeatureID) VALUES ?';

                    db.query(insertSql, [values], (err3) => {
                        if (err3) return res.status(500).json({ error: err3.message });
                        return res.json({ message: 'Room updated successfully' });
                    });
                } else {
                    return res.json({ message: 'Room updated successfully' });
                }
            });
        });
    });





    // 4. DELETE
    router.delete('/:id', (req, res) => {
        const { id } = req.params;

        const sql = 'DELETE FROM Rooms WHERE RoomID = ?';
        db.query(sql, [id], (err, result) => {
            if (err) return res.status(500).json({ error: err.message });
            if (result.affectedRows === 0) return res.status(404).json({ message: 'Room not found' });
            res.json({ message: 'Room deleted successfully' });
        });
    });

    return router;
};