import { useEffect, useState } from "react";

export default function CreateAppointmentForm() {
  const [formData, setFormData] = useState({ patientId: "", dateTime: "" });
  const [patients, setPatients] = useState<any[]>([]);
  const [loadingPatients, setLoadingPatients] = useState(true); // loading state
  const [submitting, setSubmitting] = useState(false); // submitting state

  useEffect(() => {
    const fetchPatients = async () => {
      try {
        setLoadingPatients(true);
        const res = await fetch("/api/patients");
        const data = await res.json();
        setPatients(data);
      } catch (err) {
        console.error("❌ Failed to load patients:", err);
      } finally {
        setLoadingPatients(false);
      }
    };

    fetchPatients();
  }, []);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch("/api/appointments/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patientId: parseInt(formData.patientId),
          dateTime: formData.dateTime,
        }),
      });

      if (res.ok) {
        alert("✅ Appointment created!");
        setFormData({ patientId: "", dateTime: "" }); // reset form
      } else {
        alert("❌ Error creating appointment");
      }
    } catch (err) {
      console.error("🚨 Request failed:", err);
      alert("Network error. Check console for details.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <h2>Create Appointment (Optional for Future Visits)</h2>

      {loadingPatients ? (
        <p className="text-gray-500">⏳ Loading patients...</p>
      ) : (
        <select
          name="patientId"
          value={formData.patientId}
          onChange={handleChange}
          required
          className="border p-1 block"
        >
          <option value="">Select Patient</option>
          {patients.map((pat: any) => (
            <option key={pat.id} value={pat.id}>
              {pat.name}
            </option>
          ))}
        </select>
      )}

      <input
        name="dateTime"
        type="datetime-local"
        value={formData.dateTime}
        onChange={handleChange}
        required
        className="border p-1 block"
      />

      <button
        type="submit"
        disabled={submitting || loadingPatients}
        className="bg-blue-500 text-white p-2 disabled:opacity-50"
      >
        {submitting ? "Creating..." : "Create"}
      </button>
    </form>
  );
}
