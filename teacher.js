const express = require('express');
const router = express.Router();
const connection = require('./mysql-config');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// 1. ตั้งค่าการเก็บไฟล์
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

// 🚀 ดึงข้อมูลอาจารย์ทั้งหมด
router.get('/', (req, res) => {
    const sql = 'SELECT * FROM teacher ORDER BY teacherId ASC';
    connection.query(sql, (err, results) => {
        if (err) return res.json({ result: 0, message: err.message });
        res.json({ result: 1, data: results });
    });
});

// 🚀 เพิ่มข้อมูลอาจารย์ท่านใหม่
router.post('/', (req, res) => {
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

// 🚀 API แก้ไขข้อมูลอาจารย์ (PUT)
router.put('/:id', (req, res) => {
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

// 🚀 ลบข้อมูลอาจารย์
router.delete('/:id', (req, res) => {
    const id = req.params.id;
    connection.query('DELETE FROM teacher WHERE teacherId = ?', [id], (err, results) => {
        if (err) return res.json({ result: 0, message: err.message });
        res.json({ result: 1, message: 'ลบข้อมูลเรียบร้อย' });
    });
});

// ==========================================
// 3. API สำหรับระบบ Login
// ==========================================

// 🚀 ล็อกอินอาจารย์ (POST /teacher/login)
router.post('/login', (req, res) => {
    // 1. รับค่าที่หน้าบ้านส่งมา
    const { teacherId, password } = req.body;

    // 2. ค้นหาอาจารย์จากฐานข้อมูล
    const sql = 'SELECT * FROM teacher WHERE teacherId = ?';
    connection.query(sql, [teacherId], (err, results) => {
        if (err) return res.json({ result: 0, message: err.message });

        // เคสที่ 1: หาไอดีไม่เจอ
        if (results.length === 0) {
            return res.json({
                result: 0,
                status: 404,
                message: 'Not Found: ไม่มีรหัสอาจารย์นี้ในระบบ'
            });
        }

        // 3. ถ้าหาเจอ ให้ดึงข้อมูลอาจารย์คนนั้นมาเช็ครหัสผ่าน
        const teacher = results[0];

        // 💡 แปลงเป็นตัวอักษรและตัดช่องว่างซ้ายขวาทิ้ง (แก้ปัญหา Type Mismatch)
        const dbPassword = String(teacher.password).trim();
        const inputPassword = String(password).trim();

        // เคสที่ 2: รหัสผ่านไม่ตรงกัน
        if (dbPassword !== inputPassword) {
            return res.json({
                result: 0,
                status: 401,
                message: 'Invalid: รหัสผ่านไม่ถูกต้อง'
            });
        }

        // เคสที่ 3: ไอดีและรหัสผ่านถูกต้อง (ล็อกอินสำเร็จ)
        res.json({
            result: 1,
            status: 200,
            message: 'Login Success: ล็อกอินสำเร็จ',
            data: {
                teacherId: teacher.teacherId,
                teacherName: teacher.teacherName,
                department: teacher.department
            }
        });
    });
});

module.exports = router;