// app/dashboard/receptionist/page.tsx
'use client';

import ProtectedLayout from '@/components/ProtectedLayout';
import TodayAppointments from '@/components/TodayAppointments';
import PatientDetailsModal from '@/components/PatientDetailsModal';
import TodayRegistrations from '@/components/TodayRegistrations';
import RegistrationForms from '@/components/RegistrationForms';
import PendingLabOrders from '@/components/PendindLabOrders';
import { useState } from 'react';

export default function ReceptionistDashboard() {
  const [selectedPatientId, setSelectedPatientId] = useState<number | null>(null);
  const [selectedPatient, setSelectedPatient] = useState<any>(null);

  const handlePatientClick = async (patientId: number) => {
    setSelectedPatientId(patientId);
    try {
      const res = await fetch(`/api/patient-details/${patientId}`);
      if (res.ok) {
        const data = await res.json();
        setSelectedPatient(data);
      }
    } catch (err) {
      alert('Failed to load patient details');
    }
  };

  return (
    <ProtectedLayout allowedRoles={['RECEPTIONIST']}>
      <div className="p-4 grid grid-cols-2 gap-6">
        <div className="space-y-6">
          <h1 className="text-2xl font-bold">Receptionist Dashboard</h1>

          <TodayAppointments onPatientClick={handlePatientClick} />
          <PatientDetailsModal patient={selectedPatient} onClose={() => setSelectedPatient(null)} />
          <TodayRegistrations />
          <PendingLabOrders />
        </div>

        <RegistrationForms />
      </div>
    </ProtectedLayout>
  );
}