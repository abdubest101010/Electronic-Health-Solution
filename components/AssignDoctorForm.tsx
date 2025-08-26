import { useEffect, useState } from "react";

export default function AssignDoctorForm() {
  const [formData, setFormData] = useState({ appointmentId: '', doctorId: '' });
  const [appointments, setAppointments] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchTodayRegistered = async () => {
      try {
        const res = await fetch('/api/todays-registered');
        if (res.ok) setAppointments(await res.json());
      } catch (err) {
        console.error('Failed to load today registered patients');
      }
    };
    fetchTodayRegistered();
  }, []);

  useEffect(() => {
    const fetchDoctor = async () => {
      try {
        const res = await fetch('/api/doctors');
        if (res.ok) setDoctors(await res.json());
      } catch (err) {
        console.error('Failed to load doctors');
      }
    };
    fetchDoctor();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const appointmentId = parseInt(formData.appointmentId);
    const doctorId = formData.doctorId;

    if (isNaN(appointmentId)) {
      alert("Please select a valid appointment.");
      return;
    }
    if (!doctorId) {
      alert("Please select a doctor.");
      return;
    }

    const payload = { appointmentId, doctorId };
    console.log("📤 Sending payload:", payload);

    try {
      setLoading(true);
      const res = await fetch("/api/appointments/assign-doctor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      console.log("📡 Response status:", res.status);
      console.log("📦 Response data:", data);

      if (res.ok) {
        alert("Doctor assigned successfully!");
        setFormData({ appointmentId: '', doctorId: '' }); // reset form
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (err) {
      console.error("🚨 Request failed:", err);
      alert("Network error. Check console for details.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-2 mt-4">
      <h2 className="font-semibold text-lg">Assign Doctor</h2>

      <select
        name="appointmentId"
        onChange={handleChange}
        value={formData.appointmentId}
        required
        className="border p-1 block w-full rounded"
      >
        <option value="">Select Patient</option>
        {appointments.map((app: any) => (
          <option key={app.id} value={app.id}>
            {app.name} - Appointment {app.id}
          </option>
        ))}
      </select>

      <select
        name="doctorId"
        onChange={handleChange}
        value={formData.doctorId}
        required
        className="border p-1 block w-full rounded"
      >
        <option value="">Select Doctor</option>
        {doctors.map((doc: any) => (
          <option key={doc.id} value={doc.id}>
            {doc.name}
          </option>
        ))}
      </select>

      <button
        type="submit"
        disabled={loading}
        className={`w-full p-2 rounded text-white transition ${
          loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-500 hover:bg-blue-600'
        }`}
      >
        {loading ? 'Assigning...' : 'Assign'}
      </button>
    </form>
  );
}
