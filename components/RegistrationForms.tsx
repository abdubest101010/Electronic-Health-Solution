// components/Receptionist/RegistrationForms.tsx
import { useState } from 'react';
import { 
  Box, 
  Card, 
  CardContent,
  Typography,
  useTheme,
  Alert,
  AlertTitle,
  Fade
} from '@mui/material';
import { 
  PersonAdd as PersonAddIcon,
  Checklist as ChecklistIcon,
  Celebration as CelebrationIcon
} from '@mui/icons-material';
import RegisterPatientForm from './RegisterPatientForm';

export default function RegistrationForms() {
  const [registrationComplete, setRegistrationComplete] = useState(false);
  const theme = useTheme();

  const handleRegistrationComplete = () => {
    setRegistrationComplete(true);
    setTimeout(() => setRegistrationComplete(false), 3000);
  };

  return (
    <Card 
      sx={{ 
        borderRadius: 3,
        overflow: 'hidden',
        boxShadow: '0 8px 24px rgba(26, 35, 126, 0.15)',
        '&:hover': {
          boxShadow: '0 12px 32px rgba(26, 35, 126, 0.2)'
        },
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        background: 'linear-gradient(135deg, #f8f9ff 0%, #e8eaf6 100%)',
        border: '1px solid #e0e0e0',
        width: '100%' // Full width
      }}
    >
      <CardContent sx={{ p: 0 }}>
        {/* Header with gradient background */}
        <Box sx={{ 
          background: 'linear-gradient(45deg, #1a237e 30%, #283593 90%)',
          color: 'white',
          py: 3,
          px: 4,
          position: 'relative',
          overflow: 'hidden'
        }}>
          <Box sx={{ 
            position: 'absolute',
            top: -50,
            right: -50,
            width: 100,
            height: 100,
            borderRadius: '50%',
            background: 'rgba(255, 255, 255, 0.1)',
            animation: 'pulse 2s infinite'
          }} />
          <Box sx={{ 
            position: 'absolute',
            bottom: -30,
            left: -30,
            width: 60,
            height: 60,
            borderRadius: '50%',
            background: 'rgba(255, 255, 255, 0.08)',
            animation: 'pulse 3s infinite 1s'
          }} />
          
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center',
            position: 'relative',
            zIndex: 1
          }}>
            <Box sx={{ 
              mr: 2,
              p: 1.5,
              backgroundColor: 'rgba(255, 255, 255, 0.2)',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <PersonAddIcon sx={{ fontSize: 32 }} />
            </Box>
            <Box>
              <Typography 
                variant="h5" 
                sx={{ 
                  fontWeight: 700,
                  letterSpacing: '-0.5px'
                }}
              >
                New Patient Registration
              </Typography>
              <Typography 
                variant="body2" 
                sx={{ 
                  opacity: 0.9,
                  mt: 0.5
                }}
              >
                Complete the form below to register a new patient
              </Typography>
            </Box>
          </Box>
        </Box>
        
        {/* Success Animation */}
        <Fade in={registrationComplete} timeout={500}>
          <Box sx={{ 
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgba(26, 35, 126, 0.95)',
            zIndex: 10,
            backdropFilter: 'blur(4px)'
          }}>
            <CelebrationIcon sx={{ 
              fontSize: 80, 
              color: '#4caf50',
              mb: 2,
              animation: 'bounce 0.6s ease-in-out'
            }} />
            <Typography 
              variant="h5" 
              sx={{ 
                color: 'white',
                fontWeight: 600,
                textAlign: 'center',
                mb: 1
              }}
            >
              Patient Registered!
            </Typography>
            <Typography 
              variant="body1" 
              sx={{ 
                color: 'rgba(255, 255, 255, 0.8)',
                textAlign: 'center'
              }}
            >
              Welcome to our clinic family
            </Typography>
          </Box>
        </Fade>
        
        {/* Form Content */}
        <Box sx={{ 
          p: { xs: 3, sm: 4 },
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center'
        }}>
          <Alert 
            severity="info" 
            icon={<ChecklistIcon />}
            sx={{ 
              mb: 3,
              backgroundColor: 'rgba(2, 136, 209, 0.05)',
              border: '1px solid #2196f3',
              borderRadius: 2,
              '& .MuiAlert-icon': {
                color: '#2196f3'
              },
              width: '100%',
              maxWidth: 500
            }}
          >
            <AlertTitle sx={{ fontWeight: 600 }}>Registration Process</AlertTitle>
            Fill in patient details to create their medical record. All fields marked with * are required.
          </Alert>
          
          {/* Centered form container */}
          <Box sx={{ 
            width: '100%',
            display: 'flex',
            justifyContent: 'center'
          }}>
            <Box sx={{ width: '100%', maxWidth: 500 }}>
              <RegisterPatientForm onRegistrationComplete={handleRegistrationComplete} />
            </Box>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
}