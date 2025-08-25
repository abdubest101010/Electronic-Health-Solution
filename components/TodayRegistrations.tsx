// components/Receptionist/TodayRegistrations.tsx
import { useEffect, useState } from 'react';

// Define the correct shape of data returned by /api/todays-registered
interface AppointmentData {
  id: number;           // Appointment.id
  name: string;         // Patient.name
  patientId: number;
  visitStatus: string;
  labOrderCount: number;
  hasPendingLab: boolean;
  createdAt: string | Date;
}

export default function TodayRegistrations() {
  const [appointments, setAppointments] = useState<AppointmentData[]>([]);

  useEffect(() => {
    const fetchTodayRegistered = async () => {
      try {
        const res = await fetch('/api/todays-registered');
        if (res.ok) {
          const data = await res.json();
          setAppointments(data); // Now it's a list of appointment-focused objects
        }
      } catch (err) {
        console.error('Failed to load today registered patients:', err);
      }
    };
    fetchTodayRegistered();
  }, []);

  return (
    <section>
      <h2 className="text-xl mb-3">Today's New Registrations</h2>
      {appointments.length === 0 ? (
        <p className="text-gray-500">No walk-ins today.</p>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {appointments.map((app) => (
            <div key={app.id} className="border p-3 rounded bg-gray-50">
              <p className="font-medium">{app.name}</p>
              <p className="text-sm text-gray-600">Status: {app.visitStatus}</p>

              {/* Show "Mark Paid for Lab" button only if lab is ordered but not paid */}
              {app.visitStatus === 'LAB_ORDERED' && (
                <button
                  onClick={async (e) => {
                    e.stopPropagation();
                    if (!window.confirm('Mark lab as paid?')) return;

                    const res = await fetch('/api/lab-orders/pay', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ appointmentId: app.id }),
                    });

                    if (res.ok) {
                      alert('Marked as paid!');
                      location.reload(); // Refresh to update UI
                    } else {
                      alert('Failed to mark as paid.');
                    }
                  }}
                  className="w-full mt-2 bg-green-600 text-white text-sm p-1 rounded hover:bg-green-700"
                >
                  Mark Paid for Lab
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}