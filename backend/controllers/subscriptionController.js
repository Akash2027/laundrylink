const pool = require('../config/db');

// Activate premium subscription
const activatePremium = async (req, res) => {
    const user_id = req.user.id;
    const { duration_days = 30 } = req.body;
    
    try {
        const expiry_date = new Date();
        expiry_date.setDate(expiry_date.getDate() + duration_days);
        
        // Deactivate old subscription
        await pool.query(
            'UPDATE subscriptions SET is_active = false WHERE user_id = $1',
            [user_id]
        );
        
        // Create new subscription
        const result = await pool.query(
            `INSERT INTO subscriptions (user_id, is_active, expiry_date) 
             VALUES ($1, true, $2) 
             RETURNING *`,
            [user_id, expiry_date]
        );
        
        res.json({
            success: true,
            subscription: result.rows[0],
            message: `Premium activated until ${expiry_date.toLocaleDateString()}`
        });
    } catch (error) {
        console.error('Premium activation error:', error);
        res.status(500).json({ error: 'Server error: ' + error.message });
    }
};

// Check subscription status
const checkSubscription = async (req, res) => {
    const user_id = req.user.id;
    
    try {
        const result = await pool.query(
            `SELECT * FROM subscriptions 
             WHERE user_id = $1 AND is_active = true AND expiry_date > NOW()`,
            [user_id]
        );
        
        const isPremium = result.rows.length > 0;
        
        res.json({
            is_premium: isPremium,
            subscription: result.rows[0] || null
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
};

module.exports = { activatePremium, checkSubscription };