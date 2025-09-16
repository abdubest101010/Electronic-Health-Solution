'use client';

import { useEffect, useState } from 'react';

interface Patient {
  id: number;
  name: string;
}

export default function CreateAppointmentForm({ patientId }: { patientId: number | null }) {
  const [formData, setFormData] = useState({ patientId: '', dateTime: '' });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null)
 

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      console.log('🔄 [CreateAppointmentForm] Submitting appointment:', formData);
      const res = await fetch('/api/appointments/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientId: (patientId),
          dateTime: formData.dateTime,
        }),
      });

      const responseData = await res.json();
      if (res.ok) {
        console.log('✅ [CreateAppointmentForm] Appointment created:', responseData);
        alert('✅ Appointment created!');
        setFormData({ patientId: '', dateTime: '' });
      } else {
        console.warn('❌ [CreateAppointmentForm] Error creating appointment:', responseData);
        alert(`❌ Error: ${responseData.error || 'Failed to create appointment'}`);
      }
    } catch (err: any) {
      console.error('💥 [CreateAppointmentForm] Network error:', err);
      setError('Network error. Check console for details.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow space-y-4">
      <h2 className="text-xl font-semibold text-gray-700">Create Appointment</h2>
      {error && (
        <div className="p-3 bg-red-100 text-red-700 border-l-4 border-red-500 rounded">
          {error}
        </div>
      )} 
      <div>
        <label className="block text-sm font-medium text-gray-600 mb-1">Date and Time</label>
        <input
          name="dateTime"
          type="datetime-local"
          value={formData.dateTime}
          onChange={handleChange}
          required
          className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>
      <button
        type="submit"
        disabled={submitting}
        className="w-full py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400 transition-colors flex items-center justify-center gap-2"
      >
        {submitting ? (
          <>
            <span className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></span>
            Creating...
          </>
        ) : (
          'Create Appointment'
        )}
      </button>
    </form>
  );
}