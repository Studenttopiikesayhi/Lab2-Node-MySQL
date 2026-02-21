const express = require('express');
const bodyParser = require('body-parser'); // แก้ชื่อตัวแปรให้เป็นมาตรฐาน (CamelCase)
const app = express();
require('dotenv').config();

const port = process.env.PORT || 3000;
const teacher = require('./teacher'); // นำเข้า Route ของ Teacher

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

// Route หน้าแรก
app.get('/', (req, res) => {
    res.send('Hello World!');
});

// เริ่มต้น Server
app.listen(port, () => {
    console.log(`Example app listening on port ${port}`);
});