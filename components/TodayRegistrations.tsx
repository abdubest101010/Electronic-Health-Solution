'use client';

import { useEffect, useState } from 'react';
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
  Skeleton,
  TablePagination,
} from '@mui/material';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import PatientSearchFilter from './PatientSearchFilter';
import PatientTable from './PatientTable';
import { PatientData } from '@/types/patient'; // 👈 shared type

export default function AllPatients() {
  const [patients, setPatients] = useState<PatientData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  useEffect(() => {
    const fetchPatients = async () => {
      try {
        setError(null);
        setLoading(true);
        const res = await fetch('/api/patients');
        if (!res.ok) throw new Error('Failed to load data');
        const data = await res.json();
        // Ensure appointments always exists as an array
        const normalized = data.map((p: any) => ({
          ...p,
          appointments: Array.isArray(p.appointments) ? p.appointments : [],
        }));
        setPatients(normalized);
      } catch (err) {
        setError('Failed to load patients. Please try again.');
        console.error('Fetch error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchPatients();
  }, []);

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const paginatedPatients = patients.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  return (
    <Box sx={{ p: 2, maxWidth: 1000, mx: 'auto', bgcolor: '#fff', borderRadius: 2, boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2, px: 2, pt: 2 }}>
        <Box display="flex" alignItems="center">
          <PersonAddIcon sx={{ mr: 1, color: '#1a237e', fontSize: 28 }} />
          <Typography variant="h6" sx={{ fontWeight: 500, color: '#1a237e' }}>
            All Registered Patients
          </Typography>
        </Box>
        <Typography variant="body2" sx={{ color: '#1a237e', fontWeight: 500 }}>
          Total: {patients.length}
        </Typography>
      </Box>

      <Box sx={{ px: 2, mb: 2 }}>
        <PatientSearchFilter />
      </Box>

      {error ? (
        <Typography color="error" sx={{ textAlign: 'center', py: 2, px: 2 }}>
          {error}
        </Typography>
      ) : loading ? (
        <TableContainer component={Paper} sx={{ borderRadius: 2, mx: 2 }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 500, color: '#1a237e' }}>Name</TableCell>
                <TableCell sx={{ fontWeight: 500, color: '#1a237e' }}>Registered At</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {[...Array(5)].map((_, index) => (
                <TableRow key={index}>
                  <TableCell><Skeleton variant="text" width="70%" /></TableCell>
                  <TableCell><Skeleton variant="text" width="50%" /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      ) : (
        <>
          <PatientTable patients={paginatedPatients} />
          <TablePagination
            rowsPerPageOptions={[10, 25, 50]}
            component="div"
            count={patients.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            sx={{ px: 2, bgcolor: '#f8f9ff' }}
          />
        </>
      )}
    </Box>
  );
}