import React, { useState, useEffect } from 'react';
import {
  Grid, Paper, Typography, Box, Card, CardContent,
  LinearProgress, List, ListItem, ListItemText, Chip
} from '@mui/material';
import { format } from 'date-fns';
import { dashboardAPI } from '../services/api';
import toast from 'react-hot-toast';

const Dashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const response = await dashboardAPI.getStats();
      setData(response.data);
    } catch (error) {
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LinearProgress />;
  }

  const { stats, recentTasks, upcomingDeadlines } = data;

  const StatCard = ({ title, value, color }) => (
    <Card>
      <CardContent>
        <Typography color="textSecondary" gutterBottom>
          {title}
        </Typography>
        <Typography variant="h4" component="div" style={{ color }}>
          {value}
        </Typography>
      </CardContent>
    </Card>
  );

  return (
    <Box sx={{ flexGrow: 1, p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Dashboard
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard title="Total Projects" value={stats.totalProjects} color="#1976d2" />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard title="Total Tasks" value={stats.totalTasks} color="#388e3c" />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard title="Completed Tasks" value={stats.tasksByStatus.completed} color="#f57c00" />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard title="Overdue Tasks" value={stats.overdueTasks} color="#d32f2f" />
        </Grid>

        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Task Status Distribution
            </Typography>
            {Object.entries(stats.tasksByStatus).map(([status, count]) => (
              <Box key={status} sx={{ mt: 1 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2">
                    {status.replace('_', ' ').toUpperCase()}
                  </Typography>
                  <Typography variant="body2">{count}</Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={stats.totalTasks > 0 ? (count / stats.totalTasks) * 100 : 0}
                  sx={{ mt: 0.5 }}
                />
              </Box>
            ))}
          </Paper>
        </Grid>

        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Task Priority
            </Typography>
            {Object.entries(stats.tasksByPriority).map(([priority, count]) => (
              <Box key={priority} sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                <Chip
                  label={priority.toUpperCase()}
                  color={
                    priority === 'urgent' ? 'error' :
                    priority === 'high' ? 'warning' :
                    priority === 'medium' ? 'info' : 'default'
                  }
                  size="small"
                />
                <Typography variant="body2">{count}</Typography>
              </Box>
            ))}
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Recent Tasks
            </Typography>
            <List>
              {recentTasks.map((task) => (
                <ListItem key={task._id}>
                  <ListItemText
                    primary={task.title}
                    secondary={`${task.project.name} - ${format(new Date(task.updatedAt), 'MMM dd, yyyy')}`}
                  />
                  <Chip
                    label={task.status.replace('_', ' ')}
                    size="small"
                    color={
                      task.status === 'completed' ? 'success' :
                      task.status === 'in_progress' ? 'primary' :
                      task.status === 'review' ? 'warning' : 'default'
                    }
                  />
                </ListItem>
              ))}
            </List>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Upcoming Deadlines
            </Typography>
            <List>
              {upcomingDeadlines.map((task) => (
                <ListItem key={task._id}>
                  <ListItemText
                    primary={task.title}
                    secondary={format(new Date(task.dueDate), 'MMM dd, yyyy HH:mm')}
                  />
                  <Chip
                    label={task.priority}
                    size="small"
                    color={
                      task.priority === 'urgent' ? 'error' :
                      task.priority === 'high' ? 'warning' : 'default'
                    }
                  />
                </ListItem>
              ))}
            </List>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard;