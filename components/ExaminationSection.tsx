// components/doctor/ExaminationSection.tsx
'use client';

import { useState } from 'react';

interface Props {
  formData: {
    complaints: string;
    diagnosis: string;
    visitDetails: string;
    medicines: string;
    recommendations: string;
  };
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement>) => void;
  onExamine: () => Promise<void> | void;
  onPrescribe: () => Promise<void> | void;
  patientName: string;
}

export default function ExaminationSection({
  formData,
  onChange,
  onExamine,
  onPrescribe,
  patientName,
}: Props) {
  const [examLoading, setExamLoading] = useState(false);
  const [prescribeLoading, setPrescribeLoading] = useState(false);

  const handleExamine = async () => {
    setExamLoading(true);
    await onExamine();
    setExamLoading(false);
  };

  const handlePrescribe = async () => {
    setPrescribeLoading(true);
    await onPrescribe();
    setPrescribeLoading(false);
  };

  return (
    <div className="mt-6 bg-white p-6 border rounded shadow">
      <h3 className="text-lg font-semibold mb-4">Examination for: {patientName}</h3>

      {/* Current Visit */}
      <form className="space-y-4">
        <h4 className="text-md font-medium border-b pb-1">
          Current Visit: Health History & Condition
        </h4>

        <textarea
          name="complaints"
          placeholder="Presenting complaints"
          value={formData.complaints}
          onChange={onChange}
          className="w-full border p-2 rounded resize-none"
          rows={3}
        />
        <textarea
          name="diagnosis"
          placeholder="Diagnosis / Condition"
          value={formData.diagnosis}
          onChange={onChange}
          className="w-full border p-2 rounded resize-none"
          rows={3}
        />
        <button
          type="button"
          onClick={handleExamine}
          disabled={examLoading}
          className={`px-4 py-2 rounded text-white transition ${
            examLoading
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700'
          }`}
        >
          {examLoading ? 'Saving...' : 'Save Examination'}
        </button>
      </form>

      {/* Prescription */}
      <form className="space-y-4 mt-8 pt-6 border-t">
        <h4 className="text-md font-medium">Prescription</h4>
        <textarea
          name="medicines"
          placeholder="List of medicines..."
          value={formData.medicines}
          onChange={onChange}
          className="w-full border p-2 rounded resize-none"
          rows={3}
        />
        <textarea
          name="recommendations"
          placeholder="Lifestyle advice, diet, rest, etc."
          value={formData.recommendations}
          onChange={onChange}
          className="w-full border p-2 rounded resize-none"
          rows={3}
        />
        <button
          type="button"
          onClick={handlePrescribe}
          disabled={prescribeLoading}
          className={`px-4 py-2 rounded text-white transition ${
            prescribeLoading
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-green-600 hover:bg-green-700'
          }`}
        >
          {prescribeLoading ? 'Saving...' : 'Save Prescription & Complete Visit'}
        </button>
      </form>
    </div>
  );
}
