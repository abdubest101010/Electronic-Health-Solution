// app/loading.tsx
'use client';

import { Box, CircularProgress, Backdrop, Typography } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { useEffect, useState } from 'react';

export default function Loading() {
  const theme = useTheme();
  const [show, setShow] = useState(false);

  // Optional: delay to avoid flicker on fast navigations
  useEffect(() => {
    const timer = setTimeout(() => setShow(true), 200);
    return () => clearTimeout(timer);
  }, []);

  if (!show) return null;

  return (
    <Backdrop
      open
      sx={{
        zIndex: theme.zIndex.drawer + 1000,
        color: '#fff',
        bgcolor: 'rgba(26, 35, 126, 0.9)', // ink effect
        backdropFilter: 'blur(4px)',
      }}
    >
      <Box sx={{ textAlign: 'center' }}>
        <CircularProgress size={60} thickness={4} sx={{ color: '#fff', mb: 2 }} />
        <Typography variant="h6" sx={{ fontWeight: 500 }}>
          Loading...
        </Typography>
      </Box>
    </Backdrop>
  );
}