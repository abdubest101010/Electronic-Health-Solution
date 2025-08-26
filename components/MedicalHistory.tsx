// components/MedicalHistory.tsx
'use client';

import { useEffect, useState } from 'react';

export default function MedicalHistory({ patientId }: { patientId: number }) {
  const [history, setHistory] = useState<string | null>(null);
  const [inputValue, setInputValue] = useState('');
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);

  // Fetch history
  useEffect(() => {
    if (!patientId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    const fetchHistory = async () => {
      try {
        const res = await fetch(`/api/patients/medical-history/${patientId}`);
        if (!res.ok) throw new Error('Failed to fetch');
        const data = await res.json();
        const saved = typeof data.history === 'string' ? data.history : '';
        setHistory(saved);
        setInputValue(saved);
      } catch (err) {
        console.error('Fetch error:', err);
        setHistory('Failed to load history.');
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [patientId]);

  const startEditing = () => {
    setInputValue(history || '');
    setEditing(true);
  };

  const cancelEdit = () => {
    setEditing(false);
  };

  const saveHistory = async () => {
    if (!patientId) {
      alert('No patient selected');
      return;
    }

    try {
      const res = await fetch(`/api/patients/medical-history/${patientId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ history: inputValue }),
      });

      if (res.ok) {
        setHistory(inputValue);
        setEditing(false);
      } else {
        const error = await res.json();
        alert(`Save failed: ${error.error}`);
      }
    } catch (err) {
      alert('Network error');
    }
  };

  if (loading) {
    return (
      <div className="mt-6 p-5 border rounded-lg bg-white shadow-sm">
        <h3 className="text-lg font-semibold mb-4">Patient History</h3>
        <p className="text-sm text-gray-500">Loading...</p>
      </div>
    );
  }

  if (!patientId) {
    return (
      <div className="mt-6 p-5 border rounded-lg bg-white shadow-sm">
        <h3 className="text-lg font-semibold mb-4">Patient History</h3>
        <p className="text-sm text-gray-500">No patient selected.</p>
      </div>
    );
  }

  return (
    <div className="mt-6 p-5 border rounded-lg bg-white shadow-sm">
      <h3 className="text-lg font-semibold mb-4">Patient History</h3>

      {editing ? (
        <div className="space-y-4">
          <textarea
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            className="w-full p-2 border rounded text-sm"
            rows={4}
            placeholder="Enter patient history: Diabetic, Allergic to penicillin, etc."
          />
          <div className="flex gap-2">
            <button
              onClick={saveHistory}
              className="px-4 py-2 bg-blue-600 text-white rounded text-sm"
            >
              Save
            </button>
            <button
              onClick={cancelEdit}
              className="px-4 py-2 bg-gray-400 text-white rounded text-sm"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div>
          {history ? (
            <p className="text-sm whitespace-pre-wrap">{history}</p>
          ) : (
            <p className="text-sm text-gray-500">No patient history recorded yet.</p>
          )}
          <button
            onClick={startEditing}
            className="mt-3 text-sm text-blue-600 hover:underline font-medium"
          >
            {history ? 'Edit History' : 'Add History'}
          </button>
        </div>
      )}
    </div>
  );
}