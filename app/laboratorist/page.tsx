'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSession, signOut } from 'next-auth/react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  List,
  ListItem,
  TextField,
  Button,
  Chip,
  Skeleton,
  Alert,
  CircularProgress,
  IconButton,
  Tooltip,
  Pagination,
  Collapse,
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import ScienceIcon from '@mui/icons-material/Science';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import ProtectedLayout from '@/components/ProtectedLayout';

interface LabOrder {
  labOrderId: number;
  serviceName: string;
  orderedByName: string;
  doctorId: string;
  doctorName: string;
  laboratoristName: string;
  status: string;
  orderedAt: string;
  paidAt: string;
}

interface Patient {
  patientId: number;
  patientName: string;
  doctorId: string;
  doctorName: string;
  visitStatus: string;
  labOrders: LabOrder[];
}

export default function LaboratoristDashboard() {
  const { data: session, status } = useSession();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState<number | null>(null);
  const [resultInputs, setResultInputs] = useState<Record<number, string>>({});
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [expandedPatients, setExpandedPatients] = useState<Record<number, boolean>>({});
  const perPage = 20;

  const fetchPatients = async (pageNum: number = 1) => {
    try {
      setError(null);
      setLoading(true);
      const res = await fetch(`/api/paid-lab-orders?page=${pageNum}&perPage=${perPage}`, {
        cache: 'no-store',
      });
      console.log('🔍 [LaboratoristDashboard] Fetch response status:', res.status);
      if (!res.ok) {
        const errorData = await res.json();
        console.warn('❌ [LaboratoristDashboard] Fetch error response:', errorData);
        throw new Error(errorData.error || 'Failed to load lab orders');
      }
      const { data, total } = await res.json();
      console.log('✅ [LaboratoristDashboard] Fetched patients:', data);
      // Validate patient data
      const validPatients = (data || []).filter(
        (p: Patient) => p.patientId && typeof p.patientId === 'number' && !isNaN(p.patientId)
      );
      setPatients(validPatients);
      setTotalPages(Math.ceil((total || 0) / perPage));
      setResultInputs({});
      setExpandedPatients({});
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load lab orders. Please try again.');
      console.error('💥 [LaboratoristDashboard] Fetch error:', err);
      setPatients([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchPatientDetails = async (patientId: number) => {
    if (!patientId || isNaN(patientId)) {
      console.error('❌ [LaboratoristDashboard] Invalid patientId:', patientId);
      setError('Invalid patient ID. Please try again.');
      return;
    }
    try {
      const res = await fetch(`/api/paid-lab-orders/${patientId}`, { cache: 'no-store' });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to load patient details');
      }
      const data: Patient = await res.json();
      console.log('✅ [LaboratoristDashboard] Fetched patient details:', data);
      if (data.patientId && data.labOrders) {
        setPatients((prev) =>
          prev.map((p) => (p.patientId === patientId ? { ...p, labOrders: data.labOrders } : p))
        );
      } else {
        console.warn('❌ [LaboratoristDashboard] Invalid patient details:', data);
        setError('Invalid patient data received.');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load patient details.');
      console.error('💥 [LaboratoristDashboard] Fetch patient details error:', err);
    }
  };

  useEffect(() => {
    if (status === 'authenticated') {
      fetchPatients(page);
    }
  }, [status, page]);

  const handleSubmitResult = async (labOrderId: number) => {
    const result = resultInputs[labOrderId]?.trim();
    if (!result) {
      setError('Please enter a valid result');
      return;
    }

    setSubmitting(labOrderId);
    try {
      const res = await fetch('/api/laboratorists/submit-result', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ labOrderId, result }),
      });

      const responseData = await res.json();

      if (res.ok) {
        console.log('✅ [LaboratoristDashboard] Lab result submitted:', labOrderId);
        setPatients((prev) =>
          prev
            .map((p) => ({
              ...p,
              labOrders: p.labOrders.filter((o) => o.labOrderId !== labOrderId),
            }))
            .filter((p) => p.labOrders.length > 0) // Remove patients with no orders
        );
        setResultInputs((prev) => {
          const next = { ...prev };
          delete next[labOrderId];
          return next;
        });
        setExpandedPatients((prev) => {
          const next = { ...prev };
          Object.keys(next).forEach((key) => {
            if (next[parseInt(key)] && !patients.find((p) => p.patientId === parseInt(key))?.labOrders.length) {
              delete next[parseInt(key)];
            }
          });
          return next;
        });
      } else {
        throw new Error(responseData.error || 'Failed to submit result');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Network error during result submission');
      console.error('💥 [LaboratoristDashboard] Submit result error:', err);
    } finally {
      setSubmitting(null);
    }
  };

  const handleRefresh = () => {
    setPage(1);
    fetchPatients(1);
  };

  const handlePageChange = (_event: React.ChangeEvent<unknown>, value: number) => {
    setPage(value);
  };

  const toggleExpand = useCallback((patientId: number) => {
    console.log('🔍 [LaboratoristDashboard] Toggling expand for patientId:', patientId);
    if (!patientId || isNaN(patientId)) {
      console.error('❌ [LaboratoristDashboard] Invalid patientId in toggleExpand:', patientId);
      setError('Invalid patient ID. Please try again.');
      return;
    }
    if (!expandedPatients[patientId]) {
      fetchPatientDetails(patientId);
    }
    setExpandedPatients((prev) => ({
      ...prev,
      [patientId]: !prev[patientId],
    }));
  }, [expandedPatients]);

  if (status === 'loading' || loading) {
    return (
      <ProtectedLayout allowedRoles={['LABORATORIST']}>
        <Box sx={{ maxWidth: 1200, mx: 'auto', mt: 4, px: 2 }}>
          <Card sx={{ borderRadius: 2, boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Skeleton variant="circular" width={40} height={40} sx={{ mr: 2 }} />
                <Skeleton variant="text" width="60%" height={28} />
              </Box>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {[...Array(5)].map((_, index) => (
                  <Box
                    key={index}
                    sx={{
                      p: 1,
                      border: '1px solid #e0e0e0',
                      borderRadius: 2,
                      mb: 1,
                    }}
                  >
                    <Skeleton variant="text" width="40%" height={20} />
                    <Skeleton variant="text" width="60%" height={16} sx={{ mt: 0.5 }} />
                    <Skeleton variant="rectangular" width="100%" height={50} sx={{ mt: 1 }} />
                  </Box>
                ))}
              </Box>
            </CardContent>
          </Card>
        </Box>
      </ProtectedLayout>
    );
  }

  if (status === 'unauthenticated') {
    return (
      <ProtectedLayout allowedRoles={['LABORATORIST']}>
        <Box sx={{ maxWidth: 1200, mx: 'auto', mt: 4, px: 2 }}>
          <Alert severity="error" sx={{ borderRadius: 2, mb: 2, borderLeft: '4px solid #f44336' }}>
            Unauthorized: Please sign in as a Laboratorist.
          </Alert>
        </Box>
      </ProtectedLayout>
    );
  }

  return (
    <ProtectedLayout allowedRoles={['LABORATORIST']}>
      <Box sx={{ maxWidth: 1200, mx: 'auto', mt: 4, px: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4" sx={{ fontWeight: 600, color: '#1a237e' }}>
            Laboratorist Dashboard
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Tooltip title="Refresh lab orders">
              <IconButton onClick={handleRefresh} sx={{ color: '#00bcd4' }} aria-label="Refresh lab orders">
                <RefreshIcon />
              </IconButton>
            </Tooltip>
            <Button
              variant="contained"
              color="error"
              onClick={() => signOut({ callbackUrl: '/' })}
              sx={{
                borderRadius: 2,
                textTransform: 'none',
                backgroundColor: '#d32f2f',
                fontSize: '0.875rem',
                py: 0.5,
                '&:hover': { backgroundColor: '#b71c1c' },
              }}
              aria-label="Logout"
            >
              Logout
            </Button>
          </Box>
        </Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="body1" sx={{ color: '#666', fontSize: '0.875rem' }}>
            Showing paid lab orders
          </Typography>
          <Chip
            label={`${patients.reduce((acc, p) => acc + p.labOrders.length, 0)} Paid Lab Tests`}
            color="primary"
            variant="outlined"
            sx={{ fontWeight: 500, borderColor: 'rgba(26, 35, 126, 0.3)', fontSize: '0.875rem' }}
          />
        </Box>
        {error && (
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
        )}
        <Card
          sx={{
            borderRadius: 2,
            boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
            '&:hover': { boxShadow: '0 6px 16px rgba(0,0,0,0.08)' },
            transition: 'all 0.3s ease',
          }}
        >
          <CardContent sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
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
                Welcome, {session?.user?.name || 'Laboratorist'}!
              </Typography>
            </Box>
            {patients.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 4, backgroundColor: '#f8f9ff', borderRadius: 1 }}>
                <ScienceIcon sx={{ fontSize: 48, color: '#e0e0e0', mb: 1 }} />
                <Typography variant="body1" color="text.secondary">
                  No paid lab tests assigned to you
                </Typography>
              </Box>
            ) : (
              <Box sx={{ height: '60vh', overflow: 'auto', bgcolor: 'background.paper', borderRadius: 1 }}>
                <List>
                  {patients.map((patient) => (
                    <Box key={patient.patientId}>
                      <ListItem
                        onClick={() => toggleExpand(patient.patientId)}
                        sx={{
                          p: 1,
                          mb: 1,
                          border: '1px solid #e0e0e0',
                          borderRadius: 2,
                          backgroundColor: '#f8f9ff',
                          '&:hover': { backgroundColor: '#e8eaf6' },
                          cursor: 'pointer',
                        }}
                      >
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                          <Typography variant="body2" sx={{ fontWeight: 500, color: '#1a237e', fontSize: '1.25rem' }}>
                            {patient.patientName}
                          </Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography variant="body2" sx={{ color: '#666' }}>
                              {patient.labOrders.length} Paid Test{patient.labOrders.length > 1 ? 's' : ''}
                            </Typography>
                            <IconButton
                              aria-label={expandedPatients[patient.patientId] ? 'Hide details' : 'Show details'}
                            >
                              {expandedPatients[patient.patientId] ? (
                                <ExpandLessIcon sx={{ color: '#00bcd4' }} />
                              ) : (
                                <ExpandMoreIcon sx={{ color: '#00bcd4' }} />
                              )}
                            </IconButton>
                          </Box>
                        </Box>
                      </ListItem>
                      <Collapse in={expandedPatients[patient.patientId]} timeout="auto">
                        <Box
                          sx={{
                            border: '1px solid #e0e0e0',
                            borderRadius: 2,
                            backgroundColor: '#fff',
                            m: 2,
                            p: 1,
                          }}
                        >
                          <Typography variant="body2" sx={{ fontWeight: 600, color: '#006064', mb: 1 }}>
                            {patient.patientName} (Doctor: {patient.doctorName})
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Visit Status: {patient.visitStatus.replace(/_/g, ' ')}
                          </Typography>
                          {patient.labOrders.map((order) => (
                            <Box
                              key={order.labOrderId}
                              sx={{
                                py: 1,
                                px: 2,
                                mt: 1,
                                backgroundColor: 'rgba(56, 142, 60, 0.05)',
                                border: '1px solid rgba(56, 142, 60, 0.2)',
                                borderRadius: 1,
                                '&:not(:last-child)': { mb: 1 },
                              }}
                            >
                              <Typography variant="body2" sx={{ fontWeight: 500, color: '#1a237e' }}>
                                {order.serviceName}
                              </Typography>
                              <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>
                                Ordered by: {order.orderedByName} | Lab: {order.laboratoristName}
                              </Typography>
                              <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                                Ordered at: {new Date(order.orderedAt).toLocaleString('en-US', {
                                  timeZone: 'Africa/Nairobi',
                                  dateStyle: 'medium',
                                  timeStyle: 'short',
                                })}
                              </Typography>
                              <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                                Paid at: {new Date(order.paidAt).toLocaleString('en-US', {
                                  timeZone: 'Africa/Nairobi',
                                  dateStyle: 'medium',
                                  timeStyle: 'short',
                                })}
                              </Typography>
                              <TextField
                                label="Lab Result"
                                value={resultInputs[order.labOrderId] || ''}
                                onChange={(e) =>
                                  setResultInputs((prev) => ({
                                    ...prev,
                                    [order.labOrderId]: e.target.value,
                                  }))
                                }
                                fullWidth
                                multiline
                                rows={2}
                                placeholder="Enter result details..."
                                sx={{
                                  mt: 1,
                                  '& .MuiOutlinedInput-root': { borderRadius: 2, fontSize: '0.875rem' },
                                  backgroundColor: '#fff',
                                }}
                                inputProps={{ 'aria-label': `Result for ${order.serviceName} for ${patient.patientName}` }}
                              />
                              <Button
                                variant="contained"
                                onClick={() => handleSubmitResult(order.labOrderId)}
                                disabled={submitting === order.labOrderId}
                                startIcon={submitting === order.labOrderId ? <CircularProgress size={16} /> : null}
                                sx={{
                                  mt: 1,
                                  borderRadius: 2,
                                  textTransform: 'none',
                                  backgroundColor: '#00bcd4',
                                  fontSize: '0.875rem',
                                  py: 0.5,
                                  '&:hover': { backgroundColor: '#00acc1', boxShadow: '0 2px 4px rgba(0, 188, 212, 0.3)' },
                                }}
                                aria-label={`Submit result for lab order ${order.labOrderId}`}
                              >
                                {submitting === order.labOrderId ? 'Submitting...' : 'Submit Result'}
                              </Button>
                            </Box>
                          ))}
                        </Box>
                      </Collapse>
                    </Box>
                  ))}
                </List>
              </Box>
            )}
            {totalPages > 1 && (
              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                <Pagination
                  count={totalPages}
                  page={page}
                  onChange={handlePageChange}
                  color="primary"
                  sx={{ '& .MuiPaginationItem-root': { borderRadius: 2 } }}
                />
              </Box>
            )}
          </CardContent>
        </Card>
      </Box>
    </ProtectedLayout>
  );
}
