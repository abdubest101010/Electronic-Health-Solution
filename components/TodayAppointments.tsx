// components/Receptionist/TodayAppointments.tsx
import { useEffect, useState } from 'react';

interface Appointment {
  id: number;
  patient: {
    id: number;
    name: string;
  };
  visitStatus: string;
}

interface Props {
  onPatientClick: (patientId: number) => void;
}

export default function TodayAppointments({ onPatientClick }: Props) {
  const [appointments, setAppointments] = useState<Appointment[]>([]);

  useEffect(() => {
    const fetchAppointments = async () => {
      try {
        const res = await fetch('/api/todays-appointments');
        if (res.ok) {
          const data = await res.json();
          setAppointments(data);
        }
      } catch {
        console.error('Failed to load appointments');
      }
    };
    fetchAppointments();
  }, []);

  return (
    <section>
      <h2 className="text-xl mb-3">Today's Appointments</h2>
      {appointments.length === 0 ? (
        <p className="text-gray-500">No scheduled appointments.</p>
      ) : (
        <ul className="space-y-2">
          {appointments.map((app) => (
            <li
              key={app.id}
              onClick={() => onPatientClick(app.patient.id)}
              className="cursor-pointer p-3 border rounded hover:bg-gray-50"
            >
              <strong>{app.patient.name}</strong>{' '}
              <span className="text-sm text-gray-600">({app.visitStatus})</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}