const express = require('express');
const { body, query } = require('express-validator');
const taskController = require('../controllers/task.controller');
const { protect } = require('../middleware/auth.middleware');

const router = express.Router();

router.use(protect);

const taskValidation = [
  body('title').trim().notEmpty().withMessage('Task title is required'),
  body('projectId').notEmpty().withMessage('Project ID is required').isMongoId(),
  body('dueDate').notEmpty().withMessage('Due date is required').isISO8601(),
];

const updateTaskValidation = [
  body('status').optional().isIn(['todo', 'in_progress', 'review', 'completed']),
  body('priority').optional().isIn(['low', 'medium', 'high', 'urgent']),
];

const commentValidation = [
  body('text').trim().notEmpty().withMessage('Comment text is required'),
];

router.post('/', taskValidation, taskController.createTask);
router.get('/', taskController.getTasks);
router.put('/:id', updateTaskValidation, taskController.updateTask);
router.post('/:id/comments', commentValidation, taskController.addComment);

module.exports = router;
