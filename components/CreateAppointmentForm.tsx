'use client';

import { useCallback, useEffect, useState } from 'react';

interface Patient {
  id: number;
  name: string;
}

export default function CreateAppointmentForm({ patientId }: { patientId: number }) {
  // ✅ Keep patientId as STRING in form data
  const [formData, setFormData] = useState({ patientId: '', dateTime: '' });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isUpdate, setIsUpdate] = useState(false);
  const [appointmentId, setAppointmentId] = useState<string | null>(null); // ✅ string ID

 // ✅ Wrap with useCallback + stable dependencies
 const checkAppointment = useCallback(async () => {
  try {
    const res = await fetch(`/api/appointments/check?patientId=${encodeURIComponent(patientId.toString())}`, {
      headers: { 'Content-Type': 'application/json' },
    });
    if (!res.ok) {
      throw new Error(`Failed to check appointment: HTTP ${res.status}`);
    }
    const { hasAppointment } = await res.json();
    if (hasAppointment) {
      const appointmentRes = await fetch(`/api/appointments/get?patientId=${encodeURIComponent(patientId.toString())}`, {
        headers: { 'Content-Type': 'application/json' },
      });
      if (appointmentRes.ok) {
        const appointmentData = await appointmentRes.json();
        setFormData({
          patientId: patientId.toString(),
          dateTime: appointmentData.dateTime ? new Date(appointmentData.dateTime).toISOString().slice(0, 16) : '',
        });
        setIsUpdate(true);
        setAppointmentId(appointmentData.id);
      }
    }
  } catch (err: any) {
    console.error('💥 [CreateAppointmentForm] Error checking appointment:', err);
    setError('Failed to check appointment status');
  }
}, [patientId]); // ✅ Only depends on patientId

// ✅ Now useEffect only runs when patientId changes
useEffect(() => {
  setFormData((prev) => ({ ...prev, patientId: patientId.toString() }));
  checkAppointment();
}, [patientId, checkAppointment]); // ✅ checkAppointment is now stable

  

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      console.log('🔄 [CreateAppointmentForm] Submitting appointment:', formData);
      
      const endpoint = isUpdate 
        ? `/api/appointments/update?id=${encodeURIComponent(appointmentId || '')}` 
        : '/api/appointments/create';

      const res = await fetch(endpoint, {
        method: isUpdate ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          // ✅ DO NOT parseInt — send as STRING
          patientId: formData.patientId, // ← This is already a string!
          dateTime: formData.dateTime,
        }),
      });

      const responseData = await res.json();
      if (res.ok) {
        console.log(`✅ [CreateAppointmentForm] Appointment ${isUpdate ? 'updated' : 'created'}:`, responseData);
        setFormData({ patientId: patientId.toString(), dateTime: '' });
        if (!isUpdate) {
          setIsUpdate(true);
          setAppointmentId(responseData.id);
        }
      } else {
        console.warn(`❌ [CreateAppointmentForm] Error ${isUpdate ? 'updating' : 'creating'} appointment:`, responseData);
      }
      // refresh the page to show the new appointment
      window.location.reload();
    } catch (err: any) {
      console.error('💥 [CreateAppointmentForm] Network error:', err);
      setError('Network error. Check console for details.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow space-y-4">
      <h2 className="text-xl font-semibold text-gray-700">{isUpdate ? 'Update Appointment' : 'Create Appointment'}</h2>
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
            {isUpdate ? 'Updating...' : 'Creating...'}
          </>
        ) : (
          isUpdate ? 'Update Appointment' : 'Create Appointment'
        )}
      </button>
    </form>
  );
}