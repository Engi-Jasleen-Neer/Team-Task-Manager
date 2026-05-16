const Task = require('../models/Task.model');
const Project = require('../models/Project.model');

exports.createTask = async (req, res) => {
  try {
    const { title, description, projectId, assignedTo, dueDate, priority, tags } = req.body;

    // Check if project exists and user is member
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    const isMember = project.members.some(
      m => m.user.toString() === req.user._id.toString()
    );

    if (!isMember) {
      return res.status(403).json({ message: 'You are not a member of this project' });
    }

    const task = await Task.create({
      title,
      description,
      project: projectId,
      assignedTo: assignedTo || req.user._id,
      createdBy: req.user._id,
      dueDate,
      priority: priority || 'medium',
      tags: tags || []
    });

    await task.populate('assignedTo', 'name email');
    await task.populate('createdBy', 'name email');
    await task.populate('project', 'name');

    res.status(201).json({ task });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getTasks = async (req, res) => {
  try {
    const { projectId, status, priority, assignedTo } = req.query;
    
    const query = {};
    
    if (projectId) {
      // Check if user has access to this project
      const project = await Project.findById(projectId);
      if (!project) {
        return res.status(404).json({ message: 'Project not found' });
      }
      
      const isMember = project.members.some(
        m => m.user.toString() === req.user._id.toString()
      );
      
      if (!isMember) {
        return res.status(403).json({ message: 'Access denied' });
      }
      
      query.project = projectId;
    } else {
      // Get tasks from all projects user is member of
      const projects = await Project.find({
        'members.user': req.user._id
      });
      query.project = { $in: projects.map(p => p._id) };
    }

    if (status) query.status = status;
    if (priority) query.priority = priority;
    if (assignedTo) query.assignedTo = assignedTo;

    const tasks = await Task.find(query)
      .populate('assignedTo', 'name email')
      .populate('createdBy', 'name email')
      .populate('project', 'name')
      .sort('-createdAt');

    res.json({ tasks });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // Check permissions
    const project = await Project.findById(task.project);
    const isAdmin = project.members.some(
      m => m.user.toString() === req.user._id.toString() && m.role === 'admin'
    );

    const updateData = {};
    const { title, description, status, priority, assignedTo, dueDate, tags } = req.body;

    // Members can update status
    if (status) {
      updateData.status = status;
    }

    // Only admins or task creator can update other fields
    if (isAdmin || task.createdBy.toString() === req.user._id.toString()) {
      if (title) updateData.title = title;
      if (description) updateData.description = description;
      if (priority) updateData.priority = priority;
      if (assignedTo) updateData.assignedTo = assignedTo;
      if (dueDate) updateData.dueDate = dueDate;
      if (tags) updateData.tags = tags;
    }

    const updatedTask = await Task.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    )
    .populate('assignedTo', 'name email')
    .populate('createdBy', 'name email')
    .populate('project', 'name');

    res.json({ task: updatedTask });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.addComment = async (req, res) => {
  try {
    const { text } = req.body;
    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    task.comments.push({
      user: req.user._id,
      text
    });

    await task.save();
    await task.populate('comments.user', 'name email');

    res.json({ task });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};