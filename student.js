const express = require('express');
const router = express.Router();
const connection = require('./mysql-config');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// 1. ตั้งค่าการเก็บไฟล์ของนักศึกษา
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const imagePath = './public/images';
        if (!fs.existsSync(imagePath)) fs.mkdirSync(imagePath, { recursive: true });
        cb(null, imagePath);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'student-' + uniqueSuffix + path.extname(file.originalname));
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
// 2. Routes (CRUD) สำหรับ Student
// ==========================================

// 🚀 ดึงข้อมูลนักศึกษาทั้งหมด
router.get('/', (req, res) => {
    const sql = 'SELECT * FROM student ORDER BY studentId ASC';
    connection.query(sql, (err, results) => {
        if (err) return res.json({ result: 0, message: err.message });
        res.json({ result: 1, data: results });
    });
});

// 🚀 เพิ่มข้อมูลนักศึกษา
router.post('/', (req, res) => {
    upload.single('image')(req, res, (err) => {
        if (err) return res.json({ result: 0, message: err.message });

        const { studentId, name, score, gender } = req.body;
        const studentPicture = req.file ? req.file.filename : "";

        const sql = 'INSERT INTO student (studentId, name, score, gender, studentPicture) VALUES (?, ?, ?, ?, ?)';
        connection.query(sql, [studentId, name, score, gender, studentPicture], (dbErr, results) => {
            if (dbErr) return res.json({ result: 0, message: dbErr.message });
            res.json({ result: 1, message: 'เพิ่มข้อมูลนักศึกษาสำเร็จ' });
        });
    });
});

// 🚀 API แก้ไขข้อมูลนักศึกษา
router.put('/:id', (req, res) => {
    upload.single('image')(req, res, (err) => {
        if (err) return res.json({ result: 0, message: err.message });

        const id = req.params.id;
        const { name, score, gender } = req.body;

        let sql = 'UPDATE student SET name = ?, score = ?, gender = ?';
        let params = [name, score, gender];

        if (req.file) {
            sql += ', studentPicture = ?';
            params.push(req.file.filename);
        }
        sql += ' WHERE studentId = ?';
        params.push(id);

        connection.query(sql, params, (dbErr, results) => {
            if (dbErr) return res.json({ result: 0, message: dbErr.message });
            res.json({ result: 1, message: 'แก้ไขข้อมูลนักศึกษาเรียบร้อย' });
        });
    });
});

// 🚀 ลบข้อมูลนักศึกษา
router.delete('/:id', (req, res) => {
    const id = req.params.id;
    connection.query('DELETE FROM student WHERE studentId = ?', [id], (err, results) => {
        if (err) return res.json({ result: 0, message: err.message });
        res.json({ result: 1, message: 'ลบข้อมูลเรียบร้อย' });
    });
});

// ==========================================
// 3. API สำหรับระบบ Login (Student)
// ==========================================

// 🚀 ล็อกอินนักศึกษา (POST /student/login)
router.post('/login', (req, res) => {
    // 1. รับค่าที่หน้าบ้านส่งมา
    const { studentId, password } = req.body;

    // 2. ค้นหานักศึกษาจากฐานข้อมูล
    const sql = 'SELECT * FROM student WHERE studentId = ?';
    connection.query(sql, [studentId], (err, results) => {
        if (err) return res.json({ result: 0, message: err.message });

        // เคสที่ 1: หาไอดีไม่เจอ
        if (results.length === 0) {
            return res.json({
                result: 0,
                status: 404,
                message: 'Not Found: ไม่มีรหัสนักศึกษานี้ในระบบ'
            });
        }

        // 3. ถ้าหาเจอ ให้ดึงข้อมูลมาเช็ครหัสผ่าน
        const student = results[0];

        // 💡 แปลงเป็นตัวอักษรและตัดช่องว่างซ้ายขวาทิ้ง (กันบั๊กผีหลอก)
        const dbPassword = String(student.password).trim();
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
            message: 'Login Success: ล็อกอินนักศึกษาสำเร็จ',
            data: {
                studentId: student.studentId,
                name: student.name,
                gender: student.gender
            }
        });
    });
});

module.exports = router;