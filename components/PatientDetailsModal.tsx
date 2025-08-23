// components/Receptionist/PatientDetailsModal.tsx
import { useState } from 'react';

interface Patient {
  id: number;
  name: string;
  phone: string | null;
  address: string | null;
  gender: string | null;
}

interface Props {
  patient: Patient | null;
  onClose: () => void;
}

export default function PatientDetailsModal({ patient, onClose }: Props) {
  const [vitals, setVitals] = useState({
    weight: '',
    bpSystolic: '',
    bpDiastolic: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setVitals({ ...vitals, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vitals.weight || !vitals.bpSystolic || !vitals.bpDiastolic) {
      alert('Please fill all fields');
      return;
    }

    try {
      const res = await fetch('/api/appointments/update-vitals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          appointmentId: patient?.id,
          weight: parseFloat(vitals.weight),
          bpSystolic: parseInt(vitals.bpSystolic, 10),
          bpDiastolic: parseInt(vitals.bpDiastolic, 10),
        }),
      });

      if (res.ok) {
        alert('Vitals updated!');
        onClose();
      } else {
        alert('Update failed');
      }
    } catch (err) {
      alert('Network error');
    }
  };

  if (!patient) return null;

  return (
    <div className="mt-6 p-4 bg-white border rounded shadow">
      <h3 className="text-lg font-semibold">Patient: {patient.name}</h3>
      <ul className="space-y-1 text-sm text-gray-700">
        <li><strong>Phone:</strong> {patient.phone || 'N/A'}</li>
        <li><strong>Address:</strong> {patient.address || 'N/A'}</li>
        <li><strong>Gender:</strong> {patient.gender || 'N/A'}</li>
      </ul>

      <form onSubmit={handleSubmit} className="mt-4 space-y-3">
        <h4 className="font-medium">Update Vitals</h4>
        <input
          name="weight"
          type="number"
          step="0.1"
          placeholder="Weight (kg)"
          value={vitals.weight}
          onChange={handleChange}
          className="w-full border p-2 rounded"
        />
        <div className="grid grid-cols-2 gap-2">
          <input
            name="bpSystolic"
            type="number"
            placeholder="BP Systolic"
            value={vitals.bpSystolic}
            onChange={handleChange}
            className="border p-2 rounded"
          />
          <input
            name="bpDiastolic"
            type="number"
            placeholder="BP Diastolic"
            value={vitals.bpDiastolic}
            onChange={handleChange}
            className="border p-2 rounded"
          />
        </div>
        <button
          type="submit"
          className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700"
        >
          Update Vitals
        </button>
      </form>
    </div>
  );
}