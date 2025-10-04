'use client';

import { useEffect, useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Select,
  MenuItem,
  Button,
  CircularProgress,
  Alert,
  Chip,
  Checkbox,
} from '@mui/material';
import { LabService } from '@/types/appointment';

interface User {
  id: string;
  name: string;
  email: string;
}

interface Props {
  patientId: number;
  services: LabService[];
  onAssignSuccess?: () => void;
}

export default function LabAssign({ patientId, services, onAssignSuccess }: Props) {
  const [laboratorists, setLaboratorists] = useState<User[]>([]);
  const [laboratoristId, setLaboratoristId] = useState<string>('');
  const [serviceIds, setServiceIds] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    const fetchLaboratorists = async () => {
      try {
        setLoading(true);
        setError(null);
        console.log('🔍 [LabAssign] Fetching laboratorists...');
        const res = await fetch('/api/users?role=LABORATORIST', { cache: 'no-store' });
        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.error || 'Failed to fetch laboratorists');
        }
        const data: User[] = await res.json();
        console.log('✅ [LabAssign] Fetched laboratorists:', data.length);
        setLaboratorists(data);
      } catch (err: any) {
        console.error('❌ [LabAssign] Failed to fetch laboratorists:', err);
        setError('Unable to load laboratorists. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchLaboratorists();
  }, []);

  const assignToLab = async () => {
    if (!laboratoristId) {
      console.warn('❌ [LabAssign] No laboratorist selected');
      alert('Please select a laboratorist.');
      return;
    }
    if (serviceIds.length === 0) {
      console.warn('❌ [LabAssign] No lab tests selected');
      alert('Please select at least one lab test.');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      setSuccess(null);
      console.log('🔄 [LabAssign] Assigning lab tests:', { patientId, serviceIds, laboratoristId });
      const res = await fetch('/api/lab-assign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientId,
          serviceIds,
          laboratoristId,
        }),
      });

      const responseData = await res.json();
      if (res.ok) {
        console.log('✅ [LabAssign] Lab tests assigned:', responseData);
        setSuccess(responseData.message || 'Lab tests successfully assigned!');
        setServiceIds([]);
        setLaboratoristId('');
        if (onAssignSuccess) onAssignSuccess();
      } else {
        console.warn('❌ [LabAssign] Error assigning lab tests:', responseData);
        setError(responseData.error || 'Failed to assign lab tests. Please try again.');
      }
    } catch (err: any) {
      console.error('💥 [LabAssign] Network error:', err);
      setError('Failed to connect to the server. Please check your network and try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleClearServices = () => {
    setServiceIds([]);
  };

  if (loading) {
    return <CircularProgress sx={{ mt: 2, display: 'block', mx: 'auto' }} />;
  }

  if (error) {
    return <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>;
  }

  return (
    <Paper
      sx={{
        p: 4,
        borderRadius: 2,
        boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
        backgroundColor: '#f8f9ff',
      }}
    >
      <Typography variant="h6" sx={{ fontWeight: 600, color: '#1a237e', mb: 3 }}>
        Assign Lab Tests for Patient
      </Typography>
      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      )}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <Box>
          <Typography variant="body2" sx={{ color: '#666', mb: 1 }}>
            Select Laboratorist
          </Typography>
          <Select
            value={laboratoristId}
            onChange={(e) => setLaboratoristId(e.target.value as string)}
            fullWidth
            displayEmpty
            sx={{
              borderRadius: 2,
              '& .MuiOutlinedInput-root': { borderRadius: 2 },
              '& .MuiSelect-select': { py: 1.5 },
            }}
          >
            <MenuItem value="" disabled>
              Select Laboratorist
            </MenuItem>
            {laboratorists.length === 0 ? (
              <MenuItem disabled>No laboratorists available</MenuItem>
            ) : (
              laboratorists.map((l) => (
                <MenuItem key={l.id} value={l.id}>
                  {l.name} ({l.email})
                </MenuItem>
              ))
            )}
          </Select>
        </Box>
        <Box>
          <Typography variant="body2" sx={{ color: '#666', mb: 1 }}>
            Select Lab Tests
          </Typography>
          <Select
            multiple
            value={serviceIds}
            onChange={(e) => setServiceIds(e.target.value as number[])}
            fullWidth
            displayEmpty
            sx={{
              minHeight: 48,
              borderRadius: 2,
              '& .MuiOutlinedInput-root': { borderRadius: 2 },
              '& .MuiSelect-select': { py: 1.5 },
            }}
            renderValue={(selected) =>
              selected.length === 0 ? (
                <Typography sx={{ color: '#666' }}>Select Lab Tests</Typography>
              ) : (
                services
                  .filter((s) => selected.includes(s.id))
                  .map((s) => s.name)
                  .join(', ')
              )
            }
          >
            {services.length === 0 ? (
              <MenuItem disabled>No lab tests available</MenuItem>
            ) : (
              services.map((s) => (
                <MenuItem
                  key={s.id}
                  value={s.id}
                  sx={{ py: 0.5, '&:hover': { backgroundColor: '#e8eaf6' } }}
                >
                  <Checkbox checked={serviceIds.includes(s.id)} sx={{ color: '#1a237e', '&.Mui-checked': { color: '#1a237e' } }} />
                  <Typography>{s.name}</Typography>
                </MenuItem>
              ))
            )}
          </Select>
          <Box sx={{ mt: 1, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {serviceIds.map((id) => {
              const service = services.find((s) => s.id === id);
              return service ? (
                <Chip
                  key={id}
                  label={service.name}
                  onDelete={() => setServiceIds(serviceIds.filter((sid) => sid !== id))}
                  sx={{
                    backgroundColor: '#e8eaf6',
                    color: '#1a237e',
                    '& .MuiChip-deleteIcon': { color: '#1a237e', '&:hover': { color: '#283593' } },
                  }}
                />
              ) : null;
            })}
          </Box>
          {serviceIds.length > 0 && (
            <Button
              onClick={handleClearServices}
              variant="outlined"
              sx={{
                mt: 1,
                borderRadius: 2,
                textTransform: 'none',
                color: '#1a237e',
                borderColor: '#1a237e',
                '&:hover': { borderColor: '#283593', backgroundColor: '#e8eaf6' },
              }}
            >
              Clear All Tests
            </Button>
          )}
        </Box>
        <Button
          onClick={assignToLab}
          disabled={submitting || !laboratoristId || serviceIds.length === 0}
          variant="contained"
          sx={{
            borderRadius: 2,
            textTransform: 'none',
            backgroundColor: submitting ? '#9e9e9e' : '#1a237e',
            '&:hover': { backgroundColor: submitting ? '#9e9e9e' : '#283593' },
            py: 1.5,
          }}
        >
          {submitting ? (
            <>
              <CircularProgress size={16} sx={{ color: '#fff', mr: 1 }} />
              Assigning...
            </>
          ) : (
            'Assign to Laboratorist'
          )}
        </Button>
      </Box>
    </Paper>
  );
}
