// app/components/ProtectedLayout.tsx
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { ReactNode, useEffect } from 'react';

interface ProtectedLayoutProps {
  children: ReactNode;
  allowedRoles: string[];
}

export default function ProtectedLayout({ children, allowedRoles }: ProtectedLayoutProps) {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'loading') return;
    if (!session) {
      router.push('/login');
    } else if (!allowedRoles.includes(session.user.role)) {
      router.push('/unauthorized');
    }
  }, [session, status, router, allowedRoles]);

  if (status === 'loading' || !session) {
    return <div>Loading...</div>;
  }

  return <>{children}</>;
}