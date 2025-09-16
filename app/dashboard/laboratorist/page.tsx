'use client';

import { useEffect, useState } from 'react';
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
  appointmentId: number;
  patientName: string;
  serviceName: string;
  doctorName: string;
  doctorId: string;
  laboratoristName: string;
  orderedAt: string;
  paidAt: string;
}

export default function LaboratoristDashboard() {
  const { data: session, status } = useSession();
  const [orders, setOrders] = useState<LabOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState<number | null>(null);
  const [resultInputs, setResultInputs] = useState<Record<number, string>>({});
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [expandedOrders, setExpandedOrders] = useState<Record<number, boolean>>({});
  const perPage = 20;

  const fetchOrders = async (pageNum: number = 1) => {
    try {
      setError(null);
      setLoading(true);
      const res = await fetch(`/api/todays-paid-lab-order?page=${pageNum}&perPage=${perPage}`, {
        cache: 'no-store',
      });
      console.log('🔍 [LaboratoristDashboard] Fetch response status:', res.status);
      if (!res.ok) {
        const errorData = await res.json();
        console.warn('❌ [LaboratoristDashboard] Fetch error response:', errorData);
        throw new Error(errorData.error || 'Failed to load lab orders');
      }
      const { data, total } = await res.json();
      console.log('✅ [LaboratoristDashboard] Fetched lab orders:', data);
      setOrders(data || []);
      setTotalPages(Math.ceil((total || 0) / perPage));
      setResultInputs({});
      setExpandedOrders({});
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load lab orders. Please try again.');
      console.error('💥 [LaboratoristDashboard] Fetch error:', err);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (status === 'authenticated') {
      fetchOrders(page);
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
        setOrders((prev) => prev.filter((o) => o.labOrderId !== labOrderId));
        setResultInputs((prev) => {
          const next = { ...prev };
          delete next[labOrderId];
          return next;
        });
        setExpandedOrders((prev) => {
          const next = { ...prev };
          delete next[labOrderId];
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
    fetchOrders(1);
  };

  const handlePageChange = (_event: React.ChangeEvent<unknown>, value: number) => {
    setPage(value);
  };

  const toggleExpand = (labOrderId: number) => {
    setExpandedOrders((prev) => ({
      ...prev,
      [labOrderId]: !prev[labOrderId],
    }));
  };

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'Africa/Nairobi',
  });

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
            Showing paid lab orders for {today}
          </Typography>
          <Chip
            label={`${orders.length} Paid Lab Tests`}
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
            {orders.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 4, backgroundColor: '#f8f9ff', borderRadius: 1 }}>
                <ScienceIcon sx={{ fontSize: 48, color: '#e0e0e0', mb: 1 }} />
                <Typography variant="body1" color="text.secondary">
                  No paid lab tests assigned to you today
                </Typography>
              </Box>
            ) : (
              <Box sx={{ height: '60vh', overflow: 'auto', bgcolor: 'background.paper', borderRadius: 1 }}>
                <List>
                  {orders.map((order) => (
                    <ListItem
                      key={order.labOrderId}
                      sx={{
                        p: 1,
                        mb: 1,
                        border: '1px solid #e0e0e0',
                        borderRadius: 2,
                        backgroundColor: '#f8f9ff',
                        '&:hover': { backgroundColor: '#e8eaf6' },
                      }}
                    >
                      <Box sx={{ width: '100%' }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                          <Typography variant="body2" sx={{ fontWeight: 500, color: '#1a237e',fontSize: 25, }}>
                            {order.patientName} - {order.serviceName}
                          </Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography variant="body2" sx={{ color: '#666' }}>
                              Ordered: {new Date(order.orderedAt).toLocaleString('en-US', {
                                timeZone: 'Africa/Nairobi',
                                timeStyle: 'short',
                              })}
                            </Typography>
                            <IconButton
                              onClick={() => toggleExpand(order.labOrderId)}
                              aria-label={expandedOrders[order.labOrderId] ? 'Hide details' : 'Show details'}
                            >
                              {expandedOrders[order.labOrderId] ? (
                                <ExpandLessIcon sx={{ color: '#00bcd4' }} />
                              ) : (
                                <ExpandMoreIcon sx={{ color: '#00bcd4' }} />
                              )}
                            </IconButton>
                          </Box>
                        </Box>
                        <Collapse in={expandedOrders[order.labOrderId]} timeout="auto">
                          <Typography variant="body2" sx={{ color: '#666', mb: 1 }}>
                            <strong>Doctor:</strong> {order.doctorName}
                          </Typography>
                          <Typography variant="body2" sx={{ color: '#666', mb: 1 }}>
                            <strong>Assigned to:</strong> {order.laboratoristName}
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
                              mb: 1,
                              '& .MuiOutlinedInput-root': { borderRadius: 2, fontSize: '0.875rem' },
                              backgroundColor: '#fff',
                            }}
                            inputProps={{ 'aria-label': `Result for ${order.serviceName} for ${order.patientName}` }}
                          />
                          <Button
                            variant="contained"
                            onClick={() => handleSubmitResult(order.labOrderId)}
                            disabled={submitting === order.labOrderId}
                            startIcon={submitting === order.labOrderId ? <CircularProgress size={16} /> : null}
                            sx={{
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
                        </Collapse>
                      </Box>
                    </ListItem>
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