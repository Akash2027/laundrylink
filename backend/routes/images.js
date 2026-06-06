const express = require('express');
const router = express.Router();
const multer = require('multer');
const { uploadImage, getOrderImages } = require('../controllers/imageController');
const { authMiddleware } = require('../middleware/auth');

// Configure multer for memory storage
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// All routes require authentication
router.use(authMiddleware);

// Upload image
router.post('/upload', upload.single('image'), uploadImage);

// Get order images
router.get('/order/:orderId', getOrderImages);

module.exports = router;