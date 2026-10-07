require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const { engine } = require('express-handlebars');

const app = express();
app.use(express.urlencoded({ extended: true }));
app.engine('hbs', engine({ extname: '.hbs', defaultLayout: false }));
app.set('view engine', 'hbs');

const MSSV = '23IT034'; 
const FULLNAME = 'Nguyễn Văn Cường'; 
const prefixMSSV = MSSV.slice(-3); // '034'

// Ép cứng hoặc tính chuẩn xác tuyệt đối thuế VAT = 8%
const vatRate = 8; 

const connRead = mongoose.createConnection(process.env.MONGO_URI_READ);
const connWrite = mongoose.createConnection(process.env.MONGO_URI_WRITE);

const bookSchema = new mongoose.Schema({
    code: String,
    name: String,
    priceBeforeTax: Number,
    priceAfterTax: Number
});

const BookRead = connRead.model('Book', bookSchema, 'books');
const BookWrite = connWrite.model('Book', bookSchema, 'books');

app.get('/', async (req, res) => {
    try {
        const books = await BookRead.find().lean();
        res.render('home', { books, fullname: FULLNAME, mssv: MSSV, vatRate });
    } catch (err) {
        res.status(500).send("Lỗi đọc database: " + err.message);
    }
});

app.post('/add', async (req, res) => {
    try {
        const { code, name, price } = req.body;
        
        if (!code.startsWith(prefixMSSV)) {
            return res.status(400).send(`<h3>TỪ CHỐI XỬ LÝ: Mã sách bắt buộc phải bắt đầu bằng '${prefixMSSV}' của sinh viên ${MSSV}</h3><a href="/">Quay lại</a>`);
        }

        const priceNum = parseFloat(price);
        // Tính toán tường minh giá sau VAT 8% (10000 * 1.08 = 10800)
        const priceAfterTax = priceNum + (priceNum * vatRate) / 100;

        const newBook = new BookWrite({ 
            code, 
            name, 
            priceBeforeTax: priceNum, 
            priceAfterTax: priceAfterTax 
        });

        await newBook.save();
        res.redirect('/');
    } catch (err) {
        res.status(500).send("Lỗi ghi database: " + err.message);
    }
});

app.listen(process.env.PORT || 3000, () => console.log('Server dang chay tai port 3000...'));