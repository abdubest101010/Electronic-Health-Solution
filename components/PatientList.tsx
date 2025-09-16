'use client';

import { useRouter } from 'next/navigation';
import { AssignedPatient } from '@/types/appointment';
import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
  Link,
} from '@mui/material';
import PersonAddIcon from '@mui/icons-material/PersonAdd';

interface PatientListProps {
  patients: AssignedPatient[];
}

export default function PatientList({ patients }: PatientListProps) {
  const router = useRouter();

  if (patients.length === 0) {
    return (
      <Box sx={{ textAlign: 'center', py: 4, backgroundColor: '#f8f9ff', borderRadius: 1 }}>
        <PersonAddIcon sx={{ fontSize: 48, color: '#e0e0e0', mb: 1 }} />
        <Typography variant="body1" color="text.secondary">
          No patients found
        </Typography>
      </Box>
    );
  }

  return (
    <TableContainer component={Paper} sx={{ borderRadius: 2, boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell sx={{ fontWeight: 600, color: '#1a237e' }}>Name</TableCell>
            <TableCell sx={{ fontWeight: 600, color: '#1a237e' }}>Visit Status</TableCell>
            {/* Uncomment if latestAppointment is added to AssignedPatient interface */}
            {/* <TableCell sx={{ fontWeight: 600, color: '#1a237e' }}>Appointment Date</TableCell> */}
          </TableRow>
        </TableHead>
        <TableBody>
          {patients.map((patient) => (
            <TableRow
              key={patient.patient.id}
              sx={{
                '&:hover': {
                  backgroundColor: 'rgba(0, 0, 0, 0.04)',
                },
              }}
            >
              <TableCell>
                <Link
                  href={`/dashboard/doctor/patient/${patient.patient.id}`}
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
                    router.push(`/dashboard/doctor/patient/${patient.patient.id}`);
                  }}
                >
                  {patient.patient.name}
                </Link>
              </TableCell>
              <TableCell>{patient.visitStatus.replace(/_/g, ' ')}</TableCell>
              {/* Uncomment if latestAppointment is added to AssignedPatient interface */}
              {/* <TableCell>
                {patient.latestAppointment?.dateTime
                  ? new Date(patient.latestAppointment.dateTime).toLocaleDateString('en-US', {
                      timeZone: 'Africa/Nairobi',
                    })
                  : 'No appointment date found'}
              </TableCell> */}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}