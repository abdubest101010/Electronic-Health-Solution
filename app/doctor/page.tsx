'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import ProtectedLayout from '@/components/ProtectedLayout';
import PatientList from '@/components/PatientList';
import { AssignedPatient, LabService } from '@/types/appointment';
import {
  Box,
  Typography,
  Paper,
  TextField,
  InputAdornment,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Alert,
  AlertTitle,
  Skeleton,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';

export default function DoctorDashboard() {
  const [appointments, setAppointments] = useState<AssignedPatient[]>([]);
  const [displayedPatients, setDisplayedPatients] = useState<AssignedPatient[]>([]);
  const [services, setServices] = useState<LabService[]>([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [searchLoading, setSearchLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<AssignedPatient[]>([]);
  const router = useRouter();

  useEffect(() => {
    const load = async () => {
      try {
        setError(null);
        setInitialLoading(true);
        const [patientsRes, servicesRes] = await Promise.all([
          fetch('/api/assigned-to-doctor', { cache: 'no-store' }),
          fetch('/api/lab-services', { cache: 'no-store' }),
        ]);

        if (!patientsRes.ok) throw new Error('Failed to load patients');
        if (!servicesRes.ok) throw new Error('Failed to load services');

        const patientsData: AssignedPatient[] = await patientsRes.json();
        const servicesData: LabService[] = await servicesRes.json();

        setAppointments(patientsData);
        setDisplayedPatients(patientsData); // Use API-sorted data
        setServices(servicesData);
      } catch (err) {
        console.error('Load error:', err);
        setError('Failed to load data. Please try again.');
      } finally {
        setInitialLoading(false);
      }
    };

    load();
  }, []);

  useEffect(() => {
    const fetchPatients = async () => {
      if (!searchTerm.trim()) {
        setSearchResults([]);
        setDisplayedPatients(appointments); // Show all patients when search is empty
        return;
      }

      setSearchLoading(true);
      try {
        const res = await fetch(`/api/assigned-to-doctor?search=${encodeURIComponent(searchTerm)}`, {
          cache: 'no-store',
        });
        if (!res.ok) throw new Error('Failed to fetch patients');
        const data: AssignedPatient[] = await res.json();
        console.log('Search results:', { searchTerm, data });
        setSearchResults(data);
        setDisplayedPatients(data); // Update table with search results
      } catch (err) {
        console.error('Search error:', err);
        setSearchResults([]);
        setDisplayedPatients([]);
      } finally {
        setSearchLoading(false);
      }
    };

    const debounce = setTimeout(fetchPatients, 300); // Debounce to reduce API calls
    return () => clearTimeout(debounce); // Cleanup
  }, [searchTerm, appointments]);

  const handleSelectPatient = (patientId: number) => {
    setSearchTerm(''); // Clear search input
    setSearchResults([]); // Clear search results
    setDisplayedPatients(appointments); // Restore full patient list
    router.push(`/doctor/patient/${patientId}`); // Redirect to patient details
  };

  if (error) {
    return (
      <Alert
        severity="error"
        sx={{
          m: 3,
          backgroundColor: 'rgba(244, 67, 54, 0.08)',
          borderLeft: '4px solid #f44336',
        }}
      >
        <AlertTitle>Error</AlertTitle>
        {error} — <strong>Try refreshing the page or contact support.</strong>
      </Alert>
    );
  }

  if (initialLoading) {
    return (
      <Box sx={{ m: 3 }}>
        <Skeleton variant="text" width="40%" height={40} sx={{ mb: 2 }} />
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 2fr' }, gap: 3 }}>
          <Box>
            <Paper sx={{ p: 4, borderRadius: 2, boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
              <Skeleton variant="text" width="60%" height={24} sx={{ mb: 4 }} />
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} variant="rectangular" height={48} sx={{ mb: 2, borderRadius: 1 }} />
              ))}
            </Paper>
          </Box>
          <Box>
            <Paper sx={{ p: 4, borderRadius: 2, boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
              <Skeleton variant="text" width="40%" height={24} sx={{ mb: 4 }} />
              <Skeleton variant="rectangular" height={256} sx={{ borderRadius: 1 }} />
            </Paper>
          </Box>
        </Box>
      </Box>
    );
  }

  return (
    <ProtectedLayout allowedRoles={['DOCTOR']}>
      <Box sx={{ m: 3, maxWidth: '1200px', mx: 'auto' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
          <Typography variant="h5" sx={{ fontWeight: 600, color: '#1a237e' }}>
            All Assigned Patients
          </Typography>
        </Box>

        <Paper sx={{ p: 4, borderRadius: 2, boxShadow: '0 4px 12px rgba(0,0,0,0.05)', mb: 3 }}>
          <Typography variant="h6" sx={{ fontWeight: 600, color: '#1a237e', mb: 1 }}>
            Assigned Patients
          </Typography>
          <Typography sx={{ color: '#666', mb: 3 }}>
            Search all assigned patients
          </Typography>
          <Box sx={{ mb: 2, position: 'relative' }}>
            <TextField
              fullWidth
              label="Search Patients by Name or ID"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ color: 'text.secondary' }} />
                  </InputAdornment>
                ),
              }}
              sx={{
                maxWidth: 400,
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                  backgroundColor: '#f8f9ff',
                },
              }}
              disabled={initialLoading}
            />
            {searchTerm.trim() && (
              <Paper
                sx={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  right: 0,
                  maxWidth: 400,
                  maxHeight: 300,
                  overflowY: 'auto',
                  zIndex: 1000,
                  mt: 1,
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                }}
              >
                {searchLoading ? (
                  <Box sx={{ p: 2 }}>
                    <Typography color="text.secondary">Loading...</Typography>
                  </Box>
                ) : searchResults.length === 0 ? (
                  <Box sx={{ p: 2 }}>
                    <Typography color="text.secondary">No patients found</Typography>
                  </Box>
                ) : (
                  <List>
                    {searchResults.map((patient) => (
                      <ListItem key={patient.patient.id} disablePadding>
                        <ListItemButton
                          onClick={() => handleSelectPatient(patient.patient.id)}
                          sx={{
                            textAlign: 'left',
                            '&:hover': {
                              backgroundColor: 'rgba(0, 0, 0, 0.04)',
                            },
                            paddingY: 1.5,
                          }}
                        >
                          <ListItemText
                            primary={patient.patient.name}
                            secondary={
                              patient.assignedAt
                                ? new Date(patient.assignedAt).toLocaleDateString('en-US', {
                                    timeZone: 'Africa/Nairobi',
                                  })
                                : 'Not assigned'
                            }
                            primaryTypographyProps={{
                              color: '#1a237e',
                              fontWeight: 500,
                            }}
                            secondaryTypographyProps={{
                              color: 'text.secondary',
                            }}
                          />
                        </ListItemButton>
                      </ListItem>
                    ))}
                  </List>
                )}
              </Paper>
            )}
          </Box>
          <Typography
            variant="body1"
            sx={{
              fontWeight: 500,
              color: '#1a237e',
              backgroundColor: 'rgba(26, 35, 126, 0.08)',
              px: 2,
              py: 0.5,
              borderRadius: 20,
              mb: 2,
            }}
          >
            Total: {displayedPatients.length}
          </Typography>
          {searchLoading && searchTerm.trim() ? (
            <Box>
              <Skeleton variant="text" width="60%" height={24} sx={{ mb: 2 }} />
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} variant="rectangular" height={48} sx={{ mb: 2, borderRadius: 1 }} />
              ))}
            </Box>
          ) : (
            <PatientList patients={displayedPatients} />
          )}
        </Paper>
      </Box>
    </ProtectedLayout>
  );
}