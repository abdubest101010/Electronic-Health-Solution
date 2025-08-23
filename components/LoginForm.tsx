// app/login/page.tsx (assuming you need a sample, even if setup)
'use client';

import { signIn } from 'next-auth/react';
import { useState } from 'react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await signIn('credentials', {
      redirect: false,
      email,
      password,
    });
    if (res?.ok) {
      window.location.href = '/dashboard'; // Redirect to a main dashboard that routes by role
    } else {
      alert('Login failed');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-4">
      <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" required className="border p-1" />
      <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" required className="border p-1" />
      <button type="submit" className="bg-blue-500 text-white p-2">Login</button>
    </form>
  );
}