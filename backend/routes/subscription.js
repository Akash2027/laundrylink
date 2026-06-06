const express = require('express');
const router = express.Router();
const { activatePremium, checkSubscription } = require('../controllers/subscriptionController');
const { authMiddleware } = require('../middleware/auth');

router.use(authMiddleware);

router.post('/activate', activatePremium);
router.get('/status', checkSubscription);

module.exports = router;