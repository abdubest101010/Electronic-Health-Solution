// app/laboratorist/page.tsx
'use client';

import { useEffect, useState } from 'react';
import ProtectedLayout from '@/components/ProtectedLayout';
import { signOut, useSession } from 'next-auth/react';

interface LabOrder {
  labOrderId: number;
  appointmentId: number;
  patientName: string;
  serviceName: string;
  doctorName: string;
  doctorId: string;
  paidAt: string;
}

export default function LaboratoristDashboard() {
  const [orders, setOrders] = useState<LabOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [resultInputs, setResultInputs] = useState<Record<number, string>>({});
  const [submitting, setSubmitting] = useState<number | null>(null);
  const {data:session, status} = useSession();
  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const res = await fetch('/api/todays-paid-lab-order');
        if (!res.ok) throw new Error('Failed to fetch orders');
         const data: LabOrder[] = await res.json();
        setOrders(data);
      } catch (err) {
        console.error(err);
        alert('Could not load lab orders.');
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

  const handleSubmitResult = async (labOrderId: number) => {
    const result = resultInputs[labOrderId];
    if (!result || !result.trim()) {
      alert('Please enter a result');
      return;
    }

    setSubmitting(labOrderId);

    try {
      const res = await fetch('/api/laboratorists/submit-result', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ labOrderId, result }),
      });

      const responseData = await res.json();

      if (res.ok) {
        alert('Lab result submitted!');
        setOrders((prev) => prev.filter((o) => o.labOrderId !== labOrderId));
        setResultInputs((prev) => {
          const next = { ...prev };
          delete next[labOrderId];
          return next;
        });
      } else {
        alert(`Error: ${responseData.error}`);
      }
    } catch (err) {
      alert('Network error');
    } finally {
      setSubmitting(null);
    }
  };

  if (loading) {
    return (
      <ProtectedLayout allowedRoles={['LABORATORIST']}>
        <p className="p-6">Loading paid lab orders...</p>
      </ProtectedLayout>
    );
  }

  return (
    <ProtectedLayout allowedRoles={['LABORATORIST']}>
      <div className="p-6 max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">🔬 Lab Workbench</h1>
        {/* fetch user name from session */}
        <p className="text-gray-600 mb-4">Welcome, {session?.user?.name || 'Laboratorist'}!</p>
        {/* add logout button */}     
        <button
          onClick={() => signOut({ callbackUrl: "/" })}
          className="mb-6 bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
        >
          Logout    
        </button>
        {orders.length === 0 ? (
          <p className="text-gray-500">No paid lab tests assigned to you today.</p>
        ) : (
          <div className="space-y-6">
            {orders.map((order) => (
              <div key={order.labOrderId} className="border rounded-lg p-5 bg-white shadow">
                <div className="flex justify-between">
                  <h3 className="text-lg font-semibold">{order.patientName}</h3>
                  <span className="text-sm text-gray-600">
                    {new Date(order.paidAt).toLocaleTimeString()}
                  </span>
                </div>

                <p><strong>Test:</strong> {order.serviceName}</p>
                <p><strong>Doctor:</strong> {order.doctorName}</p>

                <div className="mt-4">
                  <label className="block text-sm font-medium mb-1">Lab Result</label>
                  <textarea
                    value={resultInputs[order.labOrderId] || ''}
                    onChange={(e) =>
                      setResultInputs((prev) => ({
                        ...prev,
                        [order.labOrderId]: e.target.value,
                      }))
                    }
                    className="w-full p-2 border border-gray-300 rounded text-sm"
                    rows={5}
                    placeholder="Enter full result details..."
                  />
                </div>

                <button
                  onClick={() => handleSubmitResult(order.labOrderId)}
                  disabled={submitting === order.labOrderId}
                  className="mt-3 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-gray-400"
                >
                  {submitting === order.labOrderId ? 'Submitting...' : 'Submit Result'}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </ProtectedLayout>
  );
}