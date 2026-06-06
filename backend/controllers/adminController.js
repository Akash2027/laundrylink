const pool = require('../config/db');
const jwt = require('jsonwebtoken');

// Simple admin code
const ADMIN_CODE = "123456";

const verifyAdminCode = async (req, res) => {
    const { code } = req.body;
    
    if (code !== ADMIN_CODE) {
        return res.status(400).json({ error: 'Invalid admin code' });
    }
    
    const email = 'admin@laundrylink.com';
    
    // Check if admin exists in database, if not create
    let adminUser = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    
    if (adminUser.rows.length === 0) {
        const result = await pool.query(
            'INSERT INTO users (name, email, password, role) VALUES ($1, $2, $3, $4) RETURNING *',
            ['Super Admin', email, 'admin_auth', 'admin']
        );
        adminUser = result;
    } else {
        // Make sure role is admin
        if (adminUser.rows[0].role !== 'admin') {
            await pool.query('UPDATE users SET role = $1 WHERE email = $2', ['admin', email]);
            adminUser = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        }
    }
    
    const user = adminUser.rows[0];
    
    // Create JWT token
    const token = jwt.sign(
        { id: user.id, email: user.email, role: 'admin' },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
    );
    
    res.json({
        success: true,
        token,
        user: { id: user.id, name: user.name, email: user.email, role: 'admin' }
    });
};

module.exports = { verifyAdminCode };