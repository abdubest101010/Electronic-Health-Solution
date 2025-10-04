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
  Switch,
  FormControlLabel,
  Collapse,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import RefreshIcon from '@mui/icons-material/Refresh';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ScienceIcon from '@mui/icons-material/Science';
import PendingIcon from '@mui/icons-material/Pending';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

interface LabTest {
  labOrderId: number;
  serviceName: string;
  orderedByName: string;
  doctorId: string;
  doctorName: string;
  laboratoristName: string;
  status: string;
  orderedAt: string;
  paidAt?: string;
}

interface LabPatient {
  patientId: number;
  patientName: string;
  doctorId?: string;
  doctorName?: string;
  visitStatus?: string;
  labTestsByDate: { date: string; labTests: LabTest[] }[];
}

export default function LabOrdersPage() {
  const [patients, setPatients] = useState<LabPatient[]>([]);
  const [filteredPatients, setFilteredPatients] = useState<LabPatient[]>([]);
  const [expandedPatients, setExpandedPatients] = useState<{ [key: number]: LabPatient }>({});
  const [expandedIds, setExpandedIds] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showPendingOnly, setShowPendingOnly] = useState(false);

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
      const expandedData = data.reduce((acc, p) => ({ ...acc, [p.patientId]: p }), {});
      setExpandedPatients(expandedData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load lab orders. Please try again.');
      console.error('💥 [LabOrdersPage] Fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    fetchPatients();
  };

  const fetchPatientDetails = async (patientId: number) => {
    if (expandedPatients[patientId]?.labTestsByDate) {
      return expandedPatients[patientId];
    }
    try {
      const res = await fetch(`/api/lab-patients/${patientId}`, { cache: 'no-store' });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to load patient details');
      }
      const data: LabPatient = await res.json();
      console.log('✅ [LabOrdersPage] Fetched patient details:', data);
      setExpandedPatients((prev) => ({ ...prev, [patientId]: data }));
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load patient details.');
      console.error('💥 [LabOrdersPage] Fetch patient details error:', err);
      return null;
    }
  };

  const handleToggleDetails = async (patientId: number) => {
    if (expandedIds.includes(patientId)) {
      setExpandedIds((prev) => prev.filter((id) => id !== patientId));
    } else {
      const details = await fetchPatientDetails(patientId);
      if (details) {
        setExpandedIds((prev) => [...prev, patientId]);
      }
    }
  };

  useEffect(() => {
    fetchPatients();
  }, []);

  useEffect(() => {
    let filtered: LabPatient[] = patients.filter((p) =>
      p.patientName.toLowerCase().includes(searchQuery.toLowerCase())
    );
    if (showPendingOnly) {
      filtered = filtered.filter((p) => {
        const fullPatient = expandedPatients[p.patientId];
        if (!fullPatient?.labTestsByDate) return false;
        return fullPatient.labTestsByDate.some((dateGroup) =>
          dateGroup.labTests.some((test) => test.status === 'ASSIGNED')
        );
      }).map((p) => {
        const fullPatient = expandedPatients[p.patientId];
        return {
          ...p,
          doctorId: fullPatient?.doctorId,
          doctorName: fullPatient?.doctorName,
          visitStatus: fullPatient?.visitStatus,
          labTestsByDate:
            fullPatient?.labTestsByDate
              .map((dateGroup) => ({
                ...dateGroup,
                labTests: dateGroup.labTests.filter((test) => test.status === 'ASSIGNED'),
              }))
              .filter((dateGroup) => dateGroup.labTests.length > 0) || [],
        };
      });
    }
    setFilteredPatients(filtered);
  }, [searchQuery, patients, showPendingOnly, expandedPatients]);

  const markAsPaid = async (patientId: number, date: string) => {
    const key = `${patientId}-${date}`;
    console.log(`[LabOrdersPage] Sending mark as paid request: patientId=${patientId}, date=${date}`);
    setProcessing(key);
    try {
      const res = await fetch('/api/mark-as-paid', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ patientId, date }),
      });

      const result = await res.json();

      if (res.ok) {
        setPatients((prev) =>
          prev.map((p) => {
            const fullPatient = expandedPatients[p.patientId];
            if (!fullPatient || fullPatient.patientId !== p.patientId) return p;
            const updatedLabTestsByDate = fullPatient.labTestsByDate?.map((dateGroup) =>
              dateGroup.date === date
                ? {
                    ...dateGroup,
                    labTests: dateGroup.labTests.map((test) =>
                      test.status === 'ASSIGNED'
                        ? { ...test, status: 'PAID', paidAt: new Date().toISOString() }
                        : test
                    ),
                  }
                : dateGroup
            ) || [];
            const allPaid = updatedLabTestsByDate.every((dateGroup) =>
              dateGroup.labTests.every((test) => test.status === 'PAID')
            );
            const updatedPatient = {
              ...p,
              doctorId: fullPatient.doctorId,
              doctorName: fullPatient.doctorName,
              visitStatus: allPaid ? 'PAID_FOR_LAB' : fullPatient.visitStatus,
              labTestsByDate: updatedLabTestsByDate,
            };
            setExpandedPatients((prevExp) => ({
              ...prevExp,
              [p.patientId]: updatedPatient,
            }));
            return updatedPatient;
          })
        );
        console.log(`✅ [LabOrdersPage] Lab orders marked as paid for patient ${patientId} on ${date}`);
      } else {
        throw new Error(
          result.error || 'Failed to mark as paid' + (result.allLabOrders ? `: ${JSON.stringify(result.allLabOrders)}` : '')
        );
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Network error');
      console.error('💥 [LabOrdersPage] Mark as paid error:', err);
    } finally {
      setProcessing(null);
    }
  };

  const getDisplayDate = (date: string) => {
    const d = new Date(date + 'T00:00:00+03:00'); // Interpret date in Africa/Nairobi
    return d.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      timeZone: 'Africa/Nairobi',
    });
  };

  if (error) {
    return (
      <Box sx={{ maxWidth: 900, mx: 'auto', mt: 4, px: 2 }}>
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
      <Box sx={{ maxWidth: 900, mx: 'auto', mt: 4, px: 2 }}>
        <Card sx={{ borderRadius: 2, boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
          <CardContent sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
              <Skeleton variant="circular" width={40} height={40} sx={{ mr: 2 }} />
              <Skeleton variant="text" width="60%" height={20} />
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
                  <Skeleton variant="text" width="80%" height={20} />
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
    <Box sx={{ maxWidth: 900, mx: 'auto', mt: 4, px: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h6" sx={{ fontWeight: 600, color: '#1a237e' }}>
          Lab Orders
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
              width: 250,
              '& .MuiOutlinedInput-root': {
                borderRadius: 2,
                backgroundColor: '#f8f9ff',
                '&:hover fieldset': { borderColor: '#1a237e' },
                fontSize: '0.9rem',
              },
            }}
            aria-label="Search patients"
          />
          <Tooltip title="Refresh lab orders">
            <IconButton
              onClick={handleRefresh}
              sx={{ color: '#00bcd4', '&:hover': { bgcolor: 'rgba(0, 188, 212, 0.1)' } }}
            >
              <RefreshIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', mb: 2 }}>
        <FormControlLabel
          control={
            <Switch
              checked={showPendingOnly}
              onChange={(e) => setShowPendingOnly(e.target.checked)}
              color="primary"
              sx={{ '& .MuiSwitch-switchBase.Mui-checked': { color: '#1a237e' } }}
            />
          }
          label="Show Pending Orders Only"
          sx={{ color: '#1a237e', fontWeight: 500, fontSize: '0.8rem' }}
          aria-label="Toggle pending lab orders"
        />
      </Box>
      <Card
        sx={{
          borderRadius: 3,
          boxShadow: '0 6px 16px rgba(0,0,0,0.08)',
          '&:hover': { boxShadow: '0 8px 20px rgba(0,0,0,0.1)' },
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
                  fontSize: 20,
                }}
              />
              <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#1a237e' }}>
                {showPendingOnly ? 'Pending Lab Orders' : 'All Lab Orders'}
              </Typography>
            </Box>
            <Chip
              label={`${filteredPatients.length > 0 ? filteredPatients.reduce((acc, p) => acc + (p.labTestsByDate?.reduce((sum, d) => sum + d.labTests.length, 0) || 0), 0) : 0} Lab Tests`}
              color="primary"
              variant="outlined"
              sx={{
                fontWeight: 500,
                fontSize: '0.8rem',
                borderColor: '#1a237e',
                color: '#1a237e',
                bgcolor: 'rgba(26, 35, 126, 0.05)',
              }}
            />
          </Box>

          {filteredPatients.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 4, backgroundColor: '#f8f9ff', borderRadius: 2 }}>
              <ScienceIcon sx={{ fontSize: 40, color: '#e0e0e0', mb: 1 }} />
              <Typography variant="body2" color="text.secondary">
                {showPendingOnly ? 'No pending lab orders' : 'No lab orders assigned'}
              </Typography>
            </Box>
          ) : (
            <List sx={{ bgcolor: 'background.paper', borderRadius: 2, overflow: 'hidden' }}>
              {filteredPatients.map((p) => (
                <Box key={p.patientId}>
                  <ListItem
                    onClick={() => handleToggleDetails(p.patientId)}
                    sx={{
                      py: 1,
                      px: 2,
                      cursor: 'pointer',
                      '&:hover': { backgroundColor: 'rgba(0, 188, 212, 0.05)' },
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <Typography variant="body2" sx={{ fontWeight: 500, color: '#1a237e' }}>
                      {p.patientName}
                    </Typography>
                    <ExpandMoreIcon
                      sx={{
                        transform: expandedIds.includes(p.patientId) ? 'rotate(180deg)' : 'rotate(0deg)',
                        transition: 'transform 0.3s ease',
                        color: '#1a237e',
                      }}
                    />
                  </ListItem>
                  <Collapse in={expandedIds.includes(p.patientId)} timeout={400}>
                    {expandedPatients[p.patientId]?.labTestsByDate && (
                      <Box
                        sx={{
                          border: '1px solid #e0e0e0',
                          borderRadius: 2,
                          overflow: 'hidden',
                          backgroundColor: '#fff',
                          m: 2,
                          p: 1,
                        }}
                      >
                        <Box sx={{ p: 1, backgroundColor: 'rgba(0, 188, 212, 0.05)', borderBottom: '1px solid #e0e0e0' }}>
                          <Typography variant="body2" sx={{ fontWeight: 600, color: '#006064' }}>
                            {p.patientName} (Doctor: {expandedPatients[p.patientId].doctorName || 'Not assigned'})
                          </Typography>
                          <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>
                            Visit Status: {(expandedPatients[p.patientId].visitStatus || 'REGISTERED').replace(/_/g, ' ')}
                          </Typography>
                        </Box>
                        {expandedPatients[p.patientId].labTestsByDate!.map((dateGroup) => {
                          const paidTests = dateGroup.labTests.filter((test) => test.status === 'PAID');
                          const pendingTests = dateGroup.labTests.filter((test) => test.status === 'ASSIGNED');
                          return (
                            <Box
                              key={dateGroup.date}
                              sx={{
                                p: 1,
                                borderBottom: '1px solid #f0f0f0',
                                backgroundColor: pendingTests.length > 0 ? 'rgba(255, 167, 38, 0.05)' : 'inherit',
                              }}
                            >
                              <Typography variant="caption" sx={{ fontWeight: 600, color: '#1a237e', mb: 1 }}>
                                {getDisplayDate(dateGroup.date)}
                              </Typography>
                              {(paidTests.length > 0 || pendingTests.length > 0) && (
                                <Box sx={{ mt: 1 }}>
                                  {pendingTests.length > 0 && (
                                    <>
                                      {pendingTests.map((test) => (
                                        <Box
                                          key={test.labOrderId}
                                          sx={{
                                            py: 0.5,
                                            px: 2,
                                            backgroundColor: 'rgba(255, 167, 38, 0.1)',
                                            borderRadius: 1,
                                            border: '1px solid rgba(255, 167, 38, 0.2)',
                                            mb: 1,
                                          }}
                                        >
                                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <Typography variant="body2" sx={{ fontWeight: 500, color: '#1a237e' }}>
                                              {test.serviceName}
                                            </Typography>
                                            <Chip
                                              icon={<PendingIcon />}
                                              label="Pending"
                                              size="small"
                                              sx={{ bgcolor: '#ffa726', color: '#fff', fontWeight: 500, fontSize: '0.7rem' }}
                                            />
                                          </Box>
                                          <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>
                                            Ordered by: {test.orderedByName} | Lab: {test.laboratoristName}
                                          </Typography>
                                          <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                                            Ordered at: {new Date(test.orderedAt).toLocaleTimeString('en-US', {
                                              hour: '2-digit',
                                              minute: '2-digit',
                                              timeZone: 'Africa/Nairobi',
                                            })}
                                          </Typography>
                                        </Box>
                                      ))}
                                      <Box sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 2, mt: 1 }}>
                                        <Button
                                          variant="contained"
                                          size="small"
                                          disabled={processing === `${p.patientId}-${dateGroup.date}`}
                                          onClick={() => markAsPaid(p.patientId, dateGroup.date)}
                                          startIcon={processing === `${p.patientId}-${dateGroup.date}` ? <CircularProgress size={16} /> : null}
                                          sx={{
                                            fontWeight: 500,
                                            fontSize: '0.8rem',
                                            backgroundColor: '#00bcd4',
                                            borderRadius: 2,
                                            '&:hover': { backgroundColor: '#00acc1', boxShadow: '0 2px 4px rgba(0, 188, 212, 0.3)' },
                                            padding: '4px 8px',
                                            minWidth: '140px',
                                          }}
                                        >
                                          {processing === `${p.patientId}-${dateGroup.date}` ? 'Processing...' : `Mark Test${pendingTests.length > 1 ? 's' : ''} as Paid`}
                                        </Button>
                                      </Box>
                                    </>
                                  )}
                                  {paidTests.length > 0 && (
                                    <Box
                                      sx={{
                                        mt: pendingTests.length > 0 ? 2 : 0,
                                        p: 1,
                                        backgroundColor: 'rgba(56, 142, 60, 0.05)',
                                        border: '1px solid rgba(56, 142, 60, 0.2)',
                                        borderRadius: 1,
                                      }}
                                    >
                                      {paidTests.map((test) => (
                                        <Box
                                          key={test.labOrderId}
                                          sx={{
                                            py: 1,
                                            px: 2,
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            '&:not(:last-child)': { borderBottom: '1px solid #f0f0f0' },
                                          }}
                                        >
                                          <Box>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                              <Typography variant="body2" sx={{ fontWeight: 500, color: '#1a237e' }}>
                                                {test.serviceName}
                                              </Typography>
                                            </Box>
                                            <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>
                                              Ordered by: {test.orderedByName} | Lab: {test.laboratoristName}
                                            </Typography>
                                            <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                                              Ordered at: {new Date(test.orderedAt).toLocaleTimeString('en-US', {
                                                hour: '2-digit',
                                                minute: '2-digit',
                                                timeZone: 'Africa/Nairobi',
                                              })}
                                            </Typography>
                                            {test.paidAt && (
                                              <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                                                Paid at: {new Date(test.paidAt).toLocaleTimeString('en-US', {
                                                  hour: '2-digit',
                                                  minute: '2-digit',
                                                  timeZone: 'Africa/Nairobi',
                                                })}
                                              </Typography>
                                            )}
                                          </Box>
                                        </Box>
                                      ))}
                                      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1 }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', color: '#388e3c' }}>
                                          <CheckCircleIcon sx={{ mr: 0.5, fontSize: 16 }} />
                                          <Typography variant="caption" sx={{ fontWeight: 500, color: '#388e3c' }}>
                                            {paidTests.length === 1 ? '1 Test Paid' : `${paidTests.length} Tests Paid`}
                                          </Typography>
                                        </Box>
                                      </Box>
                                    </Box>
                                  )}
                                </Box>
                              )}
                            </Box>
                          );
                        })}
                      </Box>
                    )}
                  </Collapse>
                </Box>
              ))}
            </List>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}