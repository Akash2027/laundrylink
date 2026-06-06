const express = require('express');
const router = express.Router();
const { 
    createDispute, 
    respondToDispute, 
    adminResolveDispute, 
    getOrderDisputes 
} = require('../controllers/disputeController');
const { authMiddleware, isAdmin } = require('../middleware/auth');

router.use(authMiddleware);

router.post('/create', createDispute);
router.post('/respond', respondToDispute);
router.post('/admin-resolve', isAdmin, adminResolveDispute);
router.get('/order/:orderId', getOrderDisputes);

module.exports = router;