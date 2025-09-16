'use client';

import { useEffect, useState, useCallback } from 'react';
import { signOut, useSession } from 'next-auth/react';
import ProtectedLayout from '@/components/ProtectedLayout';
import PatientList from '@/components/PatientList';
import { AssignedPatient, LabService } from '@/types/appointment';
import { Box, Typography, Paper, TextField, Alert, AlertTitle, Skeleton, Button } from '@mui/material';

// Define the prop interface for PatientList
interface PatientListProps {
  patients: AssignedPatient[];
}

export default function DoctorDashboard() {
  const [appointments, setAppointments] = useState<AssignedPatient[]>([]);
  const [displayedPatients, setDisplayedPatients] = useState<AssignedPatient[]>([]);
  const [services, setServices] = useState<LabService[]>([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [searchLoading, setSearchLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const { data: session, status } = useSession();

  useEffect(() => {
    const load = async () => {
      try {
        setError(null);
        setInitialLoading(true);
        const [patientsRes, servicesRes] = await Promise.all([
          fetch('/api/todays-assigned-patients', { cache: 'no-store' }),
          fetch('/api/lab-services', { cache: 'no-store' }),
        ]);

        if (!patientsRes.ok) throw new Error('Failed to load patients');
        if (!servicesRes.ok) throw new Error('Failed to load services');

        const patientsData: AssignedPatient[] = await patientsRes.json();
        const servicesData: LabService[] = await servicesRes.json();

        setAppointments(patientsData);
        setDisplayedPatients(patientsData); // Initialize displayed list
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

  // Debounced search function to fetch from /api/assigned-to-doctor
  const debounce = <F extends (...args: any[]) => void>(func: F, wait: number) => {
    let timeout: NodeJS.Timeout;
    return (...args: Parameters<F>) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func(...args), wait);
    };
  };

  const handleSearch = useCallback(
    async (term: string) => {
      if (!term.trim()) {
        setDisplayedPatients(appointments);
        setSearchLoading(false);
        return;
      }

      try {
        setError(null);
        setSearchLoading(true);
        const allRes = await fetch('/api/assigned-to-doctor', { cache: 'no-store' });
        if (!allRes.ok) throw new Error('Failed to load all assigned patients');
        const allData: AssignedPatient[] = await allRes.json();
        const filtered = allData.filter(
          (patient) =>
            patient.patient.name?.toLowerCase().includes(term.toLowerCase()) ||
            patient.id.toString().includes(term)
        );
        setDisplayedPatients(filtered);
      } catch (err) {
        setError('Failed to load patients. Please try again.');
        console.error('Search error:', err);
      } finally {
        setSearchLoading(false);
      }
    },
    [appointments]
  );

  const debouncedSearch = useCallback(debounce(handleSearch, 300), [handleSearch]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const term = e.target.value;
    setSearchQuery(term);
    debouncedSearch(term);
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
          <Box display="flex" alignItems="center">
            <Typography variant="h5" sx={{ fontWeight: 600, color: '#1a237e' }}>
              {searchQuery ? 'Search Results' : 'Today’s Assigned Patients'}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Typography sx={{ color: '#1a237e' }}>
              Welcome, {session?.user?.name || 'Doctor'}!
            </Typography>
            <Button
              variant="contained"
              color="error"
              onClick={() => signOut({ callbackUrl: '/' })}
              sx={{ textTransform: 'none' }}
            >
              Logout
            </Button>
          </Box>
        </Box>

        <Paper sx={{ p: 4, borderRadius: 2, boxShadow: '0 4px 12px rgba(0,0,0,0.05)', mb: 3 }}>
          <Typography variant="h6" sx={{ fontWeight: 600, color: '#1a237e', mb: 1 }}>
            Assigned Patients
          </Typography>
          <Typography sx={{ color: '#666', mb: 3 }}>
            Search all assigned patients or view today’s list
          </Typography>
          <TextField
            label="Search Patients by Name or ID"
            placeholder="Type to filter patients..."
            value={searchQuery}
            onChange={handleSearchChange}
            fullWidth
            sx={{ mb: 3 }}
            variant="outlined"
            InputProps={{ sx: { borderRadius: 2 } }}
            disabled={initialLoading} // Prevent interaction during initial load
          />
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
          {searchLoading ? (
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