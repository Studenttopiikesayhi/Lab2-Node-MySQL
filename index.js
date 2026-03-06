const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const app = express();
require('dotenv').config();

// เปิดใช้งาน cors ให้ทำงานกับทุกๆ เส้นทาง
app.use(cors());

const port = process.env.PORT || 3000;
const teacher = require('./teacher');
const student = require('./student');

// ตั้งค่า Middleware สำหรับแปลงข้อมูล
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// ==========================================
// ✅ ส่วน Static Files (อาจารย์สอนล่าสุด)
// ==========================================
app.use('/download', express.static('public'));

// ==========================================
// 🚀 เส้นทางหลัก (Routes)
// ==========================================
/* 💡 หมายเหตุจากเลขา: ผมเอา verifyToken ออกจากบรรทัดด้านล่างนี้
   เพื่อให้สามารถเรียกเข้าหน้า /teacher/login และ /student/login ได้
   ส่วนการล็อกข้อมูลส่วนอื่น ทำไว้ในไฟล์ teacher.js และ student.js เรียบร้อยแล้วครับ
*/
app.use('/teacher', teacher);
app.use('/student', student);

// Route หน้าแรก
app.get('/', (req, res) => {
    res.send('Hello World! ระบบปลดล็อกหน้า Login ให้แล้วครับ');
});

// เริ่มต้น Server
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});