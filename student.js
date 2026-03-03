const express = require('express');
const router = express.Router();
const connection = require('./mysql-config');
const jwt = require('jsonwebtoken'); // 👈 เพิ่ม: นำเข้า JWT
const authGuard = require('./auth-guard'); // 👈 เพิ่ม: นำเข้า รปภ.
require('dotenv').config();

// ... (ส่วนตั้งค่า Multer เหมือนเดิม) ...

// 🚀 ดึงข้อมูล (เติม รปภ. เฝ้าประตู)
router.get('/', authGuard, (req, res) => { // 👈 เติม authGuard
    const sql = 'SELECT * FROM student ORDER BY studentId ASC';
    connection.query(sql, (err, results) => {
        if (err) return res.json({ result: 0, message: err.message });
        res.json({ result: 1, data: results });
    });
});

// ... (POST, PUT, DELETE เติม authGuard ให้ครบตามรอยอาจารย์) ...

// 🚀 ล็อกอินนักศึกษา (เพิ่มการแจกตั๋ว)
router.post('/login', (req, res) => {
    const { studentId, password } = req.body;
    const sql = 'SELECT * FROM student WHERE studentId = ?';
    connection.query(sql, [studentId], (err, results) => {
        if (err) return res.json({ result: 0, message: err.message });
        if (results.length === 0) return res.json({ result: 0, status: 404, message: 'ไม่มีรหัสนักศึกษา' });

        const student = results[0];
        if (String(student.password).trim() !== String(password).trim()) {
            return res.json({ result: 0, status: 401, message: 'รหัสผ่านไม่ถูกต้อง' });
        }

        // 🎟️ สร้างตั๋วให้นักศึกษาด้วยครับ!
        const payload = { studentId: student.studentId, name: student.name };
        const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1d' });

        res.json({ result: 1, status: 200, message: 'ล็อกอินนักศึกษาสำเร็จ', token: token, data: payload });
    });
});

module.exports = router;