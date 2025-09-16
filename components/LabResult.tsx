'use client';

import { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Skeleton,
  TablePagination,
} from '@mui/material';
import ScienceIcon from '@mui/icons-material/Science';

interface LabResult {
  labOrderId: number;
  serviceName: string;
  result: string | null;
  laboratoristName: string;
  completedAt: string;
}

export default function LabResults({ patientId }: { patientId: number | null }) {
  const [results, setResults] = useState<LabResult[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);

  useEffect(() => {
    if (!patientId) {
      setResults([]);
      setLoading(false);
      console.log('⚠️ [LabResults] No patientId provided, skipping fetch');
      return;
    }

    const fetchResults = async () => {
      try {
        setLoading(true);
        setError(null);
        console.log('🔍 [LabResults] Fetching lab results for patientId:', patientId);
        const res = await fetch(`/api/lab-result?patientId=${patientId}`);
        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.error || 'Failed to fetch lab results');
        }
        const data: LabResult[] = await res.json();
        console.log('✅ [LabResults] Fetched lab results:', data.length, data);
        setResults(data);
      } catch (err: any) {
        console.error('❌ [LabResults] Error fetching lab results:', err);
        setError(err.message || 'Failed to fetch lab results');
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, [patientId]);

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const paginatedResults = results.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  if (!patientId) {
    return null;
  }

  if (loading) {
    return (
      <Box sx={{ p: 2, bgcolor: '#fff', borderRadius: 2, boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <ScienceIcon sx={{ mr: 1, color: '#1a237e' }} />
          <Typography variant="subtitle1" sx={{ fontWeight: 500, color: '#1a237e' }}>
            Lab Results
          </Typography>
        </Box>
        <TableContainer component={Paper} sx={{ borderRadius: 2, boxShadow: 'none' }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 500, color: '#1a237e' }}>Test</TableCell>
                <TableCell sx={{ fontWeight: 500, color: '#1a237e' }}>Result</TableCell>
                <TableCell sx={{ fontWeight: 500, color: '#1a237e' }}>Laboratorist</TableCell>
                <TableCell sx={{ fontWeight: 500, color: '#1a237e' }}>Completed</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {[...Array(3)].map((_, index) => (
                <TableRow key={index}>
                  <TableCell><Skeleton variant="text" width="70%" /></TableCell>
                  <TableCell><Skeleton variant="text" width="90%" /></TableCell>
                  <TableCell><Skeleton variant="text" width="60%" /></TableCell>
                  <TableCell><Skeleton variant="text" width="50%" /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 2, bgcolor: '#fff', borderRadius: 2, boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
        <Typography color="error" sx={{ textAlign: 'center', py: 2 }}>
          {error}
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 2, bgcolor: '#fff', borderRadius: 2, boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <ScienceIcon sx={{ mr: 1, color: '#1a237e' }} />
        <Typography variant="subtitle1" sx={{ fontWeight: 500, color: '#1a237e' }}>
          Lab Results
        </Typography>
      </Box>
      {results.length === 0 ? (
        <Typography variant="body2" color="text.secondary" sx={{ py: 2, textAlign: 'center' }}>
          No completed lab results yet.
        </Typography>
      ) : (
        <>
          <TableContainer component={Paper} sx={{ borderRadius: 2, boxShadow: 'none' }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 500, color: '#1a237e' }}>Test</TableCell>
                  <TableCell sx={{ fontWeight: 500, color: '#1a237e' }}>Result</TableCell>
                  <TableCell sx={{ fontWeight: 500, color: '#1a237e' }}>Laboratorist</TableCell>
                  <TableCell sx={{ fontWeight: 500, color: '#1a237e' }}>Completed</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {paginatedResults.map((result) => (
                  <TableRow
                    key={result.labOrderId}
                    sx={{ '&:hover': { backgroundColor: 'rgba(0, 0, 0, 0.02)' } }}
                  >
                    <TableCell sx={{ color: '#1a237e' }}>{result.serviceName}</TableCell>
                    <TableCell sx={{ color: '#1a237e', whiteSpace: 'pre-wrap' }}>
                      {result.result || <em>No details provided</em>}
                    </TableCell>
                    <TableCell sx={{ color: '#1a237e' }}>{result.laboratoristName}</TableCell>
                    <TableCell sx={{ color: '#1a237e' }}>
                      {new Date(result.completedAt).toLocaleString('en-US', {
                        dateStyle: 'short',
                        timeStyle: 'short',
                        timeZone: 'Africa/Nairobi',
                      })}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          <TablePagination
            rowsPerPageOptions={[5, 10, 25]}
            component="div"
            count={results.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            sx={{ bgcolor: '#f8f9ff' }}
          />
        </>
      )}
    </Box>
  );
}