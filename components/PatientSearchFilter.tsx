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

interface PatientData {
  id: string;
  name: string;
  createdAt: string | Date;
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
    router.push(`/dashboard/receptionist/patients/${patientId}`); // Redirect to patient details
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
              <SearchIcon sx={{ color: 'text.secondary' }} />
            </InputAdornment>
          ),
        }}
        sx={{
          maxWidth: 400,
          '& .MuiOutlinedInput-root': {
            borderRadius: 2,
            backgroundColor: '#f8f9ff',
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
          }}
        >
          {isLoading ? (
            <Box sx={{ p: 2 }}>
              <Typography color="text.secondary">Loading...</Typography>
            </Box>
          ) : searchResults.length === 0 ? (
            <Box sx={{ p: 2 }}>
              <Typography color="text.secondary">No patients found</Typography>
            </Box>
          ) : (
            <List>
              {searchResults.map((patient) => (
                <ListItem
                  key={patient.id}
                  component="button" // ✅ Renders as <button>
                  onClick={() => handleSelectPatient(patient.id)} // ✅ Adds click handler
                  sx={{
                    textAlign: 'left', // Ensure text aligns properly
                    '&:hover': {
                      backgroundColor: 'rgba(0, 0, 0, 0.04)',
                    },
                    paddingY: 1.5, // Optional: improve tap target size
                  }}
                >
                  <ListItemText
                    primary={patient.name}
                    secondary={new Date(patient.createdAt).toLocaleDateString('en-US', {
                      timeZone: 'Africa/Nairobi',
                    })}
                    primaryTypographyProps={{
                      color: '#1a237e',
                      fontWeight: 500,
                    }}
                    secondaryTypographyProps={{
                      color: 'text.secondary',
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