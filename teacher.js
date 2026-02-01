const express = require('express');
const router = express.Router();
const connection = require('./mysql-config');

// ดึงข้อมูลอาจารย์ (พร้อมเรียงลำดับตามรหัส)
router.get('/', (req, res) => {
    // เพิ่มคำสั่ง ORDER BY teacherId ASC ต่อท้าย
    const sql = 'SELECT * FROM teacher ORDER BY teacherId ASC';

    connection.query(sql, (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).send('Database Error');
        }
        res.json(results);
    });
});

module.exports = router;