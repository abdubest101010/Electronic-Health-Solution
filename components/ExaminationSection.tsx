// components/doctor/ExaminationSection.tsx
'use client';

interface Props {
  formData: {
    complaints: string;
    diagnosis: string;
    visitDetails: string;
    medicines: string;
    recommendations: string;
  };
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement>) => void;
  onExamine: () => void;
  onPrescribe: () => void;
  patientName: string;
}

export default function ExaminationSection({
  formData,
  onChange,
  onExamine,
  onPrescribe,
  patientName,
}: Props) {
  return (
    <div className="mt-6 bg-white p-6 border rounded shadow">
      <h3 className="text-lg font-semibold mb-4">Examination for: {patientName}</h3>

      <form className="space-y-4">
        <h4 className="text-md font-medium border-b pb-1">Health History & Condition</h4>
        <textarea
          name="visitDetails"
          placeholder="Patient history, vitals, observations..."
          value={formData.visitDetails}
          onChange={onChange}
          className="w-full border p-2 rounded resize-none"
          rows={3}
        />
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
          onClick={onExamine}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
        >
          Save Examination
        </button>
      </form>

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
          onClick={onPrescribe}
          className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition"
        >
          Save Prescription & Complete Visit
        </button>
      </form>
    </div>
  );
}