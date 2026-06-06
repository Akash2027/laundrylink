const express = require('express');
const router = express.Router();
const { 
    getNearbyProviders,
    getProviderDetails,
    createOrder,
    getOrder,
    updateOrderStatus,
    getProviderOrders,
    getCustomerOrders
} = require('../controllers/orderController');
const { authMiddleware, isProvider } = require('../middleware/auth');

// All routes require authentication
router.use(authMiddleware);

// Customer routes
router.get('/providers/nearby', getNearbyProviders);
router.get('/providers/:providerId', getProviderDetails);
router.post('/create', createOrder);
router.get('/my-orders', getCustomerOrders);
router.get('/:orderId', getOrder);

// Provider routes
router.get('/provider/orders', isProvider, getProviderOrders);
router.put('/:orderId/status', isProvider, updateOrderStatus);

module.exports = router;