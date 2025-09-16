'use client';

import { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Button,
  Alert,
  CircularProgress,
  Card,
  CardContent,
} from '@mui/material';
import PersonAddIcon from '@mui/icons-material/PersonAdd';

interface Doctor {
  id: string;
  name: string;
}

interface AssignDoctorFormProps {
  patientId: number;
  patientName: string;
  onAssign?: () => void; // Callback to refresh parent
}

export default function AssignDoctorForm({ patientId, patientName, onAssign }: AssignDoctorFormProps) {
  const [doctorId, setDoctorId] = useState('');
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        setLoading(true);
        const res = await fetch('/api/doctors');
        if (!res.ok) throw new Error('Failed to load doctors');
        const data = await res.json();
        console.log('Doctors fetched:', data);
        setDoctors(data);
      } catch (err) {
        console.error('Fetch error:', err);
        setError('Could not load doctors. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    fetchDoctors();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!doctorId) {
      setError('Please select a doctor.');
      return;
    }

    setSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch('/api/assign-doctor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ patientId, doctorId }),
      });

      const data = await res.json();
      console.log('Assignment response:', data);

      if (res.ok) {
        setSuccess('Doctor assigned successfully!');
        setDoctorId('');
        if (onAssign) onAssign();
      } else {
        setError(data.error || 'Failed to assign doctor.');
      }
    } catch (err) {
      console.error('Submit error:', err);
      setError('Network error. Check console for details.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card sx={{ borderRadius: 2, boxShadow: '0 4px 12px rgba(0,0,0,0.05)', mt: 3 }}>
      <CardContent sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <PersonAddIcon
            sx={{
              mr: 1,
              color: '#00bcd4',
              backgroundColor: 'rgba(0, 188, 212, 0.1)',
              borderRadius: 1,
              p: 0.5,
            }}
          />
          <Typography variant="h6" sx={{ fontWeight: 600, color: '#1a237e' }}>
            Assign Doctor to {patientName}
          </Typography>
        </Box>

        {error && (
          <Alert
            severity="error"
            onClose={() => setError(null)}
            sx={{ mb: 2, backgroundColor: 'rgba(244, 67, 54, 0.08)', borderLeft: '4px solid #f44336' }}
          >
            {error}
          </Alert>
        )}

        {success && (
          <Alert
            severity="success"
            onClose={() => setSuccess(null)}
            sx={{ mb: 2, backgroundColor: 'rgba(46, 125, 50, 0.08)', borderLeft: '4px solid #2e7d32' }}
          >
            {success}
          </Alert>
        )}

        <form onSubmit={handleSubmit}>
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel id="doctor-select-label">Select Doctor</InputLabel>
            <Select
              labelId="doctor-select-label"
              value={doctorId}
              label="Select Doctor"
              onChange={(e) => setDoctorId(e.target.value)}
              disabled={loading || submitting}
              sx={{ backgroundColor: '#f8f9ff', borderRadius: 1 }}
            >
              <MenuItem value="">
                <em>{loading ? 'Loading doctors...' : 'Select a doctor'}</em>
              </MenuItem>
              {doctors.map((doc) => (
                <MenuItem key={doc.id} value={doc.id}>
                  {doc.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <Button
            type="submit"
            variant="contained"
            disabled={loading || submitting || !doctorId}
            startIcon={submitting ? <CircularProgress size={16} /> : null}
            sx={{
              textTransform: 'none',
              backgroundColor: '#00bcd4',
              '&:hover': { backgroundColor: '#00acc1', boxShadow: '0 2px 4px rgba(0, 188, 212, 0.3)' },
              width: '100%',
            }}
          >
            {submitting ? 'Assigning...' : 'Assign Doctor'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}