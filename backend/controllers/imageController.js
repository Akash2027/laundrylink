const cloudinary = require('cloudinary').v2;
const pool = require('../config/db');

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

// Upload image from base64 string
const uploadImage = async (req, res) => {
    const { order_id, image_base64 } = req.body;
    const user_id = req.user.id;
    
    if (!image_base64) {
        return res.status(400).json({ error: 'No image provided' });
    }
    
    try {
        // Verify order belongs to user
        const orderCheck = await pool.query(
            'SELECT * FROM orders WHERE id = $1 AND user_id = $2',
            [order_id, user_id]
        );
        
        if (orderCheck.rows.length === 0) {
            return res.status(403).json({ error: 'Not authorized for this order' });
        }
        
        // Upload to Cloudinary
        const result = await cloudinary.uploader.upload(image_base64, {
            folder: 'laundrylink'
        });
        
        // Save to database
        await pool.query(
            'INSERT INTO images (order_id, image_url) VALUES ($1, $2)',
            [order_id, result.secure_url]
        );
        
        res.json({
            success: true,
            image_url: result.secure_url
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Upload failed: ' + error.message });
    }
};

// Get images for an order
const getOrderImages = async (req, res) => {
    const { orderId } = req.params;
    const user_id = req.user.id;
    
    try {
        // Verify access
        const orderCheck = await pool.query(
            `SELECT o.* FROM orders o 
             JOIN providers p ON o.provider_id = p.id 
             WHERE o.id = $1 AND (o.user_id = $2 OR p.owner_id = $2)`,
            [orderId, user_id]
        );
        
        if (orderCheck.rows.length === 0) {
            return res.status(403).json({ error: 'Not authorized' });
        }
        
        const images = await pool.query(
            'SELECT image_url, uploaded_at FROM images WHERE order_id = $1',
            [orderId]
        );
        
        res.json({ images: images.rows });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
};

module.exports = { uploadImage, getOrderImages };