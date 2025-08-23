'use client';

import ProtectedLayout from '@/components/ProtectedLayout';
import { useEffect, useState } from 'react';

// Define TypeScript interfaces
interface Patient {
  id: string;
  name: string;
}

interface Service {
  id: string;
  name: string;
}

interface Appointment {
  id: string;
  patient: Patient;
}

interface LabOrder {
  id: string;
  service: Service;
  appointment: Appointment;
  visitStatus?: string; // e.g., 'LAB_PENDING', 'LAB_COMPLETED'
}

export default function LaboratoristDashboard() {
  const [labOrders, setLabOrders] = useState<LabOrder[]>([]);
  const [selectedLabOrder, setSelectedLabOrder] = useState<LabOrder | null>(null);
  const [result, setResult] = useState<string>('');

  useEffect(() => {
    const fetchLabOrders = async () => {
      try {
        const res = await fetch('/api/todays-paid-lab-patients');
        if (!res.ok) throw new Error('Failed to fetch lab orders');
        const data = await res.json();
        setLabOrders(data);
      } catch (error) {
        console.error('Error fetching lab orders:', error);
        alert('Could not load patients.');
      }
    };

    fetchLabOrders();
  }, []);

  const handlePatientClick = (order: LabOrder) => {
    setSelectedLabOrder(order);
    setResult(''); // Reset result field when selecting a new patient
  };

  const handleSubmitResult = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedLabOrder) return;

    try {
      const res = await fetch('/api/lab-orders/result', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          labOrderId: selectedLabOrder.id,
          result,
        }),
      });

      if (res.ok) {
        alert('Lab result submitted successfully.');
        // Optionally: update local state or refetch
        setLabOrders((prev) =>
          prev.filter((order) => order.id !== selectedLabOrder.id)
        );
        setSelectedLabOrder(null);
        setResult('');
      } else {
        const errorData = await res.json();
        alert(`Error: ${errorData.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Submission error:', error);
      alert('Failed to submit result.');
    }
  };

  return (
    <ProtectedLayout allowedRoles={['LABORATORIST']}>
      <div className="p-4">
        <h1 className="text-2xl font-bold mb-4">Laboratorist Dashboard</h1>
        <h2 className="text-xl mb-4">Today's Paid Lab Patients</h2>

        {labOrders.length === 0 ? (
          <p>No lab patients for today.</p>
        ) : (
          <ul className="space-y-2 mb-6">
            {labOrders.map((order) => (
              <li
                key={order.id}
                onClick={() => handlePatientClick(order)}
                className="cursor-pointer p-2 border rounded hover:bg-gray-50"
              >
                <strong>{order.appointment.patient.name}</strong> - {order.service.name}
              </li>
            ))}
          </ul>
        )}

        {selectedLabOrder && (
          <div className="mt-6 p-4 border rounded bg-white shadow">
            <h3 className="text-lg font-semibold">
              {selectedLabOrder.appointment.patient.name}'s Lab Test: {selectedLabOrder.service.name}
            </h3>
            <form onSubmit={handleSubmitResult} className="space-y-4 mt-4">
              <textarea
                value={result}
                onChange={(e) => setResult(e.target.value)}
                placeholder="Enter lab result here..."
                className="w-full border p-2 rounded resize-none"
                rows={6}
              />
              <button
                type="submit"
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
              >
                Submit Result
              </button>
            </form>
          </div>
        )}
      </div>
    </ProtectedLayout>
  );
}