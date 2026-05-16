const express = require('express');
const dashboardController = require('../controllers/dashboard.controller');
const { protect } = require('../middleware/auth.middleware');

const router = express.Router();

router.use(protect);

// Only this route - we know it exists
router.get('/stats', dashboardController.getDashboardStats);

// Commented out - functions not created yet
// router.get('/overdue-tasks', dashboardController.getOverdueTasks);
// router.get('/team-performance', dashboardController.getTeamPerformance);

module.exports = router;