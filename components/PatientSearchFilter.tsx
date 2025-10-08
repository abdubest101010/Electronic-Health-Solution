'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box,
  TextField,
  InputAdornment,
  List,
  ListItem,
  ListItemText,
  Paper,
  Typography,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';

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

export default function PatientSearchFilter() {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<PatientData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const fetchPatients = async () => {
      if (!searchTerm.trim()) {
        setSearchResults([]);
        return;
      }

      setIsLoading(true);
      try {
        const res = await fetch(`/api/patients?search=${encodeURIComponent(searchTerm)}`);
        if (!res.ok) throw new Error('Failed to fetch patients');
        const data = await res.json();
        console.log('Search results:', { searchTerm, data }); // Debug log
        setSearchResults(data);
      } catch (err) {
        console.error('Search error:', err);
        setSearchResults([]);
      } finally {
        setIsLoading(false);
      }
    };

    const debounce = setTimeout(fetchPatients, 300); // Debounce to reduce API calls
    return () => clearTimeout(debounce); // Cleanup
  }, [searchTerm]);

  const handleSelectPatient = (patientId: string) => {
    setSearchTerm(''); // Clear search input
    setSearchResults([]); // Clear results
    router.push(`/receptionist/patients/${patientId}`); // Redirect to patient details
  };

  return (
    <Box sx={{ mb: 2, position: 'relative' }}>
      <TextField
        fullWidth
        label="Search Patients by Name"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon sx={{ color: '#1a237e' }} />
            </InputAdornment>
          ),
        }}
        sx={{
          maxWidth: 400,
          '& .MuiOutlinedInput-root': {
            borderRadius: 2,
            backgroundColor: '#f8f9ff',
            '&:hover fieldset': {
              borderColor: '#283593',
            },
            '&.Mui-focused fieldset': {
              borderColor: '#1a237e',
            },
          },
          '& .MuiInputLabel-root': {
            color: '#1a237e',
            '&.Mui-focused': {
              color: '#1a237e',
            },
          },
        }}
      />
      {searchTerm.trim() && (
        <Paper
          sx={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            maxWidth: 400,
            maxHeight: 300,
            overflowY: 'auto',
            zIndex: 1000,
            mt: 1,
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            borderRadius: 2,
            border: '1px solid #e0e0e0',
          }}
        >
          {isLoading ? (
            <Box sx={{ p: 2 }}>
              <Typography color="#1a237e">Loading...</Typography>
            </Box>
          ) : searchResults.length === 0 ? (
            <Box sx={{ p: 2 }}>
              <Typography color="#1a237e">No patients found</Typography>
            </Box>
          ) : (
            <List>
              {searchResults.map((patient) => (
                <ListItem
                  key={patient.id}
                  component="button"
                  onClick={() => handleSelectPatient(patient.id)}
                  sx={{
                    textAlign: 'left',
                    '&:hover': {
                      backgroundColor: 'rgba(40, 53, 147, 0.04)',
                    },
                    paddingY: 1.5,
                    borderBottom: '1px solid #e0e0e0',
                    '&:last-child': { borderBottom: 'none' },
                  }}
                >
                  <ListItemText
                    primary={patient.name}
                    secondary={
                      patient.appointments.length > 0 && patient.appointments[0].dateTime
                        ? `Appt: ${new Date(patient.appointments[0].dateTime).toLocaleString('en-US', {
                            dateStyle: 'short',
                            timeStyle: 'short',
                            timeZone: 'Africa/Nairobi',
                          })}`
                        : 'No Appointment'
                    }
                    primaryTypographyProps={{
                      color: '#1a237e',
                      fontWeight: 500,
                    }}
                    secondaryTypographyProps={{
                      color: patient.appointments.length > 0 ? '#2e7d32' : '#d32f2f',
                      fontSize: '0.85rem',
                    }}
                  />
                </ListItem>
              ))}
            </List>
          )}
        </Paper>
      )}
    </Box>
  );
}