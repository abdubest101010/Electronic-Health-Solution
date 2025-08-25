// app/doctor/page.tsx
'use client';

import { useEffect, useState } from 'react';
import ProtectedLayout from '@/components/ProtectedLayout';
import CreateAppointmentForm from '@/components/CreateAppointmentForm';
import LabAssign from '@/components/LabAssign';
import PatientList from '@/components/PatientList';
import ExaminationSection from '@/components/ExaminationSection';
import { AssignedPatient, LabService } from '@/types/appointment';

export default function DoctorDashboard() {
  const [appointments, setAppointments] = useState<AssignedPatient[]>([]);
  const [selectedAppointment, setSelectedAppointment] = useState<AssignedPatient | null>(null);
  const [formData, setFormData] = useState({
    complaints: '',
    diagnosis: '',
    visitDetails: '',
    medicines: '',
    recommendations: '',
  });
  const [services, setServices] = useState<LabService[]>([]);

  // Fetch data
  useEffect(() => {
    const load = async () => {
      try {
        const [patientsRes, servicesRes] = await Promise.all([
          fetch('/api/todays-assigned-patients'),
          fetch('/api/lab-services'),
        ]);

        if (!patientsRes.ok) throw new Error('Failed to load patients');
        if (!servicesRes.ok) throw new Error('Failed to load services');

        const patientsData: AssignedPatient[] = await patientsRes.json();
        const servicesData: LabService[] = await servicesRes.json();

        setAppointments(patientsData);
        setServices(servicesData);
      } catch (err) {
        console.error('Load error:', err);
        alert('Failed to load data');
      }
    };

    load();
  }, []);

  const handlePatientClick = (app: AssignedPatient) => {
    setSelectedAppointment(app);
    setFormData({
      complaints: '',
      diagnosis: '',
      visitDetails: '',
      medicines: '',
      recommendations: '',
    });
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleExamine = async () => {
    if (!selectedAppointment) return;

    try {
      const res = await fetch('/api/appointments/examine', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          appointmentId: selectedAppointment.id,
          ...formData,
        }),
      });

      if (res.ok) {
        alert('Examination saved!');
      } else {
        const error = await res.json();
        alert(`Error: ${error.message}`);
      }
    } catch (err) {
      alert('Network error');
    }
  };

  const handlePrescribe = async () => {
    if (!selectedAppointment) return;

    try {
      const res = await fetch('/api/appointments/prescribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          appointmentId: selectedAppointment.id,
          medicines: formData.medicines,
          recommendations: formData.recommendations,
        }),
      });

      if (res.ok) {
        alert('Prescription saved!');
        setAppointments((prev) => prev.filter((a) => a.id !== selectedAppointment.id));
        setSelectedAppointment(null);
      } else {
        const error = await res.json();
        alert(`Error: ${error.message}`);
      }
    } catch (err) {
      alert('Network error');
    }
  };

  return (
    <ProtectedLayout allowedRoles={['DOCTOR']}>
      <div className="p-4 max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-4">Doctor Dashboard</h1>

        <div className="mb-6 space-y-4">
          <CreateAppointmentForm />
          {selectedAppointment && (
            <LabAssign selectedAppointment={selectedAppointment} services={services} />
          )}
        </div>

        <PatientList appointments={appointments} onSelect={handlePatientClick} />

        {selectedAppointment && (
          <ExaminationSection
            formData={formData}
            onChange={handleChange}
            onExamine={handleExamine}
            onPrescribe={handlePrescribe}
            patientName={selectedAppointment.patient.name}
          />
        )}
      </div>
    </ProtectedLayout>
  );
}