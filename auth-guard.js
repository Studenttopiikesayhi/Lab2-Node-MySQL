const jwt = require('jsonwebtoken');
require('dotenv').config();

// สร้างฟังก์ชัน รปภ. (Middleware)
const authGuard = (req, res, next) => {
    // 1. ดึงข้อมูลจากช่อง Authorization ใน HTTP Header
    const authHeader = req.headers['authorization'];

    // ถ้าไม่มีการส่งค่ามาเลย (แอบเข้า) ให้เตะออก
    if (!authHeader) {
        return res.json({
            result: 0,
            status: 401,
            message: 'Unauthorized: ไม่อนุญาตให้เข้าถึง กรุณาส่ง Token'
        });
    }

    // 2. ตัดคำว่า "Bearer " ทิ้งไป เพื่อเอาเฉพาะก้อน Token (เอาตำแหน่งที่ 1)
    const token = authHeader.split(' ')[1];

    // ถ้าหา Token ไม่เจอ
    if (!token) {
        return res.json({
            result: 0,
            status: 401,
            message: 'Unauthorized: รูปแบบ Token ไม่ถูกต้อง'
        });
    }

    // 3. ตรวจสอบ Token ว่าของแท้ไหม และหมดอายุหรือยัง? (เช็คด้วย JWT_SECRET ของเรา)
    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
        // ถ้า Token ปลอม หรือ หมดอายุ
        if (err) {
            return res.json({
                result: 0,
                status: 403,
                message: 'Forbidden: Token ไม่ถูกต้อง หรือ หมดอายุแล้ว'
            });
        }

        // 4. ถ้าตั๋วถูกต้อง! ให้ฝังข้อมูล User (ที่แกะรหัสมาได้) ใส่ไว้ใน req.user
        // เผื่อ API ปลายทางอยากรู้ว่าใครเป็นคนกดใช้งาน
        req.user = decoded;

        // 5. ปล่อยให้ผ่านประตูไปทำงาน API ที่เรียกไว้ต่อ (ถ้าลืมบรรทัดนี้เว็บจะค้าง!)
        next();
    });
};

// ส่งออกรปภ. ไปให้ไฟล์อื่นเรียกใช้
module.exports = authGuard;