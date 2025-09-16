'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Container, Typography, CircularProgress, Alert } from '@mui/material';
import ExaminationSection from '@/components/ExaminationSection';
import LabResults from '@/components/LabResult';

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
  examination?: {
    complaints?: string | null;
    diagnosis?: string | null;
    visitDetails?: string | null;
  } | null;
  prescription?: {
    medicines?: string | null;
    recommendations?: string | null;
  } | null;
}

interface LabService {
  id: number;
  name: string;
}

export default function PatientDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { id } = React.use(params);
  const [patient, setPatient] = useState<Patient | null>(null);
  const [services, setServices] = useState<LabService[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    complaints: '',
    diagnosis: '',
    visitDetails: '',
    medicines: '',
    recommendations: '',
  });

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
        setPatient(data);
        setFormData({
          complaints: data.examination?.complaints || '',
          diagnosis: data.examination?.diagnosis || '',
          visitDetails: data.examination?.visitDetails || '',
          medicines: data.prescription?.medicines || '',
          recommendations: data.prescription?.recommendations || '',
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

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleExamine = async () => {
    if (!patient) {
      setError('No patient selected');
      return;
    }
    try {
      const response = await fetch(`/api/appointments/examine`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientId: patient.id,
          complaints: formData.complaints,
          diagnosis: formData.diagnosis,
          visitDetails: formData.visitDetails,
        }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || `Failed to save examination: HTTP ${response.status}`);
      }
      console.log('✅ [PatientDetails] Examination saved');
      alert('Examination saved!');
      // Refetch patient to update examination data
      const updatedResponse = await fetch(`/api/patients/${id}`);
      if (updatedResponse.ok) {
        const updatedData = await updatedResponse.json();
        setPatient(updatedData);
        setFormData({
          complaints: updatedData.examination?.complaints || '',
          diagnosis: updatedData.examination?.diagnosis || '',
          visitDetails: updatedData.examination?.visitDetails || '',
          medicines: updatedData.prescription?.medicines || '',
          recommendations: updatedData.prescription?.recommendations || '',
        });
      }
    } catch (err: any) {
      console.error('💥 [PatientDetails] Error submitting examination:', err);
      setError(err.message);
    }
  };

  const handlePrescribe = async () => {
    if (!patient) {
      setError('No patient selected');
      return;
    }
    try {
      const response = await fetch(`/api/appointments/prescribe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientId: patient.id,
          medicines: formData.medicines,
          recommendations: formData.recommendations,
        }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || `Failed to save prescription: HTTP ${response.status}`);
      }
      console.log('✅ [PatientDetails] Prescription saved');
      alert('Prescription saved!');
      router.push('/dashboard/doctor');
    } catch (err: any) {
      console.error('💥 [PatientDetails] Error submitting prescription:', err);
      setError(err.message);
    }
  };

  if (status === 'loading' || loading) return <CircularProgress />;
  if (error) return <Alert severity="error">{error}</Alert>;
  if (!patient) return <Alert severity="error">Patient not found</Alert>;

  return (
    <Container maxWidth="md" sx={{ mt: 4, bgcolor: '#f8f9ff', p: 3, borderRadius: 2 }}>
      <Typography variant="h4" sx={{ fontWeight: 600, color: '#1a237e', mb: 2 }}>
        Patient: {patient.name}
      </Typography>
      <Typography variant="body1" sx={{ color: '#666', mb: 4 }}>
        Visit Status: {patient.visitStatus.replace(/_/g, ' ')}
      </Typography>
      <ExaminationSection
        formData={formData}
        onChange={handleChange}
        onExamine={handleExamine}
        onPrescribe={handlePrescribe}
        patientName={patient.name}
        patientId={patient.id}
        vitals={patient.vitals}
        services={services}
      />
      <LabResults patientId={patient.id} />
    </Container>
  );
}