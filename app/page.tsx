'use client';

import Image from 'next/image';
import Link from 'next/link';
import LoginForm from '@/components/LoginForm';
import { Box, Card, CardContent, Typography } from '@mui/material';

export default function HomePage() {
  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto', marginTop:13 }}>
      {/* Hero Section */}
      <Box
        sx={{
          position: 'relative',
          height: { xs: 800, md: 500 },
          mb: 4,
          borderRadius: 2,
          overflow: 'hidden',
        }}
      >
        <Image
          src="/Doctors_at_work.jpg"
          alt="Welcoming women's clinic"
          fill
          style={{ objectFit: 'cover' }}
        />
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            bgcolor: 'rgba(0, 0, 0, 0.4)',
            color: 'white',
            textAlign: 'center',
            
          }}
        >
          <Box>
            <Typography variant="h3" sx={{ fontWeight: 'bold', mb: 2 }}>
              Empowering Women Through Every Stage of Life
            </Typography>
            <Typography variant="h6">
              Specialized care for pregnancy, birth, and women's health.
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* Services Overview */}
      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 3, mb: 4 }}>
        <Card sx={{ flex: 1, textAlign: 'center', boxShadow: 2 }}>
          <CardContent>
            <Box sx={{ height: 200, position: 'relative', mb: 2 }}>
              <Image
                src="/pregnant-support.jpeg"
                alt="Prenatal Care"
                fill
                style={{ objectFit: 'cover', borderRadius: 8 }}
              />
            </Box>
            <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 1 }}>
              Prenatal Care
            </Typography>
            <Typography variant="body2">
              Comprehensive support for a healthy pregnancy journey.
            </Typography>
          </CardContent>
        </Card>
        <Card sx={{ flex: 1, textAlign: 'center', boxShadow: 2 }}>
          <CardContent>
            <Box sx={{ height: 200, position: 'relative', mb: 2 }}>
              <Image
              src={"/birth.jpg"}
                alt="Birth Services"
                fill
                style={{ objectFit: 'cover', borderRadius: 8 }}
              />
            </Box>
            <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 1 }}>
              Birth Services
            </Typography>
            <Typography variant="body2">
              Expert guidance for safe and empowering deliveries.
            </Typography>
          </CardContent>
        </Card>
        <Card sx={{ flex: 1, textAlign: 'center', boxShadow: 2 }}>
          <CardContent>
            <Box sx={{ height: 200, position: 'relative', mb: 2 }}>
              <Image
                src={"/afterBirth.jpg"}
                alt="Postpartum Support"
                fill
                style={{ objectFit: 'cover', borderRadius: 8 }}
              />
            </Box>
            <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 1 }}>
              Postpartum Support
            </Typography>
            <Typography variant="body2">
              Caring for new mothers and families after birth.
            </Typography>
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
}