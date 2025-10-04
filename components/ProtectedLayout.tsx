// app/components/ProtectedLayout.tsx
'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { ReactNode, useEffect } from 'react';
import {
  Box,
  CircularProgress,
  Typography,
  Backdrop,
  useTheme,
} from '@mui/material';

interface ProtectedLayoutProps {
  children: ReactNode;
  allowedRoles: string[];
}

export default function ProtectedLayout({ children, allowedRoles }: ProtectedLayoutProps) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const theme = useTheme();

  useEffect(() => {
    if (status === 'loading') return;

    if (!session) {
      router.push('/login');
      return;
    }

    if (!allowedRoles.includes(session.user.role)) {
      router.push('/');
      return;
    }
  }, [session, status, router, allowedRoles]);

  // Full-screen ink-like loading while checking auth
  if (status === 'loading' || !session || (session && !allowedRoles.includes(session.user.role))) {
    return (
      <Backdrop
        open
        sx={{
          zIndex: theme.zIndex.drawer + 1,
          color: '#fff',
          bgcolor: 'rgba(26, 35, 126, 0.85)', // deep indigo ink
        }}
      >
        <Box sx={{ textAlign: 'center' }}>
          <CircularProgress size={60} thickness={4} sx={{ color: '#fff', mb: 2 }} />
          <Typography variant="h6" sx={{ fontWeight: 500 }}>
            Verifying access...
          </Typography>
        </Box>
      </Backdrop>
    );
  }

  // Only render children if authorized
  return <>{children}</>;
}