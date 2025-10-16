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

interface Appointment {
  id: number;
  dateTime: string | null;
  status: string;
}

interface PatientData {
  id: string;
  name: string;
  createdAt: string | Date;
  appointments: Appointment[];
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
            sx={{
              color: '#1a237e',
              borderColor: '#1a237e',
              '&:hover': { borderColor: '#283593', backgroundColor: 'rgba(40, 53, 147, 0.04)' },
              padding: '6px 16px',
              fontWeight: 500,
            }}
          >
            Back to Dashboard
          </Button>
        </Box>
      )}
      <TableContainer
        component={Paper}
        sx={{
          borderRadius: 2,
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          border: '1px solid #e0e0e0',
        }}
      >
        <Table>
          <TableHead>
            <TableRow sx={{ backgroundColor: '#f8f9ff' }}>
              <TableCell sx={{ fontWeight: 600, color: '#1a237e', py: 2 }}>Name</TableCell>
              <TableCell sx={{ fontWeight: 600, color: '#1a237e', py: 2 }}>Registered At</TableCell>
              <TableCell sx={{ fontWeight: 600, color: '#1a237e', py: 2 }}>Appointment Date</TableCell>
              <TableCell sx={{ fontWeight: 600, color: '#1a237e', py: 2 }}>Status</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {patients.map((patient) => (
              <TableRow
                key={patient.id}
                sx={{
                  '&:hover': {
                    backgroundColor: 'rgba(40, 53, 147, 0.04)',
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
                        fontWeight: 500,
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
                  {new Date(patient.createdAt).toLocaleString('en-US', {
                    dateStyle: 'medium',
                    timeStyle: 'short',
                    timeZone: 'Africa/Nairobi',
                  })}
                </TableCell>
                <TableCell sx={{ color: '#1a237e' }}>
                  {patient.appointments.length > 0 && patient.appointments[0].dateTime
                    ? new Date(patient.appointments[0].dateTime).toLocaleString('en-US', {
                        dateStyle: 'medium',
                        timeStyle: 'short',
                        timeZone: 'Africa/Nairobi',
                      })
                    : 'No Appointment'}
                </TableCell>
                <TableCell sx={{ color: '#1a237e' }}>
                  {patient.appointments?.length > 0 ? (
                    <Typography
                      variant="body2"
                      sx={{
                        display: 'inline-block',
                        px: 1,
                        py: 0.5,
                        borderRadius: 1,
                        bgcolor:
                          patient.appointments[0].status === 'SCHEDULED'
                            ? 'rgba(46, 125, 50, 0.1)'
                            : 'rgba(211, 47, 47, 0.1)',
                        color:
                          patient.appointments[0].status === 'SCHEDULED' ? '#2e7d32' : '#d32f2f',
                        fontWeight: 500,
                      }}
                    >
                      {patient.appointments[0].status}
                    </Typography>
                  ) : (
                    'N/A'
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}