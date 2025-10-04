'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Typography } from '@mui/material'
import Link from 'next/link';
type Role = 'RECEPTIONIST' | 'DOCTOR' | 'LABORATORIST';

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'RECEPTIONIST' as Role,
  });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);

  const router = useRouter();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json', // 🔥 Critical: Set correct header
        },
        body: JSON.stringify(formData), // ✅ Correctly stringifies to valid JSON
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to register');
      }

      setSuccess(true);
      // Clear form and redirect after 1.5s
      setTimeout(() => {
        router.push('/');
      }, 1500);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-10 p-6 bg-white border rounded-lg shadow">
       <Typography variant="h4" sx={{ mb: 1, textAlign: 'center', color: '#1a237e' }}>
       <span style={{ color: '#E07A3F' }}>NISWA Clinic</span>
        </Typography>
        <Typography variant="h6" sx={{ mb: 3, textAlign: 'center' }}>
          Register New User
        </Typography>
      {/* <h1 className="text-2xl font-bold mb-6">Register New User</h1> */}

      {success ? (
        <div className="text-green-600 text-center">
          ✅ User created successfully! Redirecting to login...
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <div className="text-red-600 text-sm">{error}</div>}

          <div>
            <label className="block text-sm font-medium mb-1">Full Name</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              className="w-full border p-2 rounded"
              placeholder="John Doe"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              className="w-full border p-2 rounded"
              placeholder="john@example.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Password</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              minLength={6}
              className="w-full border p-2 rounded"
              placeholder="••••••"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Role</label>
            <select
              name="role"
              value={formData.role}
              onChange={handleChange}
              className="w-full border p-2 rounded"
            >
              <option value="RECEPTIONIST">Receptionist</option>
              <option value="DOCTOR">Doctor</option>
              <option value="LABORATORIST">Laboratorist</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700 disabled:bg-blue-400 transition"
          >
            {loading ? 'Creating Account...' : 'Register'}
          </button>
        </form>
        
      )}
       <Typography variant="body2" align="center" sx={{ mt: 2 }}>
            You already have an account?{' '}
            <Link href="/login" style={{ color: '#1976d2', textDecoration: 'underline' }}>
              Login
            </Link>
          </Typography>
    </div>
  );
}