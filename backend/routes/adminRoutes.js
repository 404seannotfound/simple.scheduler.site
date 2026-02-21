const express = require('express');
const adminController = require('../controllers/adminController');

const router = express.Router();

router.get('/health', adminController.health);
router.get('/public-settings', adminController.getPublicSettings);
router.post('/bootstrap', adminController.bootstrap);
router.get('/settings', adminController.getSettings);
router.put('/settings', adminController.updateSettings);

module.exports = router;
