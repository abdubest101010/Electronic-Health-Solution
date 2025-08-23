import { useEffect, useState } from "react";

export default function CreateAppointmentForm() {
  const [formData, setFormData] = useState({ patientId: '', dateTime: '' });
  const [patients, setPatients] = useState([]);

  useEffect(() => {
    fetch('/api/patients').then(res => res.json()).then(setPatients);
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/appointments/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ patientId: parseInt(formData.patientId), dateTime: formData.dateTime }),
    });
    if (res.ok) {
      alert('Appointment created!');
    } else {
      alert('Error');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <h2>Create Appointment (Optional for Future Visits)</h2>
      <select name="patientId" onChange={handleChange} required className="border p-1 block">
        <option value="">Select Patient</option>
        {patients.map((pat: any) => (
          <option key={pat.id} value={pat.id}>{pat.name}</option>
        ))}
      </select>
      <input name="dateTime" type="datetime-local" onChange={handleChange} required className="border p-1 block" />
      <button type="submit" className="bg-blue-500 text-white p-2">Create</button>
    </form>
  );
}