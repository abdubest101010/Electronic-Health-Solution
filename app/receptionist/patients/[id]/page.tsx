'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { use } from 'react';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableRow,
  Skeleton,
  Button,
  TextField,
  Collapse,
  Divider,
  CircularProgress,
} from '@mui/material';
import AssignDoctorForm from '@/components/AssignDoctorForm';
import ProtectedLayout from '@/components/ProtectedLayout';

interface PatientData {
  id: number;
  name?: string;
  phone?: string;
  address?: string;
  gender?: string;
  age?: number;
  dob?: string;
  history?: any;
  notifications?: any;
  visitStatus?: string;
  doctorName?: string;
  vitals?: {
    weight?: number;
    bpSystolic?: number;
    bpDiastolic?: number;
    measuredById?: string;
    measuredAt?: string;
  };
  latestAppointment?: {
    id: number;
    dateTime?: string;
    examination?: any;
    prescription?: any;
  };
}

export default function PatientDetails({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [patient, setPatient] = useState<PatientData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showVitalsForm, setShowVitalsForm] = useState(false);
  const [vitalsInput, setVitalsInput] = useState({
    weight: '',
    bpSystolic: '',
    bpDiastolic: '',
  });
  const [vitalsSaving, setVitalsSaving] = useState(false);
  const router = useRouter();

  const fetchPatient = async () => {
    try {
      setError(null);
      setLoading(true);
      const res = await fetch(`/api/patients/${id}`);
      if (!res.ok) throw new Error('Failed to load patient details');
      const data = await res.json();
      console.log('Patient data:', data);
      setPatient(data);
    } catch (err) {
      setError('Could not load patient details. Please try again.');
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPatient();
  }, [id]);

  const handleVitalsSubmit = async () => {
    const weight = parseFloat(vitalsInput.weight);
    const bpSystolic = parseInt(vitalsInput.bpSystolic);
    const bpDiastolic = parseInt(vitalsInput.bpDiastolic);

    if (isNaN(weight) || weight <= 0 || isNaN(bpSystolic) || bpSystolic <= 0 || isNaN(bpDiastolic) || bpDiastolic <= 0) {
      setError('Please enter valid positive numbers for weight and blood pressure.');
      return;
    }

    try {
      setVitalsSaving(true);
      const response = await fetch(`/api/patients/${id}/vitals`, {
        method: patient?.vitals ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          weight,
          bpSystolic,
          bpDiastolic,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save vitals');
      }

      setShowVitalsForm(false);
      setVitalsInput({ weight: '', bpSystolic: '', bpDiastolic: '' });
      await fetchPatient();
    } catch (err) {
      console.error('Vitals save error:', err);
      setError('Failed to save vitals. Please try again.');
    } finally {
      setVitalsSaving(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setVitalsInput({ ...vitalsInput, [e.target.name]: e.target.value });
  };

  if (error && !vitalsSaving) {
    return (
      <Box sx={{ p: 2, maxWidth: 1000, mx: 'auto', bgcolor: '#fff', borderRadius: 2, boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
        <Typography color="error" sx={{ textAlign: 'center', py: 2 }}>
          {error}
        </Typography>
      </Box>
    );
  }

  if (loading) {
    return (
      <ProtectedLayout allowedRoles={['RECEPTIONIST']}>
      <Box sx={{ p: 2, maxWidth: 1000, mx: 'auto', bgcolor: '#fff', borderRadius: 2, boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
        <Skeleton variant="text" width="40%" height={40} sx={{ mb: 2, mx: 2 }} />
        <TableContainer component={Paper} sx={{ borderRadius: 2, mx: 2, boxShadow: 'none' }}>
          <Table>
            <TableBody>
              {[...Array(5)].map((_, index) => (
                <TableRow key={index}>
                  <TableCell><Skeleton variant="text" width="30%" /></TableCell>
                  <TableCell><Skeleton variant="text" width="60%" /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
      </ProtectedLayout>
    );
  }

  if (!patient) {
    return (
      <Box sx={{ p: 2, maxWidth: 1000, mx: 'auto', bgcolor: '#fff', borderRadius: 2, boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
        <Typography color="warning.main" sx={{ textAlign: 'center', py: 2 }}>
          No patient found with ID: {id}
        </Typography>
      </Box>
    );
  }

  const validVisitStatuses = [
    'REGISTERED',
    'VITALS_TAKEN',
    'ASSIGNED_TO_DOCTOR',
    'EXAMINED',
    'LAB_ORDERED',
    'PAID_FOR_LAB',
    'ASSIGNED_TO_LAB',
    'LAB_COMPLETED',
    'FINALIZED',
  ];

  const fields: { key: keyof PatientData; label: string; format?: (value: any) => string | null }[] = [
    { key: 'name', label: 'Name' },
    { key: 'phone', label: 'Phone' },
    { key: 'address', label: 'Address' },
    { key: 'gender', label: 'Gender' },
    { key: 'age', label: 'Age' },
    {
      key: 'dob',
      label: 'Date of Birth',
      format: (value: string) => new Date(value).toLocaleDateString('en-US', { timeZone: 'Africa/Nairobi' }),
    },
    {
      key: 'history',
      label: 'Medical History',
      format: (value: any) => (Array.isArray(value) ? value.map((item: any) => item.visitDetails).join(', ') : null),
    },
    {
      key: 'notifications',
      label: 'Notifications',
      format: (value: any) => (Array.isArray(value) ? value.map((item: any) => item.message).join(', ') : null),
    },
    {
      key: 'visitStatus',
      label: 'Visit Status',
      format: (value: string) => (validVisitStatuses.includes(value) ? value : null),
    },
    { key: 'doctorName', label: 'Assigned Doctor' },
  ];

  const displayFields = fields.filter(
    ({ key, format }) => {
      const value = patient[key];
      if (value === null || value === undefined) return false;
      if (format && !format(value)) return false;
      return true;
    }
  );

  const hasVitals = patient.vitals && Object.keys(patient.vitals).length > 0;

  return (
    <Box sx={{ p: 2, maxWidth: 1000, mx: 'auto', bgcolor: '#fff', borderRadius: 2, boxShadow: '0 2px 8px rgba(0,0,0,0.1)', paddingTop:8, }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, px: 2, pt: 2 }}>
          <Button
            variant="outlined"
            onClick={() => router.push('/receptionist')}
            sx={{ mr: 2, color: '#1a237e', borderColor: '#1a237e', '&:hover': { borderColor: '#283593', backgroundColor: 'rgba(40, 53, 147, 0.04)' } }}
          >
            Back to Dashboard
          </Button>
        <Typography variant="h6" sx={{ fontWeight: 500, color: '#1a237e' }}>
          Patient: {patient.name || `ID ${patient.id}`}
        </Typography>
      </Box>

      <Divider sx={{ mb: 2, mx: 2 }} />

      <Box sx={{ px: 2, mb: 3 }}>
        <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 500, color: '#1a237e' }}>
          Patient Information
        </Typography>
        <TableContainer component={Paper} sx={{ borderRadius: 2, boxShadow: 'none' }}>
          <Table>
            <TableBody>
              {displayFields.map(({ key, label, format }) => (
                <TableRow key={key} sx={{ '&:hover': { backgroundColor: 'rgba(0, 0, 0, 0.02)' } }}>
                  <TableCell sx={{ fontWeight: 500, color: '#1a237e', width: '30%' }}>{label}</TableCell>
                  <TableCell sx={{ color: '#1a237e' }}>{format ? format(patient[key]) ?? '' : patient[key]}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>

      <Box sx={{ px: 2, mb: 3 }}>
        <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 500, color: '#1a237e' }}>
          Latest Appointment
        </Typography>
        {patient.latestAppointment?.dateTime ? (
          <TableContainer component={Paper} sx={{ borderRadius: 2, boxShadow: 'none' }}>
            <Table>
              <TableBody>
                <TableRow sx={{ '&:hover': { backgroundColor: 'rgba(0, 0, 0, 0.02)' } }}>
                  <TableCell sx={{ fontWeight: 500, color: '#1a237e', width: '30%' }}>Appointment Date</TableCell>
                  <TableCell sx={{ color: '#1a237e' }}>
                    {new Date(patient.latestAppointment.dateTime).toLocaleDateString('en-US', {
                      timeZone: 'Africa/Nairobi',
                    })}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>
        ) : (
          <Typography variant="body2" color="text.secondary" sx={{ py: 1 }}>
            No appointment scheduled
          </Typography>
        )}
      </Box>

      <Box sx={{ px: 2, mb: 3 }}>
        <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 500, color: '#1a237e' }}>
          Vitals
        </Typography>
        {hasVitals ? (
          <TableContainer component={Paper} sx={{ borderRadius: 2, boxShadow: 'none' }}>
            <Table>
              <TableBody>
                {patient.vitals?.weight && (
                  <TableRow sx={{ '&:hover': { backgroundColor: 'rgba(0, 0, 0, 0.02)' } }}>
                    <TableCell sx={{ fontWeight: 500, color: '#1a237e', width: '30%' }}>Weight</TableCell>
                    <TableCell sx={{ color: '#1a237e' }}>{patient.vitals.weight} kg</TableCell>
                  </TableRow>
                )}
                {patient.vitals?.bpSystolic && (
                  <TableRow sx={{ '&:hover': { backgroundColor: 'rgba(0, 0, 0, 0.02)' } }}>
                    <TableCell sx={{ fontWeight: 500, color: '#1a237e', width: '30%' }}>Blood Pressure</TableCell>
                    <TableCell sx={{ color: '#1a237e' }}>
                      {patient.vitals.bpSystolic}/{patient.vitals.bpDiastolic} mmHg
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        ) : (
          <Typography variant="body2" color="text.secondary" sx={{ py: 1 }}>
            No vitals recorded
          </Typography>
        )}
        <Button
          variant="contained"
          onClick={() => setShowVitalsForm(!showVitalsForm)}
          sx={{
            mt: 1,
            bgcolor: '#1a237e',
            '&:hover': { bgcolor: '#283593' },
            textTransform: 'none',
          }}
        >
          {hasVitals ? 'Update Vitals' : 'Add Vitals'}
        </Button>
        <Collapse in={showVitalsForm}>
          <Box sx={{ mt: 2, p: 2, bgcolor: '#f8f9ff', borderRadius: 2 }}>
            <TextField
              label="Weight (kg)"
              name="weight"
              value={vitalsInput.weight}
              onChange={handleInputChange}
              type="number"
              fullWidth
              sx={{ mb: 2, bgcolor: '#fff' }}
              inputProps={{ min: 0 }}
            />
            <TextField
              label="Blood Pressure Systolic (mmHg)"
              name="bpSystolic"
              value={vitalsInput.bpSystolic}
              onChange={handleInputChange}
              type="number"
              fullWidth
              sx={{ mb: 2, bgcolor: '#fff' }}
              inputProps={{ min: 0 }}
            />
            <TextField
              label="Blood Pressure Diastolic (mmHg)"
              name="bpDiastolic"
              value={vitalsInput.bpDiastolic}
              onChange={handleInputChange}
              type="number"
              fullWidth
              sx={{ mb: 2, bgcolor: '#fff' }}
              inputProps={{ min: 0 }}
            />
            <Button
              variant="contained"
              onClick={handleVitalsSubmit}
              disabled={
                vitalsSaving ||
                !vitalsInput.weight ||
                !vitalsInput.bpSystolic ||
                !vitalsInput.bpDiastolic ||
                parseFloat(vitalsInput.weight) <= 0 ||
                parseInt(vitalsInput.bpSystolic) <= 0 ||
                parseInt(vitalsInput.bpDiastolic) <= 0
              }
              sx={{
                bgcolor: '#1a237e',
                '&:hover': { bgcolor: '#283593' },
                textTransform: 'none',
                display: 'flex',
                alignItems: 'center',
                gap: 1,
              }}
            >
              {vitalsSaving ? (
                <>
                  <CircularProgress size={20} sx={{ color: '#fff' }} />
                  Saving...
                </>
              ) : (
                'Save Vitals'
              )}
            </Button>
          </Box>
        </Collapse>
      </Box>

      <Box sx={{ px: 2 }}>
        <AssignDoctorForm patientId={patient.id} patientName={patient.name || `ID ${patient.id}`} onAssign={fetchPatient} />
      </Box>
    </Box>
  );
}