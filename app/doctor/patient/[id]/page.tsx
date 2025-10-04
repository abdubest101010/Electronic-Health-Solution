'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Container, Typography, CircularProgress, Alert, Button, Box, Snackbar } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ExaminationSection from '@/components/ExaminationSection';
import { LabService } from '@/types/appointment';

interface Patient {
  id: number;
  name: string;
  history?: string | null;
  visitStatus: string;
  vitals?: {
    weight?: number | null;
    bpSystolic?: number | null;
    bpDiastolic?: number | null;
    measuredById?: string | null;
    measuredAt?: string | null;
  } | null;
  examination?: { appointmentId: number | null; complaints: string | null; diagnosis: string | null; visitStatus: string; createdAt: string }[] | null;
  prescription?: { appointmentId: number | null; medicines: string | null; recommendations: string | null; createdAt: string }[] | null;
}

export default function PatientDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { id } = React.use(params);
  const patientId = parseInt(id, 10);
  const [patient, setPatient] = useState<Patient | null>(null);
  const [services, setServices] = useState<LabService[]>([]);
  const [loading, setLoading] = useState(true);
  const [backLoading, setBackLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/api/auth/signin');
      return;
    }
    if (status === 'authenticated' && session?.user.role !== 'DOCTOR') {
      setError('Unauthorized: Doctor only');
      setLoading(false);
      return;
    }

    const fetchPatient = async () => {
      try {
        const response = await fetch(`/api/patients/${id}`, {
          headers: { 'Content-Type': 'application/json' },
          cache: 'no-store',
        });
        if (!response.ok) {
          throw new Error(`Failed to fetch patient: HTTP ${response.status}`);
        }
        const data = await response.json();
        console.log('✅ [PatientDetails] Fetched patient:', data);
        setPatient({
          ...data,
          examination: Array.isArray(data.examination) ? data.examination : [],
          prescription: Array.isArray(data.prescription) ? data.prescription : [],
        });
      } catch (err: any) {
        console.error('💥 [PatientDetails] Error fetching patient:', err);
        setError(err.message);
      }
    };

    const fetchServices = async () => {
      try {
        const response = await fetch('/api/services?type=LAB_TEST', {
          headers: { 'Content-Type': 'application/json' },
          cache: 'no-store',
        });
        if (!response.ok) {
          console.error(`💥 [PatientDetails] Failed to fetch services: HTTP ${response.status}`);
          setServices([]);
          setError('Failed to load lab services. Please try again.');
          return;
        }
        const data = await response.json();
        console.log('✅ [PatientDetails] Fetched services:', data);
        setServices(data);
      } catch (err: any) {
        console.error('💥 [PatientDetails] Error fetching services:', err);
        setServices([]);
        setError('Failed to load lab services. Please try again.');
      }
    };

    Promise.all([fetchPatient(), fetchServices()]).finally(() => setLoading(false));
  }, [id, status, session, router]);

  const handleExamine = useCallback(async (formData: { complaints: string; diagnosis: string }) => {
    if (!patient) {
      setError('No patient selected');
      return;
    }
    try {
      const response = await fetch(`/api/examine`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientId: patient.id,
          complaints: formData.complaints,
          diagnosis: formData.diagnosis,
        }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to save examination: HTTP ${response.status}`);
      }
      const result = await response.json();
      console.log('✅ [PatientDetails] Examination saved:', result.examination);
      setSuccessMessage('Examination saved successfully');

      // Refresh patient data
      const updatedResponse = await fetch(`/api/patients/${id}`, {
        headers: { 'Content-Type': 'application/json' },
        cache: 'no-store',
      });
      if (updatedResponse.ok) {
        const updatedData = await updatedResponse.json();
        console.log('✅ [PatientDetails] Updated patient examinations:', updatedData.examination);
        setPatient({
          ...updatedData,
          examination: Array.isArray(updatedData.examination) ? updatedData.examination : [],
          prescription: Array.isArray(updatedData.prescription) ? updatedData.prescription : [],
        });
      } else {
        throw new Error('Failed to refresh patient data');
      }
    } catch (err: any) {
      console.error('💥 [PatientDetails] Error submitting examination:', err);
      setError(err.message);
    }
  }, [patient, id]);

  const handlePrescribe = useCallback(async (formData: { medicines: string; recommendations: string }) => {
    if (!patient) {
      setError('No patient selected');
      return;
    }
    try {
      const response = await fetch(`/api/prescribe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientId: patient.id,
          medicines: formData.medicines,
          recommendations: formData.recommendations,
        }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to save prescription: HTTP ${response.status}`);
      }
      console.log('✅ [PatientDetails] Prescription saved');
      setSuccessMessage('Prescription saved successfully');
      router.push('/doctor');
    } catch (err: any) {
      console.error('💥 [PatientDetails] Error submitting prescription:', err);
      setError(err.message);
    }
  }, [patient, router]);

  const handleBackToDashboard = useCallback(() => {
    setBackLoading(true);
    router.push('/doctor');
  }, [router]);

  const handleCloseSnackbar = useCallback(() => {
    setSuccessMessage(null);
    setError(null);
  }, []);

  if (status === 'loading' || loading) return <CircularProgress />;
  if (error && !successMessage) return <Alert severity="error">{error}</Alert>;
  if (!patient) return <Alert severity="error">Patient not found</Alert>;

  return (
    <Container maxWidth="md" sx={{ mt: 4, bgcolor: '#f8f9ff', p: 3, borderRadius: 2, paddingTop: 10 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <Button
          variant="outlined"
          startIcon={backLoading ? <CircularProgress size={20} sx={{ color: '#1a237e' }} /> : <ArrowBackIcon />}
          onClick={handleBackToDashboard}
          disabled={backLoading}
          sx={{
            color: '#1a237e',
            borderColor: '#1a237e',
            '&:hover': {
              borderColor: '#283593',
              backgroundColor: 'rgba(40, 53, 147, 0.08)',
            },
            mr: 2,
          }}
        >
          Back to Dashboard
        </Button>
        <Typography variant="h4" sx={{ fontWeight: 600, color: '#1a237e' }}>
          Patient: {patient.name}
        </Typography>
      </Box>
      <Typography variant="body1" sx={{ color: '#666', mb: 4 }}>
        Visit Status: {patient.visitStatus.replace(/_/g, ' ')}
      </Typography>
      <ExaminationSection
        patientName={patient.name}
        patientId={patient.id}
        vitals={patient.vitals}
        services={services}
        examinations={patient.examination || []}
        prescriptions={patient.prescription || []}
        onExamine={handleExamine}
        onPrescribe={handlePrescribe}
      />
      <Snackbar
        open={!!successMessage || !!error}
        autoHideDuration={3000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={successMessage ? 'success' : 'error'}
          sx={{ width: '100%' }}
        >
          {successMessage || error}
        </Alert>
      </Snackbar>
    </Container>
  );
}
