const express = require('express');
const dashboardController = require('../controllers/dashboard.controller');
const { protect } = require('../middleware/auth.middleware');

const router = express.Router();

// All routes require authentication
router.use(protect);

// Routes
router.get('/stats', dashboardController.getDashboardStats);
router.get('/overdue-tasks', dashboardController.getOverdueTasks);
router.get('/team-performance', dashboardController.getTeamPerformance);

module.exports = router;