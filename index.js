const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors'); // 👈 1. นำเข้า cors เข้ามาช่วยปลดล็อก
const app = express();
require('dotenv').config();

// 👈 2. เปิดใช้งาน cors ให้ทำงานกับทุกๆ เส้นทาง
app.use(cors());

const port = process.env.PORT || 3000;
const teacher = require('./teacher'); // นำเข้า Route ของ Teacher
const student = require('./student'); // 🚀 นำเข้า Route ของ Student เพิ่มเข้ามา

// ตั้งค่า Middleware สำหรับแปลงข้อมูล
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// ==========================================
// ✅ ส่วนสำคัญที่อาจารย์เพิ่งสอน (Static Files)
// ==========================================
// เปิดให้เข้าถึงไฟล์ในโฟลเดอร์ public ได้ผ่าน URL ที่ขึ้นต้นด้วย /download
// เช่น: http://localhost:3000/download/images/ชื่อไฟล์.jpg
app.use('/download', express.static('public'));

// เส้นทางหลัก (Routes)
app.use('/teacher', teacher);
app.use('/student', student); // 🚀 เปิดสวิตช์ใช้งานเส้นทาง /student

// Route หน้าแรก
app.get('/', (req, res) => {
    res.send('Hello World!');
});

// เริ่มต้น Server
app.listen(port, () => {
    console.log(`Example app listening on port ${port}`);
});