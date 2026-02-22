const express = require('express');
const router = express.Router();
const db = require('./mysql-config');
const multer = require('multer');
const path = require('path');

// ตั้งค่าการเก็บรูปภาพนักเรียน
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'public/images')
    },
    filename: function (req, file, cb) {
        cb(null, 'S-' + Date.now() + path.extname(file.originalname))
    }
});
const upload = multer({ storage: storage });

// 1. ดึงข้อมูลนักเรียนทั้งหมด (GET)
router.get('/', (req, res) => {
    db.query('SELECT * FROM student', (err, results) => {
        // เอา .status(500) ออกแล้ว
        if (err) return res.json({ result: 0, message: err.message });
        res.json({ result: 1, data: results, message: 'ดึงข้อมูลสำเร็จ' });
    });
});

// 2. เพิ่มข้อมูลนักเรียน (POST)
router.post('/', upload.single('image'), (req, res) => {
    const { studentId, name, score, gender } = req.body;
    let studentPicture = req.file ? req.file.filename : null;

    const sql = 'INSERT INTO student (studentId, name, score, gender, studentPicture) VALUES (?, ?, ?, ?, ?)';
    db.query(sql, [studentId, name, score, gender, studentPicture], (err, result) => {
        // เอา .status(500) ออก เพื่อให้ Angular แจ้งเตือนเรื่องรหัสซ้ำได้
        if (err) return res.json({ result: 0, message: err.message });
        res.json({ result: 1, message: 'เพิ่มข้อมูลสำเร็จ' });
    });
});

// 3. แก้ไขข้อมูลนักเรียน (PUT)
router.put('/:id', upload.single('image'), (req, res) => {
    const { id } = req.params;
    const { name, score, gender } = req.body;

    let sql = 'UPDATE student SET name = ?, score = ?, gender = ?';
    let params = [name, score, gender];

    if (req.file) {
        sql += ', studentPicture = ?';
        params.push(req.file.filename);
    }
    sql += ' WHERE studentId = ?';
    params.push(id);

    db.query(sql, params, (err, result) => {
        if (err) return res.json({ result: 0, message: err.message });
        res.json({ result: 1, message: 'แก้ไขข้อมูลสำเร็จ' });
    });
});

// 4. ลบข้อมูลนักเรียน (DELETE)
router.delete('/:id', (req, res) => {
    const { id } = req.params;
    db.query('DELETE FROM student WHERE studentId = ?', [id], (err, result) => {
        if (err) return res.json({ result: 0, message: err.message });
        res.json({ result: 1, message: 'ลบข้อมูลสำเร็จ' });
    });
});

module.exports = router;