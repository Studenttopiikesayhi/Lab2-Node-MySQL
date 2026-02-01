const express = require('express');
const app = express();
const port = 3000;
const teacher = require('./teacher'); // บรรทัดนี้ต้องอยู่ตรงนี้ครับ

app.get('/', (req, res) => {
    res.send('Hello World! This is Lab 2 MySQL Connection');
});

app.use('/teacher', teacher); // เพิ่มบรรทัดนี้เพื่อให้เรียกใช้ไฟล์ teacher ได้ครับ

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`);
});