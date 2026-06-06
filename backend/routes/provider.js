const express = require('express');
const router = express.Router();
const { 
    registerProvider, 
    setPricing, 
    getProviderProfile, 
    updateProvider 
} = require('../controllers/providerController');
const { authMiddleware } = require('../middleware/auth');

// All routes require authentication
router.use(authMiddleware);

// Provider routes
router.post('/register-business', registerProvider);
router.post('/set-pricing', setPricing);
router.get('/profile', getProviderProfile);
router.put('/update', updateProvider);

module.exports = router;