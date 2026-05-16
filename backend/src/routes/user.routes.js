const express = require('express');
const { body } = require('express-validator');
const userController = require('../controllers/user.controller');
const { protect } = require('../middleware/auth.middleware');

const router = express.Router();
router.use(protect);

router.get('/profile', userController.getProfile);
router.put('/profile', body('name').optional().trim(), userController.updateProfile);

module.exports = router;
