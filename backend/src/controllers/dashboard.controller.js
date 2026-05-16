const Task = require('../models/Task.model');
const Project = require('../models/Project.model');

exports.getDashboardStats = async (req, res) => {
  try {
    const projects = await Project.find({
      'members.user': req.user._id
    });

    const projectIds = projects.map(p => p._id);

    const tasks = await Task.find({
      project: { $in: projectIds }
    });

    const stats = {
      totalProjects: projects.length,
      totalTasks: tasks.length,
      tasksByStatus: {
        todo: tasks.filter(t => t.status === 'todo').length,
        in_progress: tasks.filter(t => t.status === 'in_progress').length,
        review: tasks.filter(t => t.status === 'review').length,
        completed: tasks.filter(t => t.status === 'completed').length
      },
      overdueTasks: tasks.filter(t => 
        new Date(t.dueDate) < new Date() && t.status !== 'completed'
      ).length,
      tasksByPriority: {
        low: tasks.filter(t => t.priority === 'low').length,
        medium: tasks.filter(t => t.priority === 'medium').length,
        high: tasks.filter(t => t.priority === 'high').length,
        urgent: tasks.filter(t => t.priority === 'urgent').length
      }
    };

    const recentTasks = await Task.find({
      $or: [
        { assignedTo: req.user._id },
        { createdBy: req.user._id }
      ]
    })
    .populate('project', 'name')
    .sort('-updatedAt')
    .limit(10);

    const upcomingDeadlines = await Task.find({
      assignedTo: req.user._id,
      dueDate: { $gte: new Date() },
      status: { $ne: 'completed' }
    })
    .populate('project', 'name')
    .sort('dueDate')
    .limit(5);

    res.json({
      stats,
      recentTasks,
      upcomingDeadlines
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
