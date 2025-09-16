'use client';

import Link from 'next/link';
import Image from 'next/image';
import { AppBar, Toolbar, Typography, Button, Box } from '@mui/material';

export default function Navbar() {
  return (
    <AppBar position="static" sx={{ bgcolor: '#1976d2', boxShadow: 3 }}>
      <Toolbar sx={{ mx: 'auto', maxWidth: 1200, width: '100%' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 1 }}>
          <Image
            src="/logo.png"
            alt="Women's Birth Clinic Logo"
            width={70}
            height={70}
            style={{ objectFit: 'contain' }}
          />
          <Typography variant="h6" sx={{ ml: 2, fontWeight: 'bold' }}>
            <Link href="/" style={{ color: 'white', textDecoration: 'none' }}>
              Women's Birth Clinic
            </Link>
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button color="inherit" href="/">Home</Button>
          <Button color="inherit" href="/about">About</Button>
          <Button color="inherit" href="/services">Services</Button>
          <Button color="inherit" href="/contact">Contact</Button>
          <Button
            variant="contained"
            color="secondary"
            href="/login"
            sx={{ bgcolor: 'white', color: '#1976d2', '&:hover': { bgcolor: '#f5f5f5' } }}
          >
            Login
          </Button>
        </Box>
      </Toolbar>
    </AppBar>
  );
}