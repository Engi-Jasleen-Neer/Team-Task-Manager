const express = require('express');
const { body } = require('express-validator');
const projectController = require('../controllers/project.controller');
const { protect } = require('../middleware/auth.middleware');

const router = express.Router();

router.use(protect);

const projectValidation = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Project name is required')
    .isLength({ max: 100 })
    .withMessage('Project name cannot exceed 100 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description cannot exceed 500 characters')
];

const memberValidation = [
  body('userId')
    .notEmpty()
    .withMessage('User ID is required')
    .isMongoId()
    .withMessage('Invalid user ID'),
  body('role')
    .optional()
    .isIn(['admin', 'member'])
    .withMessage('Role must be admin or member')
];

// These exist ✅
router.post('/', projectValidation, projectController.createProject);
router.get('/', projectController.getProjects);
router.get('/:id', projectController.getProject);
router.put('/:id', projectValidation, projectController.updateProject);
router.post('/:id/members', memberValidation, projectController.addMember);

// Commented out - function missing
// router.delete('/:id/members/:userId', projectController.removeMember);

module.exports = router;