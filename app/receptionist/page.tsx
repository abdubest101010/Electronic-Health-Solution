'use client';

import ProtectedLayout from '@/components/ProtectedLayout';
import {
  Box,
  Container,
  AppBar,
  Toolbar,
  Typography,
  Button,
  Card,
  CardContent,
  useTheme,
  useMediaQuery,
  CircularProgress,
} from '@mui/material';
import { useRouter } from 'next/navigation'; // ✅ App Router compatible
import { useState } from 'react';
import TodayRegistrations from '@/components/TodayRegistrations';

export default function ReceptionistDashboard() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const router = useRouter();

  // Track loading state for each action (or use one state if only one can be clicked at a time)
  const [loading, setLoading] = useState<string | null>(null);

  const handleNavigate = (path: string, action: string) => {
    setLoading(action);
    router.push(path);
    // Note: In App Router, navigation is instantaneous client-side,
    // so we reset loading after a small delay for UX
    setTimeout(() => {
      setLoading(null);
    }, 1000); // Adjust as needed — or tie to actual data loading if any
  };

  return (
    <ProtectedLayout allowedRoles={['RECEPTIONIST']}>
      <Box sx={{ bgcolor: '#f8f9ff', minHeight: '100vh', pb: 4 }}>
        {/* App Bar */}
        <AppBar
          position="static"
          elevation={0}
          sx={{
            bgcolor: '#fff',
            borderBottom: '1px solid #e0e0e0',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          }}
        >
          <Toolbar sx={{ justifyContent: 'space-between', px: isMobile ? 2 : 3 }}>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 500, color: '#1a237e' }}>
                ClinicFlow
              </Typography>
              <Typography variant="body2" sx={{ color: '#1a237e', opacity: 0.7 }}>
                Receptionist Dashboard
              </Typography>
            </Box>
          </Toolbar>
        </AppBar>

        {/* Main Content */}
        <Container maxWidth="xl" sx={{ mt: 2, px: isMobile ? 2 : 3 }}>
          <Box
            sx={{
              display: 'flex',
              flexDirection: isMobile ? 'column' : 'row',
              gap: isMobile ? 2 : 3,
            }}
          >
            {/* Quick Actions */}
            <Box
              sx={{
                flex: isMobile ? 'none' : '0 0 33.33%',
                maxWidth: isMobile ? '100%' : 400,
              }}
            >
              <Card
                sx={{
                  borderRadius: 2,
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                  bgcolor: '#fff',
                }}
              >
                <CardContent sx={{ p: isMobile ? 2 : 3 }}>
                  <Typography
                    variant="subtitle1"
                    sx={{ mb: 2, fontWeight: 500, color: '#1a237e' }}
                  >
                    Quick Actions
                  </Typography>
                  <Box
                    sx={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 1.5,
                    }}
                  >
                    {/* Register New Patient */}
                    <Button
                      variant="contained"
                      fullWidth
                      disabled={loading === 'register'}
                      onClick={() => handleNavigate('/receptionist/register', 'register')}
                      sx={{
                        py: 1,
                        textTransform: 'none',
                        fontWeight: 500,
                        bgcolor: '#1a237e',
                        '&:hover': { bgcolor: '#283593' },
                        position: 'relative',
                      }}
                    >
                      {loading === 'register' ? (
                        <CircularProgress size={24} sx={{ color: '#fff' }} />
                      ) : (
                        'Register New Patient'
                      )}
                    </Button>

                    {/* Check-In Patient */}
                    <Button
                      variant="outlined"
                      fullWidth
                      disabled={loading === 'checkin'}
                      onClick={() => handleNavigate('/receptionist/check-in', 'checkin')}
                      sx={{
                        py: 1,
                        textTransform: 'none',
                        fontWeight: 500,
                        color: '#1a237e',
                        borderColor: '#1a237e',
                        '&:hover': {
                          bgcolor: '#f8f9ff',
                          borderColor: '#283593',
                        },
                        position: 'relative',
                      }}
                    >
                      {loading === 'checkin' ? (
                        <CircularProgress size={24} sx={{ color: '#1a237e' }} />
                      ) : (
                        'Check-In Patient'
                      )}
                    </Button>

                    {/* Mark as Paid */}
                    <Button
                      variant="outlined"
                      fullWidth
                      disabled={loading === 'paid'}
                      onClick={() => handleNavigate('/receptionist/mark-as-paid', 'paid')}
                      sx={{
                        py: 1,
                        textTransform: 'none',
                        fontWeight: 500,
                        color: '#1a237e',
                        borderColor: '#1a237e',
                        '&:hover': {
                          bgcolor: '#f8f9ff',
                          borderColor: '#283593',
                        },
                        position: 'relative',
                      }}
                    >
                      {loading === 'paid' ? (
                        <CircularProgress size={24} sx={{ color: '#1a237e' }} />
                      ) : (
                        'Mark as Paid for Lab Test'
                      )}
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            </Box>

            {/* Today's Registrations */}
            <Box sx={{ flex: 1 }}>
              <TodayRegistrations />
            </Box>
          </Box>
        </Container>
      </Box>
    </ProtectedLayout>
  );
}