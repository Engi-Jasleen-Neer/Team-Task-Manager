const express = require('express');
const { body } = require('express-validator');
const projectController = require('../controllers/project.controller');
const { protect } = require('../middleware/auth.middleware');

const router = express.Router();

router.use(protect);

const projectValidation = [
  body('name').trim().notEmpty().withMessage('Project name is required'),
  body('description').optional().trim(),
];

const memberValidation = [
  body('userId').notEmpty().withMessage('User ID is required').isMongoId(),
  body('role').optional().isIn(['admin', 'member']),
];

router.post('/', projectValidation, projectController.createProject);
router.get('/', projectController.getProjects);
router.get('/:id', projectController.getProject);
router.put('/:id', projectController.updateProject);
router.post('/:id/members', memberValidation, projectController.addMember);

module.exports = router;
