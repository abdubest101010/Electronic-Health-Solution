'use client';

import { useEffect, useState } from 'react';
import { Box, Paper, Typography, TextField, Button } from '@mui/material';

export default function MedicalHistory({ patientId }: { patientId: number }) {
  const [history, setHistory] = useState<string | null>(null);
  const [inputValue, setInputValue] = useState('');
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!patientId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    const fetchHistory = async () => {
      try {
        const res = await fetch(`/api/patients/medical-history/${patientId}`);
        if (!res.ok) throw new Error('Failed to fetch');
        const data = await res.json();
        const saved = typeof data.history === 'string' ? data.history : '';
        setHistory(saved);
        setInputValue(saved);
      } catch (err) {
        console.error('Fetch error:', err);
        setHistory('Failed to load history.');
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [patientId]);

  const startEditing = () => {
    setInputValue(history || '');
    setEditing(true);
  };

  const cancelEdit = () => {
    setEditing(false);
  };

  const saveHistory = async () => {
    if (!patientId) {
      alert('No patient selected');
      return;
    }

    try {
      const res = await fetch(`/api/patients/medical-history/${patientId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ history: inputValue }),
      });

      if (res.ok) {
        setHistory(inputValue);
        setEditing(false);
      } else {
        const error = await res.json();
        alert(`Save failed: ${error.error}`);
      }
    } catch (err) {
      alert('Network error');
    }
  };

  if (loading) {
    return (
      <Paper
        sx={{
          p: 3,
          mt: 2,
          borderRadius: 2,
          boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
          backgroundColor: '#fff',
        }}
      >
        <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#1a237e', mb: 2 }}>
          Patient History
        </Typography>
        <Typography variant="body2" sx={{ color: '#666' }}>
          Loading...
        </Typography>
      </Paper>
    );
  }

  if (!patientId) {
    return (
      <Paper
        sx={{
          p: 3,
          mt: 2,
          borderRadius: 2,
          boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
          backgroundColor: '#fff',
        }}
      >
        <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#1a237e', mb: 2 }}>
          Patient History
        </Typography>
        <Typography variant="body2" sx={{ color: '#666' }}>
          No patient selected.
        </Typography>
      </Paper>
    );
  }

  return (
    <Paper
      sx={{
        p: 3,
        mt: 2,
        borderRadius: 2,
        boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
        backgroundColor: '#fff',
      }}
    >
      <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#1a237e', mb: 2 }}>
        Patient History
      </Typography>
      {editing ? (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <TextField
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Enter patient history: Diabetic, Allergic to penicillin, etc."
            multiline
            rows={4}
            fullWidth
            variant="outlined"
            sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
          />
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              onClick={saveHistory}
              variant="contained"
              sx={{
                borderRadius: 2,
                textTransform: 'none',
                backgroundColor: '#1a237e',
                '&:hover': { backgroundColor: '#283593' },
              }}
            >
              Save
            </Button>
            <Button
              onClick={cancelEdit}
              variant="contained"
              sx={{
                borderRadius: 2,
                textTransform: 'none',
                backgroundColor: '#9e9e9e',
                '&:hover': { backgroundColor: '#757575' },
              }}
            >
              Cancel
            </Button>
          </Box>
        </Box>
      ) : (
        <Box>
          {history ? (
            <Typography variant="body2" sx={{ color: '#666', whiteSpace: 'pre-wrap' }}>
              {history}
            </Typography>
          ) : (
            <Typography variant="body2" sx={{ color: '#666' }}>
              No patient history recorded yet.
            </Typography>
          )}
          <Button
            onClick={startEditing}
            sx={{
              mt: 2,
              color: '#1a237e',
              textTransform: 'none',
              fontWeight: 500,
              '&:hover': { textDecoration: 'underline', color: '#283593' },
            }}
          >
            {history ? 'Edit History' : 'Add History'}
          </Button>
        </Box>
      )}
    </Paper>
  );
}