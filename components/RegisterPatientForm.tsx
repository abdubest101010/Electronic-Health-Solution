'use client';

import { useState } from 'react';

export default function RegisterPatientForm() {
  const [formData, setFormData] = useState({
    name: '',
    gender: '',
    phone: '',
    address: '',
    weight: '',
    bpSystolic: '',
    bpDiastolic: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const patientData = {
      name: formData.name,
      gender: formData.gender,
      phone: formData.phone,
      address: formData.address,
    };

    const vitals = {
      weight: formData.weight ? parseFloat(formData.weight) : null,
      bpSystolic: formData.bpSystolic ? parseInt(formData.bpSystolic, 10) : null,
      bpDiastolic: formData.bpDiastolic ? parseInt(formData.bpDiastolic, 10) : null,
      measuredAt: new Date().toISOString(),
    };

    try {
      const res = await fetch('/api/patients/register-walkin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patient: patientData,
          vitals: vitals.weight || vitals.bpSystolic || vitals.bpDiastolic ? vitals : null,
        }),
      });

      if (res.ok) {
        alert('Patient registered as walk-in!');
        setFormData({
          name: '',
          gender: '',
          phone: '',
          address: '',
          weight: '',
          bpSystolic: '',
          bpDiastolic: '',
        });
      } else {
        const error = await res.json();
        alert(`Error: ${error.error}`);
      }
    } catch (err) {
      console.error('Registration failed:', err);
      alert('Network error');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <h3 className="font-medium text-lg">Register Walk-in Patient</h3>

      <input
        name="name"
        placeholder="Full Name"
        value={formData.name}
        onChange={handleChange}
        required
        className="w-full border p-2 rounded"
      />
      <input
        name="gender"
        placeholder="Gender"
        value={formData.gender}
        onChange={handleChange}
        className="w-full border p-2 rounded"
      />
      <input
        name="phone"
        placeholder="Phone"
        value={formData.phone}
        onChange={handleChange}
        className="w-full border p-2 rounded"
      />
      <input
        name="address"
        placeholder="Address"
        value={formData.address}
        onChange={handleChange}
        className="w-full border p-2 rounded"
      />

      <div className="mt-4">
        <h4 className="text-sm font-medium mb-2">Initial Vitals (Optional)</h4>
        <input
          name="weight"
          type="number"
          step="0.1"
          placeholder="Weight (kg)"
          value={formData.weight}
          onChange={handleChange}
          className="w-full border p-2 rounded mb-2"
        />
        <div className="grid grid-cols-2 gap-2">
          <input
            name="bpSystolic"
            type="number"
            placeholder="BP Systolic"
            value={formData.bpSystolic}
            onChange={handleChange}
            className="border p-2 rounded"
          />
          <input
            name="bpDiastolic"
            type="number"
            placeholder="BP Diastolic"
            value={formData.bpDiastolic}
            onChange={handleChange}
            className="border p-2 rounded"
          />
        </div>
      </div>

      <button
        type="submit"
        className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700 transition"
      >
        Register Walk-in
      </button>
    </form>
  );
}