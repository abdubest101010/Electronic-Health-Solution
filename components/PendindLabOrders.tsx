'use client';

import { useEffect, useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  List,
  ListItem,
  Button,
  Chip,
  Skeleton,
  Alert,
  CircularProgress,
  TextField,
  InputAdornment,
  IconButton,
  Tooltip,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import RefreshIcon from '@mui/icons-material/Refresh';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ScienceIcon from '@mui/icons-material/Science';

interface LabTest {
  labOrderId: number;
  serviceName: string;
  orderedByName: string;
  laboratoristName: string;
  status: string;
  orderedAt: string;
}

interface Appointment {
  appointmentId: number;
  labTests: LabTest[];
  assignedAt: string;
}

interface LabPatient {
  patientId: number;
  patientName: string;
  doctorName: string;
  visitStatus: string;
  appointments: Appointment[];
}

export default function LabOrdersPage() {
  const [patients, setPatients] = useState<LabPatient[]>([]);
  const [filteredPatients, setFilteredPatients] = useState<LabPatient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchPatients = async () => {
    try {
      setError(null);
      setLoading(true);
      const res = await fetch('/api/lab-patients', { cache: 'no-store' });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to load lab orders');
      }

      const data: LabPatient[] = await res.json();
      console.log('✅ [LabOrdersPage] Fetched lab orders:', data);
      setPatients(data);
      setFilteredPatients(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load lab orders. Please try again.');
      console.error('💥 [LabOrdersPage] Fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPatients();
  }, []);

  useEffect(() => {
    const filtered = patients.filter((p) =>
      p.patientName.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredPatients(filtered);
  }, [searchQuery, patients]);

  const markAsPaid = async (labOrderId: number, appointmentId: number) => {
    setProcessing(labOrderId);
    try {
      const res = await fetch('/api/mark-us-paid', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ labOrderId }),
      });

      const result = await res.json();

      if (res.ok) {
        setPatients((prev) =>
          prev.map((p) => ({
            ...p,
            appointments: p.appointments.map((apt) =>
              apt.appointmentId === appointmentId
                ? {
                    ...apt,
                    labTests: apt.labTests.map((test) =>
                      test.labOrderId === labOrderId ? { ...test, status: 'PAID' } : test
                    ),
                  }
                : apt
            ),
            visitStatus: p.appointments
              .find((apt) => apt.appointmentId === appointmentId)
              ?.labTests.every((test) => test.status === 'PAID')
              ? 'PAID_FOR_LAB'
              : p.visitStatus,
          }))
        );
        console.log('✅ [LabOrdersPage] Lab order marked as paid:', labOrderId);
      } else {
        throw new Error(result.error || 'Failed to mark as paid');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Network error');
      console.error('💥 [LabOrdersPage] Mark as paid error:', err);
    } finally {
      setProcessing(null);
    }
  };

  const handleRefresh = () => {
    fetchPatients();
  };

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'Africa/Nairobi',
  });

  if (error) {
    return (
      <Box sx={{ maxWidth: 800, mx: 'auto', mt: 4 }}>
        <Alert
          severity="error"
          onClose={() => setError(null)}
          sx={{
            mb: 2,
            backgroundColor: 'rgba(244, 67, 54, 0.08)',
            borderLeft: '4px solid #f44336',
            borderRadius: 2,
          }}
        >
          {error} — <strong>Try refreshing the page</strong>
        </Alert>
      </Box>
    );
  }

  if (loading) {
    return (
      <Box sx={{ maxWidth: 800, mx: 'auto', mt: 4 }}>
        <Card sx={{ borderRadius: 2, boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
          <CardContent sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Skeleton variant="circular" width={40} height={40} sx={{ mr: 2 }} />
              <Skeleton variant="text" width="60%" height={28} />
            </Box>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {[...Array(3)].map((_, index) => (
                <Box
                  key={index}
                  sx={{
                    pl: 2,
                    borderLeft: '2px solid #e0e0e0',
                    '&:not(:last-child)': { mb: 2 },
                  }}
                >
                  <Skeleton variant="text" width="80%" height={24} />
                  <Skeleton variant="rectangular" width="100%" height={40} sx={{ mt: 1 }} />
                </Box>
              ))}
            </Box>
          </CardContent>
        </Card>
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto', mt: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 600, color: '#1a237e' }}>
          Today's Lab Orders
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <TextField
            placeholder="Search patients..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ color: '#666' }} />
                </InputAdornment>
              ),
            }}
            sx={{
              width: 200,
              '& .MuiOutlinedInput-root': { borderRadius: 2, backgroundColor: '#f8f9ff' },
            }}
          />
          <Tooltip title="Refresh lab orders">
            <IconButton onClick={handleRefresh} sx={{ color: '#00bcd4' }}>
              <RefreshIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>
      <Typography variant="body1" sx={{ color: '#666', mb: 3 }}>
        Showing lab orders for {today}
      </Typography>
      <Card
        sx={{
          borderRadius: 2,
          boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
          '&:hover': { boxShadow: '0 6px 16px rgba(0,0,0,0.08)' },
          transition: 'all 0.3s ease',
        }}
      >
        <CardContent sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Box display="flex" alignItems="center">
              <ScienceIcon
                sx={{
                  mr: 1,
                  color: '#00bcd4',
                  backgroundColor: 'rgba(0, 188, 212, 0.1)',
                  borderRadius: 1,
                  p: 0.5,
                }}
              />
              <Typography variant="h5" sx={{ fontWeight: 600, color: '#1a237e' }}>
                Pending Lab Orders
              </Typography>
            </Box>
            <Chip
              label={`${filteredPatients.reduce((acc, p) => acc + p.appointments.reduce((sum, a) => sum + a.labTests.length, 0), 0)} Lab Tests`}
              color="primary"
              variant="outlined"
              sx={{ fontWeight: 500, borderColor: 'rgba(26, 35, 126, 0.3)' }}
            />
          </Box>

          {filteredPatients.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 4, backgroundColor: '#f8f9ff', borderRadius: 1 }}>
              <ScienceIcon sx={{ fontSize: 48, color: '#e0e0e0', mb: 1 }} />
              <Typography variant="body1" color="text.secondary">
                No lab orders assigned today
              </Typography>
            </Box>
          ) : (
            <List sx={{ bgcolor: 'background.paper', borderRadius: 1, overflow: 'hidden' }}>
              {filteredPatients.map((p) => (
                <Box
                  key={p.patientId}
                  sx={{ mb: 2, border: '1px solid #e0e0e0', borderRadius: 2, overflow: 'hidden' }}
                >
                  <Box sx={{ p: 2, backgroundColor: 'rgba(0, 188, 212, 0.05)', borderBottom: '1px solid #e0e0e0' }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#006064' }}>
                      {p.patientName} (Doctor: {p.doctorName})
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                      Visit Status: {p.visitStatus.replace(/_/g, ' ')}
                    </Typography>
                  </Box>
                  {p.appointments.map((apt) => (
                    <Box key={apt.appointmentId}>
                      {apt.labTests.map((test) => (
                        <ListItem
                          key={test.labOrderId}
                          sx={{
                            py: 1.5,
                            px: 2,
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            '&:not(:last-child)': { borderBottom: '1px solid #f0f0f0' },
                          }}
                        >
                          <Box>
                            <Typography variant="body1" sx={{ fontWeight: 500 }}>
                              {test.serviceName}
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                              Ordered by: {test.orderedByName} | Lab: {test.laboratoristName}
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                              Ordered at: {new Date(test.orderedAt).toLocaleTimeString('en-US', {
                                hour: '2-digit',
                                minute: '2-digit',
                                timeZone: 'Africa/Nairobi',
                              })}
                            </Typography>
                          </Box>
                          {test.status === 'PAID' ? (
                            <Box sx={{ display: 'flex', alignItems: 'center', color: '#388e3c' }}>
                              <CheckCircleIcon sx={{ mr: 0.5 }} />
                              <Typography variant="body2" sx={{ fontWeight: 500, color: '#388e3c' }}>
                                Paid
                              </Typography>
                            </Box>
                          ) : (
                            <Button
                              variant="contained"
                              size="small"
                              disabled={processing === test.labOrderId}
                              onClick={() => markAsPaid(test.labOrderId, apt.appointmentId)}
                              startIcon={processing === test.labOrderId ? <CircularProgress size={16} /> : null}
                              sx={{
                                textTransform: 'none',
                                backgroundColor: '#00bcd4',
                                borderRadius: 2,
                                '&:hover': { backgroundColor: '#00acc1', boxShadow: '0 2px 4px rgba(0, 188, 212, 0.3)' },
                              }}
                            >
                              {processing === test.labOrderId ? 'Processing...' : 'Mark Paid'}
                            </Button>
                          )}
                        </ListItem>
                      ))}
                    </Box>
                  ))}
                </Box>
              ))}
            </List>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}