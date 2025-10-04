'use client';

import { useRouter, usePathname } from 'next/navigation';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Box,
  Typography,
  Link,
  Button,
  CircularProgress,
} from '@mui/material';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import { useState } from 'react';

interface PatientData {
  id: string;
  name: string;
  createdAt: string | Date;
}

interface PatientTableProps {
  patients: PatientData[];
}

export default function PatientTable({ patients }: PatientTableProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [loadingPatientId, setLoadingPatientId] = useState<string | null>(null);
  const isDashboard = pathname === '/receptionist';

  if (patients.length === 0) {
    return (
      <Box sx={{ textAlign: 'center', py: 3, bgcolor: '#f8f9ff', borderRadius: 1, mx: 2 }}>
        <PersonAddIcon sx={{ fontSize: 40, color: '#e0e0e0', mb: 1 }} />
        <Typography variant="body2" color="text.secondary">
          No patients registered
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ mx: 2 }}>
      {!isDashboard && (
        <Box sx={{ display: 'flex', justifyContent: 'flex-start', mb: 2 }}>
          <Button
            variant="outlined"
            onClick={() => router.push('/receptionist')}
            sx={{ color: '#1a237e', borderColor: '#1a237e', '&:hover': { borderColor: '#283593', backgroundColor: 'rgba(40, 53, 147, 0.04)' } }}
          >
            Back to Dashboard
          </Button>
        </Box>
      )}
      <TableContainer component={Paper} sx={{ borderRadius: 2, boxShadow: 'none' }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 500, color: '#1a237e' }}>Name</TableCell>
              <TableCell sx={{ fontWeight: 500, color: '#1a237e' }}>Registered At</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {patients.map((patient) => (
              <TableRow
                key={patient.id}
                sx={{
                  '&:hover': {
                    backgroundColor: 'rgba(0, 0, 0, 0.02)',
                  },
                }}
              >
                <TableCell>
                  {loadingPatientId === patient.id ? (
                    <CircularProgress size={20} sx={{ color: '#1a237e' }} />
                  ) : (
                    <Link
                      href={`/receptionist/patients/${patient.id}`}
                      sx={{
                        color: '#1a237e',
                        textDecoration: 'none',
                        fontWeight: 400,
                        '&:hover': {
                          textDecoration: 'underline',
                          color: '#283593',
                        },
                      }}
                      onClick={(e) => {
                        e.preventDefault();
                        setLoadingPatientId(patient.id);
                        router.push(`/receptionist/patients/${patient.id}`);
                      }}
                    >
                      {patient.name}
                    </Link>
                  )}
                </TableCell>
                <TableCell sx={{ color: '#1a237e' }}>
                  {new Date(patient.createdAt).toLocaleTimeString('en-US', {
                    hour: '2-digit',
                    minute: '2-digit',
                    timeZone: 'Africa/Nairobi',
                  })}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}