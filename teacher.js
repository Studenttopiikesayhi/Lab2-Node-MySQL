const express = require('express');
const router = express.Router();
const connection = require('./mysql-config');
const multer = require('multer');
const path = require('path');
const fs = require('fs'); // ใช้จัดการสร้างโฟลเดอร์อัตโนมัติ

// ==========================================
// 1. ตั้งค่าการเก็บไฟล์ (Multer Storage Config)
// ==========================================
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        // กำหนดเส้นทางโฟลเดอร์ปลายทาง
        const imagePath = './public/images';
        const filePath = './public/files';

        // สร้างโฟลเดอร์ให้อัตโนมัติถ้ายังไม่มี (Best Practice)
        if (!fs.existsSync(imagePath)) fs.mkdirSync(imagePath, { recursive: true });
        if (!fs.existsSync(filePath)) fs.mkdirSync(filePath, { recursive: true });

        // Logic แยกประเภทไฟล์: รูปภาพไป images / ไฟล์อื่นไป files
        if (file.mimetype.startsWith('image/')) {
            cb(null, imagePath);
        } else {
            cb(null, filePath);
        }
    },
    filename: (req, file, cb) => {
        // ตั้งชื่อไฟล์: teacher-เวลา-เลขสุ่ม.นามสกุล (ป้องกันชื่อซ้ำ 100%)
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'teacher-' + uniqueSuffix + path.extname(file.originalname));
    }
});

// ==========================================
// 2. กำหนดเงื่อนไขการอัปโหลด (Security & Limits)
// ==========================================
const upload = multer({
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024 // จำกัดขนาดไฟล์ไม่เกิน 5 MB (ตามอาจารย์)
    },
    fileFilter: (req, file, cb) => {
        // เช็คประเภทไฟล์: รับแค่ รูปภาพ (JPEG, PNG) และเอกสาร PDF เท่านั้น
        const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf'];

        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true); // ผ่าน! อนุญาตให้บันทึก
        } else {
            // ไม่ผ่าน! ส่ง Error กลับไป
            cb(new Error('Invalid file type. Only JPEG, PNG and PDF are allowed.'));
        }
    }
});

// ==========================================
// 3. เริ่มต้นเขียน Routes (CRUD)
// ==========================================

// GET: ดึงข้อมูลอาจารย์ทั้งหมด
router.get('/', (req, res) => {
    const sql = 'SELECT * FROM teacher ORDER BY teacherId ASC';
    connection.query(sql, (err, results) => {
        if (err) return res.status(500).json({ result: 0, message: err });
        res.json({ result: 1, data: results, message: 'Query OK' });
    });
});

// GET: ดึงข้อมูลตามรหัส (By ID)
router.get('/:id', (req, res) => {
    const id = req.params.id;
    const sql = 'SELECT * FROM teacher WHERE teacherId = ?';
    connection.query(sql, [id], (err, results) => {
        if (err) return res.status(500).json({ result: 0, message: err });
        if (results.length > 0) {
            res.json({ result: 1, data: results });
        } else {
            res.status(404).json({ result: 0, message: 'ไม่พบข้อมูลอาจารย์' });
        }
    });
});

// POST: เพิ่มข้อมูลอาจารย์ + อัปโหลดรูป (Upload Image)
router.post('/', (req, res) => {
    // ใช้ upload.single แบบ manual เพื่อดักจับ Error เรื่องขนาด/ประเภทไฟล์
    upload.single('image')(req, res, (err) => {
        if (err instanceof multer.MulterError) {
            // Error จาก Multer (เช่น ไฟล์ใหญ่เกิน)
            return res.status(400).json({ result: 0, message: 'File too large (Max 5MB)' });
        } else if (err) {
            // Error จาก FileFilter (เช่น นามสกุลไม่ถูกต้อง)
            return res.status(400).json({ result: 0, message: err.message });
        }

        // ถ้าผ่านการอัปโหลดมาได้ ให้ทำงานต่อ
        const { teacherId, teacherName, department } = req.body;
        const teacherPicture = req.file ? req.file.filename : "";

        const sql = 'INSERT INTO teacher (teacherId, teacherName, department, teacherPicture) VALUES (?, ?, ?, ?)';
        connection.query(sql, [teacherId, teacherName, department, teacherPicture], (dbErr, results) => {
            if (dbErr) {
                if (dbErr.code === 'ER_DUP_ENTRY') return res.json({ result: 0, message: 'รหัสอาจารย์ซ้ำ' });
                return res.json({ result: 0, message: dbErr });
            }
            res.status(201).json({
                result: 1,
                message: 'เพิ่มข้อมูลและอัปโหลดรูปสำเร็จ',
                data: results,
                filename: teacherPicture
            });
        });
    });
});

// PUT: แก้ไขข้อมูลอาจารย์ (รองรับการเปลี่ยนรูปภาพ)
router.put('/:id', (req, res) => {
    upload.single('image')(req, res, (err) => {
        if (err) return res.status(400).json({ result: 0, message: err.message });

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
            if (dbErr) return res.json({ result: 0, message: dbErr });
            if (results.affectedRows === 0) return res.status(404).json({ result: 0, message: 'ไม่พบข้อมูลที่จะแก้ไข' });
            res.json({ result: 1, message: 'แก้ไขข้อมูลเรียบร้อย' });
        });
    });
});

// DELETE: ลบข้อมูลอาจารย์
router.delete('/:id', (req, res) => {
    const id = req.params.id;
    const sql = 'DELETE FROM teacher WHERE teacherId = ?';
    connection.query(sql, [id], (err, results) => {
        if (err) return res.json({ result: 0, message: err });
        if (results.affectedRows === 0) return res.status(404).json({ result: 0, message: 'ไม่พบข้อมูลที่จะลบ' });
        res.json({ result: 1, message: 'ลบข้อมูลเรียบร้อย' });
    });
});

module.exports = router;