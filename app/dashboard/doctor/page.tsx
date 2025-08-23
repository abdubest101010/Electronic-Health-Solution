'use client';

import CreateAppointmentForm from '@/components/CreateAppointmentForm';
import ProtectedLayout from '@/components/ProtectedLayout';
import { useEffect, useState } from 'react';

// === Define TypeScript Interfaces ===
interface Patient {
  id: string;
  name: string;
}

interface LabService {
  id: number; // or string depending on your backend
  name: string;
}

interface Appointment {
  id: string;
  patient: Patient;
  visitStatus: string;
  date: string;
}

interface DoctorFormData {
  complaints: string;
  diagnosis: string;
  visitDetails: string;
  labServiceIds: number[]; // assuming lab service IDs are numbers
  medicines: string;
  recommendations: string;
  nextAppointment: string; // ISO datetime string for datetime-local
}

export default function DoctorDashboard() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [formData, setFormData] = useState<DoctorFormData>({
    complaints: '',
    diagnosis: '',
    visitDetails: '',
    labServiceIds: [],
    medicines: '',
    recommendations: '',
    nextAppointment: '',
  });
  const [services, setServices] = useState<LabService[]>([]);

  // Fetch today's assigned patients and lab services
  useEffect(() => {
    const fetchPatients = async () => {
      try {
        const res = await fetch('/api/todays-assigned-patients');
        if (!res.ok) throw new Error('Failed to fetch patients');
        const data: Appointment[] = await res.json();
        setAppointments(data);
      } catch (error) {
        console.error('Error fetching patients:', error);
        alert('Could not load assigned patients.');
      }
    };

    const fetchServices = async () => {
      try {
        const res = await fetch('/api/lab-services');
        if (!res.ok) throw new Error('Failed to fetch lab services');
        const data: LabService[] = await res.json();
        setServices(data);
      } catch (error) {
        console.error('Error fetching lab services:', error);
      }
    };

    fetchPatients();
    fetchServices();
  }, []);

  const handlePatientClick = (app: Appointment) => {
    setSelectedAppointment(app);
    // Optionally reset form when switching patient
    setFormData({
      complaints: '',
      diagnosis: '',
      visitDetails: '',
      labServiceIds: [],
      medicines: '',
      recommendations: '',
      nextAppointment: '',
    });
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleMultiSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedOptions = Array.from(e.target.selectedOptions).map((o) => parseInt(o.value, 10));
    setFormData((prev) => ({ ...prev, labServiceIds: selectedOptions }));
  };

  const handleExamine = async () => {
    if (!selectedAppointment) return;

    try {
      const res = await fetch('/api/appointments/examine', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          appointmentId: selectedAppointment.id,
          ...formData,
        }),
      });

      if (res.ok) {
        alert('Examination saved! Patient sent to lab if tests were ordered.');
        // Optionally mark appointment as updated or refetch
      } else {
        const error = await res.json();
        alert(`Error saving examination: ${error.message || 'Unknown error'}`);
      }
    } catch (err) {
      console.error('Submission error:', err);
      alert('Failed to save examination.');
    }
  };

  const handlePrescribe = async () => {
    if (!selectedAppointment) return;

    try {
      const res = await fetch('/api/todays-assigned-patients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          appointmentId: selectedAppointment.id,
          medicines: formData.medicines,
          recommendations: formData.recommendations,
          nextAppointment: formData.nextAppointment || null,
        }),
      });

      if (res.ok) {
        alert('Prescription saved! Patient visit completed.');
        // Optionally remove from list or update status
        setAppointments((prev) => prev.filter((app) => app.id !== selectedAppointment.id));
        setSelectedAppointment(null);
      } else {
        const error = await res.json();
        alert(`Error saving prescription: ${error.message || 'Unknown error'}`);
      }
    } catch (err) {
      console.error('Prescription submission error:', err);
      alert('Failed to save prescription.');
    }
  };

  return (
    <ProtectedLayout allowedRoles={['DOCTOR']}>
      <div className="p-4 max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-4">Doctor Dashboard</h1>
        
        {/* Create New Appointment */}
        <div className="mb-6">
          <CreateAppointmentForm />
        </div>

        {/* Assigned Patients List */}
        <h2 className="text-xl mb-4">Today's Assigned Patients</h2>
        {appointments.length === 0 ? (
          <p className="text-gray-500">No patients assigned for today.</p>
        ) : (
          <ul className="space-y-2 mb-6">
            {appointments.map((app) => (
              <li
                key={app.id}
                onClick={() => handlePatientClick(app)}
                className="cursor-pointer p-3 border rounded hover:bg-gray-50 transition"
              >
                <strong>{app.patient.name}</strong>
                <span className="text-sm text-gray-600 ml-2">({app.visitStatus})</span>
              </li>
            ))}
          </ul>
        )}

        {/* Patient Details & Forms */}
        {selectedAppointment && (
          <div className="mt-6 bg-white p-6 border rounded shadow">
            <h3 className="text-lg font-semibold mb-4">
              Examination for: {selectedAppointment.patient.name}
            </h3>

            {/* Examination Form */}
            <form className="space-y-4">
              <h4 className="text-md font-medium border-b pb-1">Health History & Condition</h4>
              <textarea
                name="visitDetails"
                placeholder="Patient history, vitals, observations..."
                value={formData.visitDetails}
                onChange={handleChange}
                className="w-full border p-2 rounded resize-none"
                rows={3}
              />
              <textarea
                name="complaints"
                placeholder="Presenting complaints"
                value={formData.complaints}
                onChange={handleChange}
                className="w-full border p-2 rounded resize-none"
                rows={3}
              />
              <textarea
                name="diagnosis"
                placeholder="Diagnosis / Condition"
                value={formData.diagnosis}
                onChange={handleChange}
                className="w-full border p-2 rounded resize-none"
                rows={3}
              />

              {/* Lab Test Selection */}
              <div>
                <label className="block mb-1 font-medium">Lab Tests (Optional)</label>
                <select
                  multiple
                  name="labServiceIds"
                  value={formData.labServiceIds.map(String)} // convert to string for controlled component
                  onChange={handleMultiSelect}
                  className="w-full border p-2 rounded"
                >
                  {services.length === 0 ? (
                    <option disabled>No lab services available</option>
                  ) : (
                    services.map((serv) => (
                      <option key={serv.id} value={serv.id}>
                        {serv.name}
                      </option>
                    ))
                  )}
                </select>
                <p className="text-sm text-gray-500 mt-1">Hold Ctrl/Cmd to select multiple tests.</p>
              </div>

              <button
                type="button"
                onClick={handleExamine}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
              >
                Save Examination
              </button>
            </form>

            {/* Prescription Form */}
            <form className="space-y-4 mt-8 pt-6 border-t">
              <h4 className="text-md font-medium">Prescription (Optional)</h4>
              <textarea
                name="medicines"
                placeholder="List of medicines (e.g., Amoxicillin 500mg, 1-1-1 for 5 days)"
                value={formData.medicines}
                onChange={handleChange}
                className="w-full border p-2 rounded resize-none"
                rows={3}
              />
              <textarea
                name="recommendations"
                placeholder="Lifestyle advice, diet, rest, etc."
                value={formData.recommendations}
                onChange={handleChange}
                className="w-full border p-2 rounded resize-none"
                rows={3}
              />
              <div>
                <label htmlFor="nextAppointment" className="block mb-1">
                  Next Appointment (Optional)
                </label>
                <input
                  id="nextAppointment"
                  name="nextAppointment"
                  type="datetime-local"
                  value={formData.nextAppointment}
                  onChange={handleChange}
                  className="border p-2 rounded w-full"
                />
              </div>

              <button
                type="button"
                onClick={handlePrescribe}
                className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition"
              >
                Save Prescription & Complete Visit
              </button>
            </form>
          </div>
        )}
      </div>
    </ProtectedLayout>
  );
}