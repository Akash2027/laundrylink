const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const pool = require('./config/db');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: ['http://localhost:3000', 'https://laundrylink-ikqrnzsed-akash2027s-projects.vercel.app', 'https://*.vercel.app'],
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Test route
app.get('/', (req, res) => {
    res.json({ message: 'LaundryLink API is running 🚀' });
});

app.get('/test-db', async (req, res) => {
    try {
        const result = await pool.query('SELECT NOW()');
        res.json({ success: true, time: result.rows[0] });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/auth/admin', require('./routes/admin'));
app.use('/api/provider', require('./routes/provider'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/images', require('./routes/images'));
app.use('/api/subscription', require('./routes/subscription'));
app.use('/api/disputes', require('./routes/disputes'));


app.listen(PORT, () => {
    console.log(`✅ Server running on port ${PORT}`);
    console.log(`📍 http://localhost:${PORT}`);
});