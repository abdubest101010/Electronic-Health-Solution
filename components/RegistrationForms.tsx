// components/Receptionist/RegistrationForms.tsx
import { useState } from 'react';
import RegisterPatientForm from "@/components/RegisterPatientForm";
import AssignDoctorForm from "@/components/AssignDoctorForm";
export default function RegistrationForms() {
  const [show, setShow] = useState(false);

  return (
    <div>
      <button
        onClick={() => setShow(!show)}
        className="w-full bg-blue-600 text-white p-3 rounded mb-6 hover:bg-blue-700"
      >
        {show ? 'Hide Registration' : 'Show Registration'}
      </button>

      {show && (
        <div className="space-y-6">
          <div className="p-4 border rounded bg-white shadow">
            <h3 className="text-lg font-medium mb-3">Register New Patient</h3>
            <RegisterPatientForm />
          </div>
        
        </div>
      )}
    <AssignDoctorForm />

    </div>
  );
}