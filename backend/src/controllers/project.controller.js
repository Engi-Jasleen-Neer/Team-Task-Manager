const Project = require('../models/Project.model');
const Task = require('../models/Task.model');
const User = require('../models/User.model');

exports.createProject = async (req, res) => {
  try {
    const { name, description } = req.body;

    const project = await Project.create({
      name,
      description,
      owner: req.user._id,
      members: [{ user: req.user._id, role: 'admin' }]
    });

    await project.populate('owner', 'name email');

    res.status(201).json({ project });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getProjects = async (req, res) => {
  try {
    const projects = await Project.find({
      $or: [
        { owner: req.user._id },
        { 'members.user': req.user._id }
      ]
    })
    .populate('owner', 'name email')
    .populate('members.user', 'name email')
    .sort('-createdAt');

    res.json({ projects });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate('owner', 'name email')
      .populate('members.user', 'name email');

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Check if user is member
    const isMember = project.members.some(
      member => member.user._id.toString() === req.user._id.toString()
    );

    if (!isMember) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json({ project });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Check if user is admin
    const member = project.members.find(
      m => m.user.toString() === req.user._id.toString() && m.role === 'admin'
    );

    if (!member) {
      return res.status(403).json({ message: 'Only admins can update the project' });
    }

    const { name, description, status } = req.body;
    if (name) project.name = name;
    if (description) project.description = description;
    if (status) project.status = status;

    await project.save();
    await project.populate('owner', 'name email');
    await project.populate('members.user', 'name email');

    res.json({ project });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};



exports.addMember = async (req, res) => {
  try {
    const { userId, role } = req.body;
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Check if user is admin
    const isAdmin = project.members.some(
      m => m.user.toString() === req.user._id.toString() && m.role === 'admin'
    );

    if (!isAdmin) {
      return res.status(403).json({ message: 'Only admins can add members' });
    }

    // Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if already a member
    const existingMember = project.members.find(
      m => m.user.toString() === userId
    );

    if (existingMember) {
      return res.status(400).json({ message: 'User is already a member' });
    }

    project.members.push({ user: userId, role: role || 'member' });
    await project.save();
    await project.populate('members.user', 'name email');

    res.json({ project });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Add this function to project.controller.js
exports.removeMember = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Check if user is admin
    const isAdmin = project.members.some(
      m => m.user.toString() === req.user._id.toString() && m.role === 'admin'
    );

    if (!isAdmin) {
      return res.status(403).json({ message: 'Only admins can remove members' });
    }

    // Cannot remove the owner
    if (req.params.userId === project.owner.toString()) {
      return res.status(400).json({ message: 'Cannot remove project owner' });
    }

    project.members = project.members.filter(
      m => m.user.toString() !== req.params.userId
    );

    await project.save();
    await project.populate('members.user', 'name email');

    res.json({ project });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};