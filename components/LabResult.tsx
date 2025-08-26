// components/doctor/LabResults.tsx
'use client';

import { useEffect, useState } from 'react';

interface LabResult {
  labOrderId: number;
  serviceName: string;
  result: string | null;
  laboratoristName: string;
  completedAt: string;
}

export default function LabResults({ appointmentId }: { appointmentId: number | null }) {
  const [results, setResults] = useState<LabResult[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    if (!appointmentId) {
      setResults([]);
      setLoading(false);
      return;
    }

    const fetchResults = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/lab-result?appointmentId=${appointmentId}`);
        if (!res.ok) throw new Error('Failed to fetch lab results');
        const data: LabResult[] = await res.json();
        setResults(data);
      } catch (err) {
        console.error('Error fetching lab results:', err);
        setResults([]);
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, [appointmentId]);

  if (!appointmentId) return null;
  if (loading) return <p className="text-sm text-gray-600">Loading lab results...</p>;

  return (
    <div className="mt-6 p-5 border rounded-lg bg-white shadow-sm">
      <h3 className="text-lg font-semibold mb-4 text-gray-800">🔬 Lab Results</h3>

      {results.length === 0 ? (
        <p className="text-gray-500 italic">No completed lab results yet.</p>
      ) : (
        <div className="space-y-4">
          {results.map((r) => (
            <div key={r.labOrderId} className="border rounded-md p-3 bg-gray-50">
              <div className="flex justify-between">
                <strong className="text-gray-800">{r.serviceName}</strong>
                <span className="text-xs text-gray-500">
                  {new Date(r.completedAt).toLocaleString()}
                </span>
              </div>
              <p className="text-sm mt-1">
                <span className="font-medium">By:</span> {r.laboratoristName}
              </p>
              <div className="mt-2 p-3 bg-white border rounded text-sm whitespace-pre-wrap">
                {r.result ? (
                  <pre className="whitespace-pre-wrap">{r.result}</pre>
                ) : (
                  <em className="text-gray-500">No result details provided.</em>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}