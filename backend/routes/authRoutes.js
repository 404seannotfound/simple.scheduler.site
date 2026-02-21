const express = require('express');
const authController = require('../controllers/authController');
const auth = require('../middleware/auth');

const router = express.Router();

router.post('/register', authController.register);
router.get('/verify/:token', authController.verify);
router.post('/login', authController.login);
router.get('/availability', auth, authController.getAvailability);
router.put('/availability', auth, authController.updateAvailability);
router.get('/google', authController.googleAuth);
router.get('/google/callback', authController.googleCallback);

module.exports = router;
