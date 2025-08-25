// components/doctor/PatientList.tsx
'use client';

import { AssignedPatient } from '@/types/appointment';

interface Props {
  appointments: AssignedPatient[];
  onSelect: (app: AssignedPatient) => void;
}

export default function PatientList({ appointments, onSelect }: Props) {
  if (appointments.length === 0) {
    return <p className="text-gray-500">No patients assigned for today.</p>;
  }

  return (
    <div className="mb-6">
      <h2 className="text-xl mb-4">Today's Assigned Patients</h2>
      <ul className="space-y-2">
        {appointments.map((app) => (
          <li
            key={app.id}
            onClick={() => onSelect(app)}
            className="cursor-pointer p-3 border rounded hover:bg-gray-50 transition"
          >
            <div className="flex justify-between">
              <strong>{app.patient.name}</strong>
              <span className="text-sm text-gray-600">({app.visitStatus})</span>
            </div>
            <div className="text-sm text-gray-700 mt-1">
              Weight: {app.vitals.weight?.toFixed(1) ?? '–'} kg | 
              BP: {app.vitals.bpSystolic ?? '–'}/{app.vitals.bpDiastolic ?? '–'} mmHg
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}