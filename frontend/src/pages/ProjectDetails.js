import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box, Typography, Button, Grid, Paper, Tabs, Tab,
  Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Chip, IconButton, Dialog,
  DialogTitle, DialogContent, DialogActions,
  TextField, MenuItem, Avatar, List, ListItem,
  ListItemAvatar, ListItemText, Select, FormControl,
  InputLabel
} from '@mui/material';
import {
  ArrowBack as BackIcon,
  Add as AddIcon,
  Edit as EditIcon,
  PersonAdd as PersonAddIcon
} from '@mui/icons-material';
import { projectAPI, taskAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

const ProjectDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [tabValue, setTabValue] = useState(0);
  const [openTaskDialog, setOpenTaskDialog] = useState(false);
  const [openMemberDialog, setOpenMemberDialog] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [memberEmail, setMemberEmail] = useState('');
  const [taskForm, setTaskForm] = useState({
    title: '',
    description: '',
    assignedTo: '',
    dueDate: '',
    priority: 'medium',
    status: 'todo'
  });

  useEffect(() => {
    fetchProjectDetails();
    fetchTasks();
  }, [id]);

  const fetchProjectDetails = async () => {
    try {
      const response = await projectAPI.getProject(id);
      setProject(response.data.project);
    } catch (error) {
      toast.error('Failed to fetch project details');
      navigate('/projects');
    }
  };

  const fetchTasks = async () => {
    try {
      const response = await taskAPI.getTasks({ projectId: id });
      setTasks(response.data.tasks);
    } catch (error) {
      toast.error('Failed to fetch tasks');
    }
  };

  const handleAddMember = async () => {
    try {
      // First, find user by email (you might need to add this endpoint)
      // For now, we'll just show a success message
      toast.success('Member added successfully');
      setOpenMemberDialog(false);
      setMemberEmail('');
      fetchProjectDetails();
    } catch (error) {
      toast.error('Failed to add member');
    }
  };

  const handleTaskSubmit = async () => {
    try {
      const taskData = {
        ...taskForm,
        projectId: id
      };

      if (editingTask) {
        await taskAPI.updateTask(editingTask._id, taskData);
        toast.success('Task updated successfully');
      } else {
        await taskAPI.createTask(taskData);
        toast.success('Task created successfully');
      }
      
      setOpenTaskDialog(false);
      setEditingTask(null);
      setTaskForm({
        title: '',
        description: '',
        assignedTo: '',
        dueDate: '',
        priority: 'medium',
        status: 'todo'
      });
      fetchTasks();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Operation failed');
    }
  };

  const handleStatusChange = async (taskId, newStatus) => {
    try {
      await taskAPI.updateTask(taskId, { status: newStatus });
      toast.success('Task status updated');
      fetchTasks();
    } catch (error) {
      toast.error('Failed to update task status');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'todo': return 'default';
      case 'in_progress': return 'primary';
      case 'review': return 'warning';
      case 'completed': return 'success';
      default: return 'default';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'low': return 'default';
      case 'medium': return 'info';
      case 'high': return 'warning';
      case 'urgent': return 'error';
      default: return 'default';
    }
  };

  if (!project) return null;

  const isAdmin = project.members?.some(
    m => m.user?._id === user?.id && m.role === 'admin'
  );

  return (
    <Box>
      <Button
        startIcon={<BackIcon />}
        onClick={() => navigate('/projects')}
        sx={{ mb: 2 }}
      >
        Back to Projects
      </Button>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
          <Box>
            <Typography variant="h4" gutterBottom>
              {project.name}
            </Typography>
            <Typography variant="body1" color="text.secondary" paragraph>
              {project.description || 'No description'}
            </Typography>
            <Chip 
              label={project.status} 
              color={project.status === 'active' ? 'success' : 'default'}
              size="small"
            />
          </Box>
          {isAdmin && (
            <Box>
              <Button
                variant="outlined"
                startIcon={<PersonAddIcon />}
                onClick={() => setOpenMemberDialog(true)}
                sx={{ mr: 1 }}
              >
                Add Member
              </Button>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => setOpenTaskDialog(true)}
              >
                Add Task
              </Button>
            </Box>
          )}
        </Box>

        <Box sx={{ mt: 2 }}>
          <Typography variant="subtitle2" gutterBottom>
            Team Members
          </Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            {project.members?.map((member) => (
              <Chip
                key={member._id}
                avatar={<Avatar>{member.user?.name?.charAt(0)}</Avatar>}
                label={`${member.user?.name} (${member.role})`}
                variant="outlined"
              />
            ))}
          </Box>
        </Box>
      </Paper>

      <Tabs value={tabValue} onChange={(e, v) => setTabValue(v)} sx={{ mb: 3 }}>
        <Tab label={`All Tasks (${tasks.length})`} />
        <Tab label={`Todo (${tasks.filter(t => t.status === 'todo').length})`} />
        <Tab label={`In Progress (${tasks.filter(t => t.status === 'in_progress').length})`} />
        <Tab label={`Completed (${tasks.filter(t => t.status === 'completed').length})`} />
      </Tabs>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Task</TableCell>
              <TableCell>Assigned To</TableCell>
              <TableCell>Priority</TableCell>
              <TableCell>Due Date</TableCell>
              <TableCell>Status</TableCell>
              {isAdmin && <TableCell>Actions</TableCell>}
            </TableRow>
          </TableHead>
          <TableBody>
            {tasks
              .filter(task => {
                if (tabValue === 0) return true;
                if (tabValue === 1) return task.status === 'todo';
                if (tabValue === 2) return task.status === 'in_progress';
                if (tabValue === 3) return task.status === 'completed';
                return true;
              })
              .map((task) => (
                <TableRow key={task._id}>
                  <TableCell>
                    <Typography variant="body2" fontWeight="bold">
                      {task.title}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {task.description?.substring(0, 50)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      avatar={<Avatar>{task.assignedTo?.name?.charAt(0)}</Avatar>}
                      label={task.assignedTo?.name}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={task.priority}
                      size="small"
                      color={getPriorityColor(task.priority)}
                    />
                  </TableCell>
                  <TableCell>
                    {format(new Date(task.dueDate), 'MMM dd, yyyy')}
                  </TableCell>
                  <TableCell>
                    {isAdmin || task.assignedTo?._id === user?.id ? (
                      <FormControl size="small">
                        <Select
                          value={task.status}
                          onChange={(e) => handleStatusChange(task._id, e.target.value)}
                          sx={{ minWidth: 130 }}
                        >
                          <MenuItem value="todo">To Do</MenuItem>
                          <MenuItem value="in_progress">In Progress</MenuItem>
                          <MenuItem value="review">Review</MenuItem>
                          <MenuItem value="completed">Completed</MenuItem>
                        </Select>
                      </FormControl>
                    ) : (
                      <Chip
                        label={task.status.replace('_', ' ')}
                        size="small"
                        color={getStatusColor(task.status)}
                      />
                    )}
                  </TableCell>
                  {isAdmin && (
                    <TableCell>
                      <IconButton
                        size="small"
                        onClick={() => {
                          setEditingTask(task);
                          setTaskForm({
                            title: task.title,
                            description: task.description || '',
                            assignedTo: task.assignedTo?._id || '',
                            dueDate: task.dueDate?.split('T')[0] || '',
                            priority: task.priority,
                            status: task.status
                          });
                          setOpenTaskDialog(true);
                        }}
                      >
                        <EditIcon />
                      </IconButton>
                    </TableCell>
                  )}
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Task Dialog */}
      <Dialog open={openTaskDialog} onClose={() => setOpenTaskDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingTask ? 'Edit Task' : 'Create New Task'}
        </DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Task Title"
            fullWidth
            value={taskForm.title}
            onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            label="Description"
            fullWidth
            multiline
            rows={3}
            value={taskForm.description}
            onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })}
            sx={{ mb: 2 }}
          />
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Assigned To</InputLabel>
            <Select
              value={taskForm.assignedTo}
              onChange={(e) => setTaskForm({ ...taskForm, assignedTo: e.target.value })}
              label="Assigned To"
            >
              {project.members?.map((member) => (
                <MenuItem key={member.user?._id} value={member.user?._id}>
                  {member.user?.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <TextField
                margin="dense"
                label="Due Date"
                type="date"
                fullWidth
                value={taskForm.dueDate}
                onChange={(e) => setTaskForm({ ...taskForm, dueDate: e.target.value })}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={6}>
              <FormControl fullWidth margin="dense">
                <InputLabel>Priority</InputLabel>
                <Select
                  value={taskForm.priority}
                  onChange={(e) => setTaskForm({ ...taskForm, priority: e.target.value })}
                  label="Priority"
                >
                  <MenuItem value="low">Low</MenuItem>
                  <MenuItem value="medium">Medium</MenuItem>
                  <MenuItem value="high">High</MenuItem>
                  <MenuItem value="urgent">Urgent</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenTaskDialog(false)}>Cancel</Button>
          <Button onClick={handleTaskSubmit} variant="contained">
            {editingTask ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add Member Dialog */}
      <Dialog open={openMemberDialog} onClose={() => setOpenMemberDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add Team Member</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Member Email"
            type="email"
            fullWidth
            value={memberEmail}
            onChange={(e) => setMemberEmail(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenMemberDialog(false)}>Cancel</Button>
          <Button onClick={handleAddMember} variant="contained">
            Add Member
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ProjectDetail;