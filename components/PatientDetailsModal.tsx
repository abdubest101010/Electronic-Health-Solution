// components/Receptionist/PatientDetailsModal.tsx
import { useState, useEffect } from 'react';
import { 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions, 
  Button, 
  TextField, 
  Grid, 
  Typography, 
  Box,
  Divider,
  useTheme,
  CircularProgress
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WarningIcon from '@mui/icons-material/Warning';
import { styled } from '@mui/material/styles';

interface Patient {
  id: number;
  name: string;
  phone: string | null;
  address: string | null;
  gender: string | null;
  age: number | null;
}

interface Props {
  patient: Patient | null;
  onClose: () => void;
}

// Custom styled dialog
const BootstrapDialog = styled(Dialog)(({ theme }) => ({
  '& .MuiDialogContent-root': {
    padding: theme.spacing(2),
  },
  '& .MuiDialogActions-root': {
    padding: theme.spacing(1),
  },
  '& .MuiPaper-root': {
    borderRadius: 12,
    boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)'
  }
}));

export default function PatientDetailsModal({ patient, onClose }: Props) {
  const [vitals, setVitals] = useState({
    weight: '',
    bpSystolic: '',
    bpDiastolic: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const theme = useTheme();

  useEffect(() => {
    if (!patient) {
      setVitals({ weight: '', bpSystolic: '', bpDiastolic: '' });
      setSubmitStatus('idle');
    }
  }, [patient]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setVitals({ ...vitals, [e.target.name]: e.target.value });
    setSubmitStatus('idle');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vitals.weight || !vitals.bpSystolic || !vitals.bpDiastolic) {
      setSubmitStatus('error');
      return;
    }

    setSubmitting(true);
    setSubmitStatus('idle');

    try {
      const res = await fetch('/api/appointments/update-vitals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          appointmentId: patient?.id,
          weight: parseFloat(vitals.weight),
          bpSystolic: parseInt(vitals.bpSystolic, 10),
          bpDiastolic: parseInt(vitals.bpDiastolic, 10),
        }),
      });

      if (res.ok) {
        setSubmitStatus('success');
        setTimeout(() => {
          onClose();
        }, 1500);
      } else {
        setSubmitStatus('error');
      }
    } catch (err) {
      setSubmitStatus('error');
    } finally {
      setSubmitting(false);
    }
  };

  if (!patient) return null;

  return (
    <BootstrapDialog
      onClose={onClose}
      open={Boolean(patient)}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          backgroundColor: '#fafbff',
          borderRadius: 3
        }
      }}
    >
      <DialogTitle sx={{ 
        m: 0, 
        p: 3,
        pb: 2,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 600 }}>
            Patient: {patient.name}
          </Typography>
          <Typography 
            variant="body2" 
            color="text.secondary"
            sx={{ mt: 0.5 }}
          >
            ID: #{patient.id} • Age: {patient.age || 'N/A'}
          </Typography>
        </Box>
        <Button 
          onClick={onClose}
          color="error"
          startIcon={<CloseIcon />}
          sx={{ 
            minWidth: 'auto',
            p: 0.5
          }}
        />
      </DialogTitle>
      
      <DialogContent dividers>
        <Grid container spacing={3}>
          <Grid >
            <Box sx={{ 
              p: 2, 
              backgroundColor: 'white',
              borderRadius: 2,
              border: '1px solid #e0e0e0'
            }}>
              <Typography 
                variant="subtitle1" 
                sx={{ 
                  fontWeight: 500,
                  mb: 2,
                  color: '#1a237e'
                }}
              >
                Patient Information
              </Typography>
              <Divider sx={{ mb: 2 }} />
              
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Phone
                </Typography>
                <Typography variant="body1">
                  {patient.phone || 'Not provided'}
                </Typography>
              </Box>
              
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Address
                </Typography>
                <Typography variant="body1">
                  {patient.address || 'Not provided'}
                </Typography>
              </Box>
              
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Gender
                </Typography>
                <Typography variant="body1">
                  {patient.gender ? 
                    patient.gender.charAt(0).toUpperCase() + patient.gender.slice(1) 
                    : 'Not specified'}
                </Typography>
              </Box>
            </Box>
          </Grid>
          
          <Grid >
            <Box component="form" onSubmit={handleSubmit}>
              <Typography 
                variant="subtitle1" 
                sx={{ 
                  fontWeight: 500,
                  mb: 2,
                  color: '#1a237e'
                }}
              >
                Update Vitals
              </Typography>
              <Divider sx={{ mb: 2 }} />
              
              {submitStatus === 'success' && (
                <Box sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 1,
                  p: 2,
                  mb: 2,
                  backgroundColor: 'rgba(76, 175, 80, 0.1)',
                  borderRadius: 1,
                  color: '#388e3c'
                }}>
                  <CheckCircleIcon />
                  <Typography variant="body2">
                    Vitals updated successfully! Closing in 1 second...
                  </Typography>
                </Box>
              )}
              
              {submitStatus === 'error' && (
                <Box sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 1,
                  p: 2,
                  mb: 2,
                  backgroundColor: 'rgba(244, 67, 54, 0.1)',
                  borderRadius: 1,
                  color: '#d32f2f'
                }}>
                  <WarningIcon />
                  <Typography variant="body2">
                    Please fill all fields correctly
                  </Typography>
                </Box>
              )}
              
              <TextField
                name="weight"
                label="Weight (kg)"
                type="number"
                fullWidth
                value={vitals.weight}
                onChange={handleChange}
                error={submitStatus === 'error' && !vitals.weight}
                helperText={submitStatus === 'error' && !vitals.weight ? "Required" : ""}
                InputLabelProps={{ shrink: true }}
                sx={{ mb: 2 }}
              />
              
              <Grid container spacing={2}>
                <Grid >
                  <TextField
                    name="bpSystolic"
                    label="BP Systolic"
                    type="number"
                    fullWidth
                    value={vitals.bpSystolic}
                    onChange={handleChange}
                    error={submitStatus === 'error' && !vitals.bpSystolic}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
                <Grid >
                  <TextField
                    name="bpDiastolic"
                    label="BP Diastolic"
                    type="number"
                    fullWidth
                    value={vitals.bpDiastolic}
                    onChange={handleChange}
                    error={submitStatus === 'error' && !vitals.bpDiastolic}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
              </Grid>
            </Box>
          </Grid>
        </Grid>
      </DialogContent>
      
      <DialogActions sx={{ p: 3 }}>
        <Button 
          onClick={onClose}
          variant="outlined"
          color="secondary"
          sx={{ 
            mr: 1,
            textTransform: 'none',
            px: 3
          }}
        >
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={submitting}
          sx={{ 
            textTransform: 'none',
            px: 3,
            fontWeight: 500,
            boxShadow: '0 2px 4px rgba(26, 35, 126, 0.2)'
          }}
        >
          {submitting ? (
            <CircularProgress size={24} color="inherit" />
          ) : 'Update Vitals'}
        </Button>
      </DialogActions>
    </BootstrapDialog>
  );
}