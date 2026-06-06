const express = require('express');
const router = express.Router();
const { verifyAdminCode } = require('../controllers/adminController');

router.post('/verify', verifyAdminCode);

module.exports = router;