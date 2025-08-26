// components/PatientList.tsx
'use client';

import { AssignedPatient } from '@/types/appointment';

interface Props {
  appointments: AssignedPatient[];
  onSelect: (app: AssignedPatient) => void;
}

const statusConfig = {
  ASSIGNED_TO_DOCTOR: { label: 'To Examine', color: 'bg-gray-100 text-gray-800' },
  LAB_ORDERED: { label: 'Lab Ordered', color: 'bg-yellow-100 text-yellow-800' },
  ASSIGNED_TO_LAB: { label: 'Lab Assigned', color: 'bg-blue-100 text-blue-800' },
  PAID_FOR_LAB: { label: 'Paid', color: 'bg-green-100 text-green-800' },
  LAB_COMPLETED: { label: 'Lab Ready ✅', color: 'bg-purple-100 text-purple-800' },
  EXAMINED: { label: 'Examined', color: 'bg-indigo-100 text-indigo-800' },
};

export default function PatientList({ appointments, onSelect }: Props) {
  if (appointments.length === 0) {
    return <p className="text-gray-500">No patients assigned for today.</p>;
  }

  return (
    <div className="mb-6">
      <h2 className="text-xl mb-4">Today's Assigned Patients</h2>
      <ul className="space-y-2">
        {appointments.map((app) => {
          const status = statusConfig[app.visitStatus as keyof typeof statusConfig] || {
            label: 'Unknown',
            color: 'bg-red-100 text-red-800',
          };

          return (
            <li
              key={app.id}
              onClick={() => onSelect(app)}
              className="cursor-pointer p-3 border rounded hover:bg-gray-50 transition"
            >
              <div className="flex justify-between items-start">
                <strong>{app.patient.name}</strong>
                <div className="flex items-center gap-2">
                  <span
                    className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${status.color}`}
                  >
                    {status.label}
                  </span>
                  {app.examination && (
                    <span className="text-xs text-blue-700" title="Previously examined">
                      ✏️
                    </span>
                  )}
                  {/* ✅ Show "Lab Result Ready" badge */}
                  {app.visitStatus === 'LAB_COMPLETED' && (
                    <span className="text-xs text-green-700 font-medium" title="Lab results are ready">
                      ✅
                    </span>
                  )}
                </div>
              </div>

              <div className="text-sm text-gray-700 mt-1">
                {app.vitals.weight !== null && (
                  <span>Weight: {app.vitals.weight.toFixed(1)} kg | </span>
                )}
                {app.vitals.bpSystolic !== null && app.vitals.bpDiastolic !== null ? (
                  <span>
                    BP: {app.vitals.bpSystolic}/{app.vitals.bpDiastolic} mmHg
                  </span>
                ) : (
                  <span>BP: –/– mmHg</span>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}