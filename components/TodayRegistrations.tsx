// components/Receptionist/TodayRegistrations.tsx
import { useEffect, useState } from 'react';

interface LabOrder { id: string }
interface Appointment { id: string; visitStatus: string; labOrders: LabOrder[] }
interface Patient {
  id: number;
  name: string;
  appointments: Appointment[];
}

export default function TodayRegistrations() {
  const [patients, setPatients] = useState<Patient[]>([]);

  useEffect(() => {
    const fetchTodayRegistered = async () => {
      try {
        const res = await fetch('/api/todays-registered');
        if (res.ok) setPatients(await res.json());
      } catch (err) {
        console.error('Failed to load today registered patients');
      }
    };
    fetchTodayRegistered();
  }, []);

  return (
    <section>
      <h2 className="text-xl mb-3">Today's New Registrations</h2>
      {patients.length === 0 ? (
        <p className="text-gray-500">No walk-ins today.</p>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {patients.map((patient) => {
            const app = patient.appointments[0];
            return (
              <div key={patient.id} className="border p-3 rounded bg-gray-50">
                <p className="font-medium">{patient.name}</p>
                {app?.labOrders.length > 0 && app.visitStatus === 'LAB_ORDERED' && (
                  <button
                    onClick={async (e) => {
                      e.stopPropagation();
                      if (!window.confirm('Mark lab as paid?')) return;
                      await fetch('/api/lab-orders/pay', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ appointmentId: app.id }),
                      });
                      alert('Marked as paid!');
                      location.reload();
                    }}
                    className="w-full mt-2 bg-green-600 text-white text-sm p-1 rounded hover:bg-green-700"
                  >
                    Mark Paid for Lab
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}