'use client';

import { useRouter } from 'next/navigation';
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
} from '@mui/material';
import PersonAddIcon from '@mui/icons-material/PersonAdd';

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

  if (patients.length === 0) {
    return (
      <Box sx={{ textAlign: 'center', py: 3, bgcolor: '#f8f9ff', borderRadius: 1, mx: 2 }}>
        <PersonAddIcon sx={{ fontSize: 40, color: '#e0e0e0', mb: 1 }} />
        <Typography variant="body2" color="text.secondary">
          No patients registered today
        </Typography>
      </Box>
    );
  }

  return (
    <TableContainer component={Paper} sx={{ borderRadius: 2, mx: 2, boxShadow: 'none' }}>
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
                <Link
                  href={`/dashboard/receptionist/patients/${patient.id}`}
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
                    router.push(`/dashboard/receptionist/patients/${patient.id}`);
                  }}
                >
                  {patient.name}
                </Link>
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
  );
}