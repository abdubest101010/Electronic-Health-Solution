// app/dashboard/receptionist/page.tsx
'use client';

import ProtectedLayout from '@/components/ProtectedLayout';
import TodayAppointments from '@/components/TodayAppointments';
import PatientDetailsModal from '@/components/PatientDetailsModal';
import TodayRegistrations from '@/components/TodayRegistrations';
import RegistrationForms from '@/components/RegistrationForms';
import PendingLabOrders from '@/components/PendindLabOrders';
import { useState } from 'react';
import { signOut, useSession } from 'next-auth/react';

export default function ReceptionistDashboard() {
  const [selectedPatientId, setSelectedPatientId] = useState<number | null>(null);
  const [selectedPatient, setSelectedPatient] = useState<any>(null);
  const { data: session, status } = useSession();

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
           {/* fetch user name from session */}
           {/* make a div for name and logout then display flex */}
           <div className="flex">
          <p className="text-gray-600">Welcome, {session?.user?.name || 'Receptionist'}!</p>
          {/* add logout button */}
          <button
                  onClick={() => signOut({ callbackUrl: "/" })}
                  className="mt-4 bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
                >
                  Logout
                </button>
        </div>
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