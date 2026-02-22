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

// 2. Routes (CRUD) สำหรับ Teacher
// 🚀 ดึงข้อมูลอาจารย์ทั้งหมด
router.get('/', (req, res) => {
    const sql = 'SELECT * FROM teacher ORDER BY teacherId ASC';
    connection.query(sql, (err, results) => {
        // เอา status 500 ออก แล้วดึงแค่ err.message
        if (err) return res.json({ result: 0, message: err.message });
        res.json({ result: 1, data: results });
    });
});

// 🚀 เพิ่มข้อมูลอาจารย์ท่านใหม่
router.post('/', (req, res) => {
    upload.single('image')(req, res, (err) => {
        // เอา status 400 ออก
        if (err) return res.json({ result: 0, message: err.message });

        const { teacherId, teacherName, department } = req.body;
        const teacherPicture = req.file ? req.file.filename : "";

        const sql = 'INSERT INTO teacher (teacherId, teacherName, department, teacherPicture) VALUES (?, ?, ?, ?)';
        connection.query(sql, [teacherId, teacherName, department, teacherPicture], (dbErr, results) => {
            // ดึงแค่ dbErr.message กลับไป หน้าบ้านจะได้อ่านรู้เรื่อง
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

module.exports = router;