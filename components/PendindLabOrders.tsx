// app/receptionist/page.tsx
'use client';

import { useEffect, useState } from 'react';
import ProtectedLayout from '@/components/ProtectedLayout';

type LabPatient = {
  appointmentId: number;
  patientName: string;
  labTests: {
    labOrderId: number;
    serviceName: string;
    laboratoristName: string;
    status: string;
  }[];
  assignedAt: string;
};

export default function ReceptionistDashboard() {
  const [patients, setPatients] = useState<LabPatient[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPatients = async () => {
      try {
        const res = await fetch('/api/pending-lab-orders');
        if (!res.ok) throw new Error('Failed to load patients');
        const data: LabPatient[] = await res.json();
        setPatients(data);
      } catch (err) {
        console.error(err);
        alert('Could not load patients.');
      } finally {
        setLoading(false);
      }
    };

    fetchPatients();
  }, []);

  const markAsPaid = async (labOrderId: number) => {
    try {
      const res = await fetch('/api/mark-us-paid', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ labOrderId }),
      });

      const result = await res.json();

      if (res.ok) {
        alert('Payment recorded!');
        setPatients((prev) =>
          prev.map((p) => ({
            ...p,
            labTests: p.labTests.map((test) =>
              test.labOrderId === labOrderId
                ? { ...test, status: 'PAID' }
                : test
            ),
          }))
        );
      } else {
        alert(`Error: ${result.error}`);
      }
    } catch (err) {
      alert('Network error');
    }
  };

  if (loading) {
    return (
      <ProtectedLayout allowedRoles={['RECEPTIONIST']}>
        <p>Loading patients...</p>
      </ProtectedLayout>
    );
  }

  return (
    <ProtectedLayout allowedRoles={['RECEPTIONIST']}>
      <div className="p-6 max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Today's Lab Patients</h1>

        {patients.length === 0 ? (
          <p className="text-gray-500">No patients assigned to lab today.</p>
        ) : (
          <div className="space-y-6">
            {patients.map((p) => (
              <div key={p.appointmentId} className="border rounded-lg p-4 bg-white shadow">
                <h3 className="text-lg font-semibold">{p.patientName}</h3>
                <p className="text-sm text-gray-600">
                  Assigned at: {new Date(p.assignedAt).toLocaleTimeString()}
                </p>

                <div className="mt-3">
                  <h4 className="font-medium">Lab Tests:</h4>
                  <ul className="space-y-2 mt-2">
                    {p.labTests.map((test) => (
                      <li
                        key={test.labOrderId}
                        className="flex justify-between items-center p-2 border rounded"
                      >
                        <span>{test.serviceName}</span>
                        <span className="text-sm text-gray-600 mr-4">
                          {test.laboratoristName}
                        </span>
                        {test.status === 'PAID' ? (
                          <span className="text-green-600 text-sm font-medium">Paid</span>
                        ) : (
                          <button
                            onClick={() => markAsPaid(test.labOrderId)}
                            className="text-sm bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700"
                          >
                            Mark as Paid
                          </button>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </ProtectedLayout>
  );
}