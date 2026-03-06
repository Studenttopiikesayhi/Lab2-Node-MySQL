const express = require('express');
const router = express.Router();
const connection = require('./mysql-config');
const jwt = require('jsonwebtoken');
const authGuard = require('./auth-guard');
const multer = require('multer'); // 👈 นำเข้า Multer สำหรับอัปโหลดรูป
const path = require('path');
require('dotenv').config();

// 🚀 ตั้งค่า Multer สำหรับอัปโหลดรูปภาพนักศึกษา
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, './public/images');
    },
    filename: function (req, file, cb) {
        cb(null, 'student-' + Date.now() + path.extname(file.originalname));
    }
});
const upload = multer({ storage: storage });

// 🚀 ดึงข้อมูล (GET) + เติม รปภ. เฝ้าประตู
router.get('/', authGuard, (req, res) => {
    const sql = 'SELECT * FROM student ORDER BY studentId ASC';
    connection.query(sql, (err, results) => {
        if (err) return res.json({ result: 0, message: err.message });
        res.json({ result: 1, data: results });
    });
});

// 🚀 เพิ่มข้อมูล (POST) + เติม รปภ. เฝ้าประตู
router.post('/', authGuard, upload.single('image'), (req, res) => {
    const { studentId, name, gender, score } = req.body;
    let studentPicture = req.file ? req.file.filename : null;

    const sql = 'INSERT INTO student (studentId, name, gender, score, studentPicture) VALUES (?, ?, ?, ?, ?)';
    connection.query(sql, [studentId, name, gender, score, studentPicture], (err, results) => {
        if (err) return res.json({ result: 0, message: err.message });
        res.json({ result: 1, message: 'เพิ่มข้อมูลนักเรียนสำเร็จ' });
    });
});

// 🚀 แก้ไขข้อมูล (PUT) + เติม รปภ. เฝ้าประตู
router.put('/:id', authGuard, upload.single('image'), (req, res) => {
    const id = req.params.id;
    const { name, gender, score } = req.body;
    let studentPicture = req.file ? req.file.filename : null;

    let sql, params;
    if (studentPicture) {
        sql = 'UPDATE student SET name=?, gender=?, score=?, studentPicture=? WHERE studentId=?';
        params = [name, gender, score, studentPicture, id];
    } else {
        sql = 'UPDATE student SET name=?, gender=?, score=? WHERE studentId=?';
        params = [name, gender, score, id];
    }

    connection.query(sql, params, (err, results) => {
        if (err) return res.json({ result: 0, message: err.message });
        res.json({ result: 1, message: 'แก้ไขข้อมูลนักเรียนสำเร็จ' });
    });
});

// 🚀 ลบข้อมูล (DELETE) + เติม รปภ. เฝ้าประตู
router.delete('/:id', authGuard, (req, res) => {
    const id = req.params.id;
    const sql = 'DELETE FROM student WHERE studentId = ?';
    connection.query(sql, [id], (err, results) => {
        if (err) return res.json({ result: 0, message: err.message });
        res.json({ result: 1, message: 'ลบข้อมูลนักเรียนสำเร็จ' });
    });
});

// ==============================================================
// 🛑 ปิดระบบล็อกอินนักศึกษาตามคำสั่งอาจารย์ (Teacher Account only)
// ==============================================================
/*
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
*/

module.exports = router;