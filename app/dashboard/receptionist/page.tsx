'use client';

import ProtectedLayout from '@/components/ProtectedLayout';
import { signOut, useSession } from 'next-auth/react';
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
} from '@mui/material';
import LogoutIcon from '@mui/icons-material/Logout';
import Link from 'next/link';
import TodayRegistrations from '@/components/TodayRegistrations';

export default function ReceptionistDashboard() {
  const { data: session } = useSession();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

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
              <Typography
                variant="h6"
                sx={{ fontWeight: 500, color: '#1a237e' }}
              >
                ClinicFlow
              </Typography>
              <Typography
                variant="body2"
                sx={{ color: '#1a237e', opacity: 0.7 }}
              >
                Receptionist Dashboard
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: isMobile ? 1 : 2 }}>
              <Box sx={{ textAlign: 'right' }}>
                <Typography
                  variant="body2"
                  sx={{ fontWeight: 500, color: '#1a237e' }}
                >
                  {session?.user?.name || 'Receptionist'}
                </Typography>
                <Typography
                  variant="body2"
                  sx={{ color: '#1a237e', opacity: 0.7 }}
                >
                  {new Date().toLocaleDateString('en-US', {
                    weekday: 'long',
                    month: 'short',
                    day: 'numeric',
                    timeZone: 'Africa/Nairobi',
                  })}
                </Typography>
              </Box>
              <Button
                variant="outlined"
                startIcon={<LogoutIcon />}
                onClick={() => {
                  document.body.style.opacity = '0.9';
                  setTimeout(() => signOut({ callbackUrl: '/' }), 300);
                }}
                sx={{
                  textTransform: 'none',
                  color: '#1a237e',
                  borderColor: '#1a237e',
                  '&:hover': {
                    bgcolor: '#f8f9ff',
                    borderColor: '#283593',
                  },
                  px: isMobile ? 1 : 2,
                }}
              >
                {isMobile ? '' : 'Logout'}
              </Button>
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
                    <Link href="/dashboard/receptionist/register">
                      <Button
                        variant="contained"
                        fullWidth
                        sx={{
                          py: 1,
                          textTransform: 'none',
                          fontWeight: 500,
                          bgcolor: '#1a237e',
                          '&:hover': { bgcolor: '#283593' },
                        }}
                      >
                        Register New Patient
                      </Button>
                    </Link>
                    <Link href="/dashboard/receptionist/check-in">
                      <Button
                        variant="outlined"
                        fullWidth
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
                        }}
                      >
                        Check-In Patient
                      </Button>
                    </Link>
                    <Link href="/dashboard/receptionist/mark-as-paid">
                      <Button
                        variant="outlined"
                        fullWidth
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
                        }}
                      >
                        Mark as Paid for Lab Test
                      </Button>
                    </Link>
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