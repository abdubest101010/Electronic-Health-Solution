// app/dashboard/admin/page.tsx
'use client';

import ProtectedLayout from '@/components/ProtectedLayout';

export default function AdminDashboard() {
  return (
    <ProtectedLayout allowedRoles={['ADMIN']}>
      <div className="p-4">
        <h1>Admin Dashboard</h1>
        {/* Add forms for managing users, services, etc. */}
        <p>Placeholder for admin actions like creating users or services.</p>
      </div>
    </ProtectedLayout>
  );
}