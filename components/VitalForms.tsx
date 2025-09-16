'use client';

import { useEffect, useState } from 'react';
import {
  Box,
  TextField,
  Button,
  Alert,
  Typography,
  Paper,
  Divider,
  CircularProgress,
} from '@mui/material';
import { useSession } from 'next-auth/react';

interface VitalsFormProps {
  appointmentId: number;
  onSuccess?: () => void;
}

interface VitalsData {
  weight?: number | null;
  bpSystolic?: number | null;
  bpDiastolic?: number | null;
  measuredAt?: string | null;
  measuredById?: string | null;
}

export default function VitalsForm({ appointmentId, onSuccess }: VitalsFormProps) {
  const { data: session } = useSession();
  const [weight, setWeight] = useState<string>('');
  const [bpSystolic, setBpSystolic] = useState<string>('');
  const [bpDiastolic, setBpDiastolic] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [hasExistingVitals, setHasExistingVitals] = useState(false);

  // ✅ FETCH EXISTING VITALS ON MOUNT
  useEffect(() => {
    const fetchVitals = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/appointments/${appointmentId}`);
        if (!res.ok) throw new Error('Failed to load appointment');

        const appointment = await res.json();
        const vitals = appointment.vitals as VitalsData | null;

        if (vitals) {
          setHasExistingVitals(true);
          if (vitals.weight !== undefined && vitals.weight !== null) {
            setWeight(vitals.weight.toString());
          }
          if (vitals.bpSystolic !== undefined && vitals.bpSystolic !== null) {
            setBpSystolic(vitals.bpSystolic.toString());
          }
          if (vitals.bpDiastolic !== undefined && vitals.bpDiastolic !== null) {
            setBpDiastolic(vitals.bpDiastolic.toString());
          }
        }
      } catch (err: any) {
        console.error('Failed to fetch vitals:', err);
        // Silently fail — form stays empty for new entry
      } finally {
        setLoading(false);
      }
    };

    if (appointmentId) {
      fetchVitals();
    }
  }, [appointmentId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    // Validate: at least one field filled
    if (!weight.trim() && !bpSystolic.trim() && !bpDiastolic.trim()) {
      setError('Please enter at least one vital measurement');
      return;
    }

    setSubmitting(true);

    try {
      const payload: any = { appointmentId };
      if (weight) payload.weight = parseFloat(weight);
      if (bpSystolic) payload.bpSystolic = parseInt(bpSystolic, 10);
      if (bpDiastolic) payload.bpDiastolic = parseInt(bpDiastolic, 10);

      const res = await fetch('/api/vitals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to save vitals');
      }

      setSuccess(true);
      setHasExistingVitals(true); // Mark as having vitals now

      if (onSuccess) onSuccess();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // Hide for non-receptionists
  if (session?.user.role !== 'RECEPTIONIST') {
    return null;
  }

  // Show loading state
  if (loading) {
    return (
      <Paper sx={{ p: 3, mb: 4, borderRadius: 2, boxShadow: 1 }}>
        <Typography variant="h6" gutterBottom fontWeight="bold" color="primary">
          Loading Vitals Form...
        </Typography>
        <CircularProgress size={24} />
      </Paper>
    );
  }

  return (
    <Paper sx={{ p: 3, mb: 4, borderRadius: 2, boxShadow: 1 }}>
      <Typography variant="h6" gutterBottom fontWeight="bold" color="primary">
        {hasExistingVitals ? 'Update Patient Vitals' : 'Record Patient Vitals'}
      </Typography>
      <Divider sx={{ mb: 3 }} />

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 2 }}>
          Vitals {hasExistingVitals ? 'updated' : 'recorded'} successfully!
        </Alert>
      )}

      <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <TextField
          label="Weight (kg)"
          type="number"
          value={weight}
          onChange={(e) => setWeight(e.target.value)}
          placeholder="e.g. 70.5"
          fullWidth
          size="small"
        />

        <Box sx={{ display: 'flex', gap: 2 }}>
          <TextField
            label="BP Systolic (mmHg)"
            type="number"
            value={bpSystolic}
            onChange={(e) => setBpSystolic(e.target.value)}
            placeholder="e.g. 120"
            fullWidth
            size="small"
          />
          <TextField
            label="BP Diastolic (mmHg)"
            type="number"
            value={bpDiastolic}
            onChange={(e) => setBpDiastolic(e.target.value)}
            placeholder="e.g. 80"
            fullWidth
            size="small"
          />
        </Box>

        <Button
          type="submit"
          variant="contained"
          color="primary"
          disabled={submitting}
          sx={{ mt: 1, py: 1.5 }}
        >
          {submitting ? (
            <CircularProgress size={24} color="inherit" />
          ) : hasExistingVitals ? (
            'Update Vitals'
          ) : (
            'Record Vitals'
          )}
        </Button>
      </Box>
    </Paper>
  );
}