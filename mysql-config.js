require('dotenv').config(); // เรียกใช้งาน dotenv เพื่ออ่านไฟล์ .env
const mysql = require('mysql2');

// ตั้งค่าการเชื่อมต่อโดยดึงค่าจาก process.env
const connection = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT || 3306
});

connection.connect((err) => {
    if (err) {
        console.error('Error connecting to MySQL:', err);
        return;
    }
    // เพิ่มข้อความยืนยันว่าใช้ระบบ .env แล้ว
    console.log('Connected to MySQL database! (Securely using .env)');
});

module.exports = connection; // ส่งออกตัวเชื่อมต่อให้คนอื่นใช้