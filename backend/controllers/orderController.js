const pool = require('../config/db');

// Calculate distance between two coordinates (Haversine formula)
const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
};

// Get nearby providers
const getNearbyProviders = async (req, res) => {
    const { latitude, longitude } = req.query;
    
    try {
        // Get all active providers
        const providers = await pool.query(
            `SELECT p.*, u.name as owner_name, u.phone 
             FROM providers p 
             JOIN users u ON p.owner_id = u.id 
             WHERE p.is_active = true`
        );
        
        // Calculate distance and filter
        const nearbyProviders = [];
        for (const provider of providers.rows) {
            const distance = calculateDistance(
                parseFloat(latitude), 
                parseFloat(longitude),
                parseFloat(provider.latitude), 
                parseFloat(provider.longitude)
            );
            
            if (distance <= provider.service_radius_km) {
                nearbyProviders.push({
                    ...provider,
                    distance_km: parseFloat(distance.toFixed(2))
                });
            }
        }
        
        // Sort by distance
        nearbyProviders.sort((a, b) => a.distance_km - b.distance_km);
        
        res.json({ providers: nearbyProviders });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
};

// Get provider details with pricing
const getProviderDetails = async (req, res) => {
    const { providerId } = req.params;
    
    try {
        const provider = await pool.query(
            `SELECT p.*, u.name as owner_name, u.phone, u.email 
             FROM providers p 
             JOIN users u ON p.owner_id = u.id 
             WHERE p.id = $1`,
            [providerId]
        );
        
        if (provider.rows.length === 0) {
            return res.status(404).json({ error: 'Provider not found' });
        }
        
        const pricing = await pool.query(
            'SELECT item_type, service_type, price_per_item FROM pricing WHERE provider_id = $1',
            [providerId]
        );
        
        res.json({
            provider: provider.rows[0],
            pricing: pricing.rows
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
};

// Check if user has active premium subscription
const checkPremium = async (userId) => {
    const result = await pool.query(
        `SELECT * FROM subscriptions 
         WHERE user_id = $1 AND is_active = true AND expiry_date > NOW()`,
        [userId]
    );
    return result.rows.length > 0;
};

// Create order
const createOrder = async (req, res) => {
    const { 
        provider_id, 
        items, 
        pickup, 
        delivery,
        customer_latitude,
        customer_longitude,
        customer_address
    } = req.body;
    
    const user_id = req.user.id;
    
    try {
        // Get provider
        const provider = await pool.query('SELECT * FROM providers WHERE id = $1', [provider_id]);
        if (provider.rows.length === 0) {
            return res.status(404).json({ error: 'Provider not found' });
        }
        
        // Calculate items total
        let itemsTotal = 0;
        const orderItems = [];
        
        for (const item of items) {
            // Get price from pricing table
            const priceResult = await pool.query(
                'SELECT price_per_item FROM pricing WHERE provider_id = $1 AND item_type = $2 AND service_type = $3',
                [provider_id, item.item_type, item.service_type]
            );
            
            if (priceResult.rows.length === 0) {
                return res.status(400).json({ error: `Price not found for ${item.item_type} - ${item.service_type}` });
            }
            
            const pricePerItem = parseFloat(priceResult.rows[0].price_per_item);
            const totalPrice = pricePerItem * item.quantity;
            itemsTotal += totalPrice;
            
            orderItems.push({
                item_type: item.item_type,
                quantity: item.quantity,
                service_type: item.service_type,
                price_per_item: pricePerItem,
                total_price: totalPrice
            });
        }
        
        // Check premium subscription
        const isPremium = await checkPremium(user_id);
        
        // Calculate pickup/delivery fees
        let pickupFee = (pickup === true || pickup === 'true') ? 30 : 0;
        let deliveryFee = (delivery === true || delivery === 'true') ? 30 : 0;
        let discountAmount = 0;
        
        // Apply premium benefits
        if (isPremium) {
            discountAmount = itemsTotal * 0.10; // 10% discount
            pickupFee = 0;
            deliveryFee = 0;
        } 
        // Apply free delivery rule (if items total >= 700)
        else if (itemsTotal >= 700) {
            pickupFee = 0;
            deliveryFee = 0;
        }
        
        const totalAmount = itemsTotal + pickupFee + deliveryFee - discountAmount;
        
        // Create order
        const orderResult = await pool.query(
            `INSERT INTO orders (user_id, provider_id, total_amount, pickup, delivery, pickup_fee, delivery_fee, discount_amount, status) 
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'requested') 
             RETURNING *`,
            [user_id, provider_id, totalAmount, pickup, delivery, pickupFee, deliveryFee, discountAmount]
        );
        
        const orderId = orderResult.rows[0].id;
        
        // Add order items
        for (const item of orderItems) {
            await pool.query(
                `INSERT INTO order_items (order_id, item_type, quantity, service_type, price_per_item, total_price) 
                 VALUES ($1, $2, $3, $4, $5, $6)`,
                [orderId, item.item_type, item.quantity, item.service_type, item.price_per_item, item.total_price]
            );
        }
        
        res.status(201).json({
            success: true,
            order_id: orderId,
            order: orderResult.rows[0],
            items: orderItems,
            is_premium_applied: isPremium,
            breakdown: {
                items_total: itemsTotal,
                pickup_fee: pickupFee,
                delivery_fee: deliveryFee,
                discount: discountAmount,
                total: totalAmount
            }
        });
        
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
};

// Get order details
const getOrder = async (req, res) => {
    const { orderId } = req.params;
    const user_id = req.user.id;
    
    try {
        const order = await pool.query(
            `SELECT o.*, p.shop_name, p.address as provider_address, u.name as customer_name 
             FROM orders o 
             JOIN providers p ON o.provider_id = p.id 
             JOIN users u ON o.user_id = u.id 
             WHERE o.id = $1 AND (o.user_id = $2 OR p.owner_id = $2)`,
            [orderId, user_id]
        );
        
        if (order.rows.length === 0) {
            return res.status(404).json({ error: 'Order not found' });
        }
        
        const items = await pool.query(
            'SELECT * FROM order_items WHERE order_id = $1',
            [orderId]
        );
        
        const images = await pool.query(
            'SELECT image_url FROM images WHERE order_id = $1',
            [orderId]
        );
        
        res.json({
            order: order.rows[0],
            items: items.rows,
            images: images.rows
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
};

// Update order status (for provider)
const updateOrderStatus = async (req, res) => {
    const { orderId } = req.params;
    const { status } = req.body;
    const user_id = req.user.id;
    
    const allowedStatuses = ['accepted', 'picked_up', 'washing', 'drying', 'ironing', 'ready', 'delivered'];
    
    if (!allowedStatuses.includes(status)) {
        return res.status(400).json({ error: 'Invalid status' });
    }
    
    try {
        // Verify provider owns this order
        const orderCheck = await pool.query(
            `SELECT o.id FROM orders o 
             JOIN providers p ON o.provider_id = p.id 
             WHERE o.id = $1 AND p.owner_id = $2`,
            [orderId, user_id]
        );
        
        if (orderCheck.rows.length === 0) {
            return res.status(403).json({ error: 'Not authorized' });
        }
        
        const result = await pool.query(
            'UPDATE orders SET status = $1 WHERE id = $2 RETURNING *',
            [status, orderId]
        );
        
        res.json({ success: true, order: result.rows[0] });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
};

// Get provider orders
const getProviderOrders = async (req, res) => {
    const user_id = req.user.id;
    
    try {
        const orders = await pool.query(
            `SELECT o.*, u.name as customer_name, u.address as customer_address 
             FROM orders o 
             JOIN providers p ON o.provider_id = p.id 
             JOIN users u ON o.user_id = u.id 
             WHERE p.owner_id = $1 
             ORDER BY o.created_at DESC`,
            [user_id]
        );
        
        res.json({ orders: orders.rows });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
};

// Get customer orders
const getCustomerOrders = async (req, res) => {
    const user_id = req.user.id;
    
    try {
        const orders = await pool.query(
            `SELECT o.*, p.shop_name 
             FROM orders o 
             JOIN providers p ON o.provider_id = p.id 
             WHERE o.user_id = $1 
             ORDER BY o.created_at DESC`,
            [user_id]
        );
        
        res.json({ orders: orders.rows });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
};

module.exports = {
    getNearbyProviders,
    getProviderDetails,
    createOrder,
    getOrder,
    updateOrderStatus,
    getProviderOrders,
    getCustomerOrders
};