const pool = require('../config/db');

// Register provider business (after user registration)
const registerProvider = async (req, res) => {
    const { shop_name, address, latitude, longitude, service_radius_km } = req.body;
    const user_id = req.user.id;
    
    try {
        // Check if user is customer (must update role to provider)
        const userCheck = await pool.query('SELECT role FROM users WHERE id = $1', [user_id]);
        
        if (userCheck.rows[0].role !== 'customer') {
            return res.status(400).json({ error: 'User already has a role assigned' });
        }
        
        // Create provider
        const result = await pool.query(
            `INSERT INTO providers (owner_id, shop_name, address, latitude, longitude, service_radius_km) 
             VALUES ($1, $2, $3, $4, $5, $6) 
             RETURNING *`,
            [user_id, shop_name, address, latitude, longitude, service_radius_km || 5]
        );
        
        // Update user role to provider
        await pool.query('UPDATE users SET role = $1 WHERE id = $2', ['provider', user_id]);
        
        res.status(201).json({
            success: true,
            provider: result.rows[0]
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
};

// Set pricing for services
const setPricing = async (req, res) => {
    const { pricing_data } = req.body; // Array of {item_type, service_type, price_per_item}
    const user_id = req.user.id;
    
    try {
        // Get provider id
        const provider = await pool.query('SELECT id FROM providers WHERE owner_id = $1', [user_id]);
        
        if (provider.rows.length === 0) {
            return res.status(404).json({ error: 'Provider not found' });
        }
        
        const provider_id = provider.rows[0].id;
        
        // Insert or update pricing
        for (const item of pricing_data) {
            await pool.query(
                `INSERT INTO pricing (provider_id, item_type, service_type, price_per_item) 
                 VALUES ($1, $2, $3, $4) 
                 ON CONFLICT (provider_id, item_type, service_type) 
                 DO UPDATE SET price_per_item = $4`,
                [provider_id, item.item_type, item.service_type, item.price_per_item]
            );
        }
        
        res.json({ success: true, message: 'Pricing saved successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
};

// Get provider profile
const getProviderProfile = async (req, res) => {
    const user_id = req.user.id;
    
    try {
        const result = await pool.query(
            `SELECT p.*, u.name, u.email, u.phone 
             FROM providers p 
             JOIN users u ON p.owner_id = u.id 
             WHERE p.owner_id = $1`,
            [user_id]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Provider not found' });
        }
        
        // Get pricing
        const pricing = await pool.query(
            'SELECT item_type, service_type, price_per_item FROM pricing WHERE provider_id = $1',
            [result.rows[0].id]
        );
        
        res.json({
            provider: result.rows[0],
            pricing: pricing.rows
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
};

// Update provider profile
const updateProvider = async (req, res) => {
    const { shop_name, address, latitude, longitude, service_radius_km } = req.body;
    const user_id = req.user.id;
    
    try {
        const result = await pool.query(
            `UPDATE providers 
             SET shop_name = COALESCE($1, shop_name),
                 address = COALESCE($2, address),
                 latitude = COALESCE($3, latitude),
                 longitude = COALESCE($4, longitude),
                 service_radius_km = COALESCE($5, service_radius_km)
             WHERE owner_id = $6
             RETURNING *`,
            [shop_name, address, latitude, longitude, service_radius_km, user_id]
        );
        
        res.json({ success: true, provider: result.rows[0] });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
};

module.exports = { registerProvider, setPricing, getProviderProfile, updateProvider };