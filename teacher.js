const express = require('express');
const router = express.Router();
const connection = require('./mysql-config');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// 🚀 1. นำเข้าเครื่องมือสำหรับเข้ารหัสผ่าน, ทำ Token และ รปภ. (Auth Guard)
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const authGuard = require('./auth-guard'); // 👈 เรียกใช้งาน รปภ. มาเฝ้าแต่ละ Route
require('dotenv').config();

// ตั้งค่าการเก็บไฟล์
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const imagePath = './public/images';
        if (!fs.existsSync(imagePath)) fs.mkdirSync(imagePath, { recursive: true });
        cb(null, imagePath);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'teacher-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        const allowedTypes = ['image/jpeg', 'image/png'];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type. Only JPEG and PNG are allowed.'));
        }
    }
});

// ==========================================
// 2. Routes (CRUD) สำหรับ Teacher
// ==========================================

// GET: ดึงข้อมูล (💡 เติม authGuard เพื่อล็อกไม่ให้คนนอกดูรายชื่ออาจารย์)
router.get('/', authGuard, (req, res) => { // 👈 เติม authGuard ตรงนี้ครับ
    const sql = 'SELECT * FROM teacher ORDER BY teacherId ASC';
    connection.query(sql, (err, results) => {
        if (err) return res.json({ result: 0, message: err.message });
        res.json({ result: 1, data: results });
    });
});

// POST: เพิ่มข้อมูล (ใช้ authGuard เฝ้าประตู)
router.post('/', authGuard, (req, res) => {
    upload.single('image')(req, res, (err) => {
        if (err) return res.json({ result: 0, message: err.message });

        const { teacherId, teacherName, department } = req.body;
        const teacherPicture = req.file ? req.file.filename : "";

        const sql = 'INSERT INTO teacher (teacherId, teacherName, department, teacherPicture) VALUES (?, ?, ?, ?)';
        connection.query(sql, [teacherId, teacherName, department, teacherPicture], (dbErr, results) => {
            if (dbErr) return res.json({ result: 0, message: dbErr.message });
            res.json({ result: 1, message: 'เพิ่มข้อมูลอาจารย์สำเร็จ' });
        });
    });
});

// PUT: แก้ไขข้อมูล (ใช้ authGuard เฝ้าประตู)
router.put('/:id', authGuard, (req, res) => {
    upload.single('image')(req, res, (err) => {
        if (err) return res.json({ result: 0, message: err.message });

        const id = req.params.id;
        const { teacherName, department } = req.body;

        let sql = 'UPDATE teacher SET teacherName = ?, department = ?';
        let params = [teacherName, department];

        if (req.file) {
            sql += ', teacherPicture = ?';
            params.push(req.file.filename);
        }
        sql += ' WHERE teacherId = ?';
        params.push(id);

        connection.query(sql, params, (dbErr, results) => {
            if (dbErr) return res.json({ result: 0, message: dbErr.message });
            res.json({ result: 1, message: 'แก้ไขข้อมูลอาจารย์เรียบร้อย' });
        });
    });
});

// DELETE: ลบข้อมูล (ใช้ authGuard เฝ้าประตู)
router.delete('/:id', authGuard, (req, res) => {
    const id = req.params.id;
    connection.query('DELETE FROM teacher WHERE teacherId = ?', [id], (err, results) => {
        if (err) return res.json({ result: 0, message: err.message });
        res.json({ result: 1, message: 'ลบข้อมูลเรียบร้อย' });
    });
});

// ==========================================
// 🚀 3. API เปลี่ยนและเข้ารหัสผ่าน (ใช้ authGuard เพื่อความปลอดภัย)
// ==========================================
router.put('/password/:id', authGuard, async (req, res) => { // 👈 แนะนำให้ล็อกห้องนี้ด้วยครับ
    const id = req.params.id;
    const { password } = req.body;

    try {
        const salt = await bcrypt.genSalt(10);
        // ใช้ SECRET จาก .env ในการผสมรหัส
        const hashedPassword = await bcrypt.hash(String(password).trim() + process.env.SECRET, salt);

        const sql = 'UPDATE teacher SET password = ? WHERE teacherId = ?';
        connection.query(sql, [hashedPassword, id], (err, results) => {
            if (err) return res.json({ result: 0, message: err.message });
            if (results.affectedRows === 0) return res.json({ result: 0, message: 'ไม่พบรหัสอาจารย์นี้' });
            res.json({ result: 1, message: 'เปลี่ยนรหัสผ่านเรียบร้อย' });
        });
    } catch (err) {
        res.json({ result: 0, message: 'Error: ' + err.message });
    }
});

// ==========================================
// 🚀 4. API ระบบ Login (❌ ห้ามใส่ authGuard ห้องนี้)
// ==========================================
router.post('/login', (req, res) => {
    const { teacherId, password } = req.body;

    const sql = 'SELECT * FROM teacher WHERE teacherId = ?';
    connection.query(sql, [teacherId], async (err, results) => {
        if (err) return res.json({ result: 0, message: err.message });

        if (results.length === 0) {
            return res.json({ result: 0, status: 404, message: 'ไม่มีรหัสอาจารย์นี้ในระบบ' });
        }

        const teacher = results[0];

        // ตรวจสอบรหัสผ่านโดยใช้ SECRET
        const inputPassword = String(password).trim() + process.env.SECRET;
        const isMatch = await bcrypt.compare(inputPassword, teacher.password);

        if (!isMatch) {
            return res.json({ result: 0, status: 401, message: 'รหัสผ่านไม่ถูกต้อง' });
        }

        const payload = {
            teacherId: teacher.teacherId,
            teacherName: teacher.teacherName,
            department: teacher.department
        };

        // 🎟️ ออกตั๋วโดยใช้ JWT_SECRET
        const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1d' });

        res.json({
            result: 1,
            status: 200,
            message: 'ล็อกอินสำเร็จ',
            token: token, // ส่งตั๋วกลับไปให้หน้าบ้าน
            data: payload
        });
    });
});

module.exports = router;