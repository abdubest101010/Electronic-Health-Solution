// app/dashboard/page.tsx (optional main dashboard to redirect based on role)
'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function Dashboard() {
  const { data: session } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (session?.user.role) {
      router.push(`/dashboard/${session.user.role.toLowerCase()}`);
    }
    if (!session) {
      router.push('/');
    }
  }, [session, router]);

  return <div>Redirecting...</div>;
}