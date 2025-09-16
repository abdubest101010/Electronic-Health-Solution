// components/Receptionist/TodayAppointments.tsx
import { useEffect, useState } from 'react';
import { 
  List, 
  ListItem, 
  ListItemText, 
  ListItemAvatar, 
  Avatar, 
  Typography, 
  Box,
  Chip,
  Skeleton,
  useTheme,
  Button
} from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';
import AccessTimeIcon from '@mui/icons-material/AccessTime';

interface Appointment {
  id: number;
  patient: {
    id: number;
    name: string;
  };
  visitStatus: string;
  scheduledTime: string;
}

interface Props {
  onPatientClick: (patientId: number) => void;
}

export default function TodayAppointments({ onPatientClick }: Props) {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const theme = useTheme();

  useEffect(() => {
    const fetchAppointments = async () => {
      try {
        const res = await fetch('/api/todays-appointments');
        if (res.ok) {
          const data = await res.json();
          setAppointments(data);
        }
      } catch (err) {
        console.error('Failed to load appointments', err);
      } finally {
        setLoading(false);
      }
    };
    fetchAppointments();
  }, []);

  // Status color mapping
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'SCHEDULED': return 'primary';
      case 'CHECKED_IN': return 'warning';
      case 'IN_PROGRESS': return 'info';
      case 'COMPLETED': return 'success';
      default: return 'default';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'SCHEDULED': return 'Scheduled';
      case 'CHECKED_IN': return 'Checked In';
      case 'IN_PROGRESS': return 'In Progress';
      case 'COMPLETED': return 'Completed';
      default: return status;
    }
  };

  if (loading) {
    return (
      <Box sx={{ mt: 2 }}>
        {[...Array(5)].map((_, index) => (
          <Box key={index} sx={{ display: 'flex', alignItems: 'center', mb: 2, p: 2 }}>
            <Skeleton variant="circular" width={40} height={40} />
            <Box sx={{ ml: 2, flex: 1 }}>
              <Skeleton variant="text" width="60%" height={24} />
              <Skeleton variant="text" width="40%" height={20} />
            </Box>
          </Box>
        ))}
      </Box>
    );
  }

  return (
    <Box sx={{ 
      maxHeight: 500,
      overflow: 'auto',
      '&::-webkit-scrollbar': {
        width: '6px'
      },
      '&::-webkit-scrollbar-track': {
        background: '#f1f1f1'
      },
      '&::-webkit-scrollbar-thumb': {
        background: '#c1c1c1',
        borderRadius: '3px'
      }
    }}>
      {appointments.length === 0 ? (
        <Box sx={{ 
          textAlign: 'center', 
          py: 4,
          backgroundColor: '#f8f9ff',
          borderRadius: 1
        }}>
          <PersonIcon sx={{ fontSize: 48, color: '#e0e0e0', mb: 1 }} />
          <Typography variant="body1" color="text.secondary">
            No appointments scheduled for today
          </Typography>
          <Button 
            variant="text" 
            color="primary"
            sx={{ mt: 1 }}
          >
            Schedule New Appointment
          </Button>
        </Box>
      ) : (
        <List sx={{ 
          bgcolor: 'background.paper',
          borderRadius: 1,
          overflow: 'hidden'
        }}>
          {appointments.map((app) => (
            <ListItem 
              key={app.id}
              onClick={() => onPatientClick(app.patient.id)}
              sx={{ 
                p: 2,
                borderBottom: '1px solid #f0f0f0',
                cursor: 'pointer',
                transition: 'all 0.2s',
                '&:hover': {
                  backgroundColor: 'rgba(26, 35, 126, 0.03)',
                  transform: 'translateX(4px)'
                }
              }}
            >
              <ListItemAvatar>
                <Avatar 
                  sx={{ 
                    bgcolor: 'primary.light',
                    color: 'primary.dark'
                  }}
                >
                  {app.patient.name.charAt(0)}
                </Avatar>
              </ListItemAvatar>
              <ListItemText
                primary={
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography 
                      variant="subtitle1" 
                      sx={{ fontWeight: 500 }}
                    >
                      {app.patient.name}
                    </Typography>
                    <Chip
                      label={getStatusText(app.visitStatus)}
                      size="small"
                      color={getStatusColor(app.visitStatus)}
                      sx={{ 
                        fontWeight: 500,
                        height: 24,
                        fontSize: '0.75rem'
                      }}
                    />
                  </Box>
                }
                secondary={
                  <Box sx={{ mt: 0.5, display: 'flex', alignItems: 'center' }}>
                    <AccessTimeIcon 
                      fontSize="small" 
                      sx={{ 
                        mr: 0.5, 
                        color: 'text.secondary' 
                      }} 
                    />
                    <Typography 
                      variant="body2" 
                      color="text.secondary"
                    >
                      {new Date(app.scheduledTime).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </Typography>
                  </Box>
                }
              />
            </ListItem>
          ))}
        </List>
      )}
    </Box>
  );
}