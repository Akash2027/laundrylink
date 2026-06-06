const pool = require('../config/db');

// Create dispute (Customer)
const createDispute = async (req, res) => {
    const { order_id, item_type, missing_quantity, description } = req.body;
    const user_id = req.user.id;
    
    try {
        // Verify order belongs to user
        const orderCheck = await pool.query(
            'SELECT * FROM orders WHERE id = $1 AND user_id = $2 AND status = $3',
            [order_id, user_id, 'delivered']
        );
        
        if (orderCheck.rows.length === 0) {
            return res.status(403).json({ error: 'Order not found or not delivered yet' });
        }
        
        // Check if dispute already exists
        const existingDispute = await pool.query(
            'SELECT * FROM disputes WHERE order_id = $1 AND status != $2',
            [order_id, 'resolved']
        );
        
        if (existingDispute.rows.length > 0) {
            return res.status(400).json({ error: 'Dispute already exists for this order' });
        }
        
        const result = await pool.query(
            `INSERT INTO disputes (order_id, item_type, missing_quantity, description, status) 
             VALUES ($1, $2, $3, $4, 'open') 
             RETURNING *`,
            [order_id, item_type, missing_quantity, description]
        );
        
        res.status(201).json({
            success: true,
            dispute: result.rows[0]
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
};

// Respond to dispute (Provider)
const respondToDispute = async (req, res) => {
    const { dispute_id, accept, explanation } = req.body;
    const user_id = req.user.id;
    
    try {
        // Verify provider owns this order
        const disputeCheck = await pool.query(
            `SELECT d.*, o.provider_id, p.owner_id 
             FROM disputes d 
             JOIN orders o ON d.order_id = o.id 
             JOIN providers p ON o.provider_id = p.id 
             WHERE d.id = $1 AND p.owner_id = $2`,
            [dispute_id, user_id]
        );
        
        if (disputeCheck.rows.length === 0) {
            return res.status(403).json({ error: 'Not authorized' });
        }
        
        const dispute = disputeCheck.rows[0];
        
        if (dispute.status !== 'open') {
            return res.status(400).json({ error: 'Dispute already responded' });
        }
        
        let newStatus = 'provider_responded';
        let refundAmount = null;
        
        if (accept) {
            newStatus = 'resolved';
            // Calculate refund amount based on missing quantity
            const orderItems = await pool.query(
                'SELECT price_per_item FROM order_items WHERE order_id = $1 AND item_type = $2',
                [dispute.order_id, dispute.item_type]
            );
            
            if (orderItems.rows.length > 0) {
                refundAmount = orderItems.rows[0].price_per_item * dispute.missing_quantity;
            }
        }
        
        const result = await pool.query(
            `UPDATE disputes 
             SET status = $1, provider_response = $2, refund_amount = $3 
             WHERE id = $4 
             RETURNING *`,
            [newStatus, explanation || (accept ? 'Accepted by provider' : 'Rejected by provider'), refundAmount, dispute_id]
        );
        
        // If accepted, process refund in payments
        if (accept && refundAmount > 0) {
            await pool.query(
                `UPDATE payments 
                 SET status = 'refunded' 
                 WHERE order_id = $1 AND status = 'completed'`,
                [dispute.order_id]
            );
        }
        
        res.json({
            success: true,
            dispute: result.rows[0],
            refund_amount: refundAmount
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
};

// Admin resolve dispute
const adminResolveDispute = async (req, res) => {
    const { dispute_id, approve, admin_notes } = req.body;
    
    // Check if user is admin (will add middleware later)
    if (req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Admin only' });
    }
    
    try {
        const disputeCheck = await pool.query(
            'SELECT * FROM disputes WHERE id = $1',
            [dispute_id]
        );
        
        if (disputeCheck.rows.length === 0) {
            return res.status(404).json({ error: 'Dispute not found' });
        }
        
        const dispute = disputeCheck.rows[0];
        
        let newStatus = approve ? 'resolved' : 'rejected';
        let refundAmount = null;
        
        if (approve) {
            // Calculate refund
            const orderItems = await pool.query(
                'SELECT price_per_item FROM order_items WHERE order_id = $1 AND item_type = $2',
                [dispute.order_id, dispute.item_type]
            );
            
            if (orderItems.rows.length > 0) {
                refundAmount = orderItems.rows[0].price_per_item * dispute.missing_quantity;
            }
            
            // Process refund
            await pool.query(
                `UPDATE payments 
                 SET status = 'refunded' 
                 WHERE order_id = $1 AND status = 'completed'`,
                [dispute.order_id]
            );
        }
        
        const result = await pool.query(
            `UPDATE disputes 
             SET status = $1, admin_decision = $2, refund_amount = $3, resolved_at = NOW() 
             WHERE id = $4 
             RETURNING *`,
            [newStatus, admin_notes || (approve ? 'Approved by admin' : 'Rejected by admin'), refundAmount, dispute_id]
        );
        
        res.json({
            success: true,
            dispute: result.rows[0],
            refund_amount: refundAmount
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
};

// Get disputes for an order
const getOrderDisputes = async (req, res) => {
    const { orderId } = req.params;
    const user_id = req.user.id;
    
    try {
        const orderCheck = await pool.query(
            `SELECT o.*, p.owner_id 
             FROM orders o 
             JOIN providers p ON o.provider_id = p.id 
             WHERE o.id = $1 AND (o.user_id = $2 OR p.owner_id = $2)`,
            [orderId, user_id]
        );
        
        if (orderCheck.rows.length === 0) {
            return res.status(403).json({ error: 'Not authorized' });
        }
        
        const disputes = await pool.query(
            'SELECT * FROM disputes WHERE order_id = $1 ORDER BY created_at DESC',
            [orderId]
        );
        
        res.json({ disputes: disputes.rows });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
};

module.exports = { createDispute, respondToDispute, adminResolveDispute, getOrderDisputes };