'use client';

import { useState } from 'react';
import { Box, Paper, Typography, TextField, Button } from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';
import MedicalHistory from './MedicalHistory';
import LabResults from '@/components/LabResult';

interface LabService {
  id: number;
  name: string;
}

interface Props {
  formData: {
    complaints: string;
    diagnosis: string;
    visitDetails: string;
    medicines: string;
    recommendations: string;
  };
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement>) => void;
  onExamine: () => Promise<void> | void;
  onPrescribe: () => Promise<void> | void;
  patientName: string;
  patientId: number;
  vitals: {
    weight?: number | null;
    bpSystolic?: number | null;
    bpDiastolic?: number | null;
  } | null | undefined;
  services: LabService[];
}

export default function ExaminationSection({
  formData,
  onChange,
  onExamine,
  onPrescribe,
  patientName,
  patientId,
  vitals,
  services,
}: Props) {
  const [examLoading, setExamLoading] = useState(false);
  const [prescribeLoading, setPrescribeLoading] = useState(false);

  const handleExamine = async () => {
    setExamLoading(true);
    await onExamine();
    setExamLoading(false);
  };

  const handlePrescribe = async () => {
    setPrescribeLoading(true);
    await onPrescribe();
    setPrescribeLoading(false);
  };

  return (
    <Paper
      sx={{
        p: 4,
        mt: 4,
        borderRadius: 2,
        boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
        backgroundColor: '#f8f9ff',
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <PersonIcon
          sx={{
            mr: 1,
            color: '#1a237e',
            backgroundColor: 'rgba(26, 35, 126, 0.1)',
            borderRadius: 1,
            p: 0.5,
          }}
        />
        <Typography variant="h6" sx={{ fontWeight: 600, color: '#1a237e' }}>
          Examination for: {patientName}
        </Typography>
      </Box>

      {/* Vitals Section */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#1a237e', mb: 2 }}>
          Vitals
        </Typography>
        <Box
          sx={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 2,
            justifyContent: { xs: 'center', sm: 'space-between' },
          }}
        >
          <Box
            sx={{
              p: 2,
              border: '1px solid rgba(26, 35, 126, 0.1)',
              borderRadius: 1,
              backgroundColor: '#fff',
              flex: { xs: '1 1 100%', sm: '1 1 30%' },
              minWidth: 150,
            }}
          >
            <Typography variant="body2" sx={{ color: '#666', mb: 1 }}>
              Weight
            </Typography>
            <Typography variant="h6" sx={{ fontWeight: 500, color: '#1a237e' }}>
              {vitals?.weight != null ? `${vitals.weight} kg` : 'N/A'}
            </Typography>
          </Box>
          <Box
            sx={{
              p: 2,
              border: '1px solid rgba(26, 35, 126, 0.1)',
              borderRadius: 1,
              backgroundColor: '#fff',
              flex: { xs: '1 1 100%', sm: '1 1 30%' },
              minWidth: 150,
            }}
          >
            <Typography variant="body2" sx={{ color: '#666', mb: 1 }}>
              Blood Pressure (Systolic)
            </Typography>
            <Typography variant="h6" sx={{ fontWeight: 500, color: '#1a237e' }}>
              {vitals?.bpSystolic != null ? `${vitals.bpSystolic} mmHg` : 'N/A'}
            </Typography>
          </Box>
          <Box
            sx={{
              p: 2,
              border: '1px solid rgba(26, 35, 126, 0.1)',
              borderRadius: 1,
              backgroundColor: '#fff',
              flex: { xs: '1 1 100%', sm: '1 1 30%' },
              minWidth: 150,
            }}
          >
            <Typography variant="body2" sx={{ color: '#666', mb: 1 }}>
              Blood Pressure (Diastolic)
            </Typography>
            <Typography variant="h6" sx={{ fontWeight: 500, color: '#1a237e' }}>
              {vitals?.bpDiastolic != null ? `${vitals.bpDiastolic} mmHg` : 'N/A'}
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* Current Visit */}
      <Box component="form" sx={{ mb: 4 }}>
        <Typography
          variant="subtitle1"
          sx={{ fontWeight: 600, color: '#1a237e', mb: 2, borderBottom: '1px solid rgba(26, 35, 126, 0.1)', pb: 1 }}
        >
          Current Visit: Health History & Condition
        </Typography>
        <MedicalHistory patientId={patientId} />
        <TextField
          name="complaints"
          label="Presenting Complaints"
          placeholder="Enter presenting complaints..."
          value={formData.complaints || ''}
          onChange={onChange}
          fullWidth
          multiline
          rows={3}
          sx={{ mt: 2, '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
          variant="outlined"
        />
        <TextField
          name="diagnosis"
          label="Diagnosis / Condition"
          placeholder="Enter diagnosis or condition..."
          value={formData.diagnosis || ''}
          onChange={onChange}
          fullWidth
          multiline
          rows={3}
          sx={{ mt: 2, '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
          variant="outlined"
        />
        <Button
          type="button"
          onClick={handleExamine}
          disabled={examLoading}
          variant="contained"
          sx={{
            mt: 2,
            borderRadius: 2,
            textTransform: 'none',
            backgroundColor: examLoading ? '#9e9e9e' : '#1a237e',
            '&:hover': { backgroundColor: examLoading ? '#9e9e9e' : '#283593' },
          }}
        >
          {examLoading ? 'Saving...' : 'Save Examination'}
        </Button>
      </Box>
      <LabResults patientId={patientId} />

      {/* Prescription */}
      <Box component="form" sx={{ pt: 4, borderTop: '1px solid rgba(26, 35, 126, 0.1)' }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#1a237e', mb: 2 }}>
          Prescription
        </Typography>
        <TextField
          name="medicines"
          label="Medicines"
          placeholder="List of medicines..."
          value={formData.medicines || ''}
          onChange={onChange}
          fullWidth
          multiline
          rows={3}
          sx={{ mb: 2, '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
          variant="outlined"
        />
        <TextField
          name="recommendations"
          label="Recommendations"
          placeholder="Lifestyle advice, diet, rest, etc."
          value={formData.recommendations || ''}
          onChange={onChange}
          fullWidth
          multiline
          rows={3}
          sx={{ mb: 2, '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
          variant="outlined"
        />
        <Button
          type="button"
          onClick={handlePrescribe}
          disabled={prescribeLoading}
          variant="contained"
          sx={{
            borderRadius: 2,
            textTransform: 'none',
            backgroundColor: prescribeLoading ? '#9e9e9e' : '#2e7d32',
            '&:hover': { backgroundColor: prescribeLoading ? '#9e9e9e' : '#388e3c' },
          }}
        >
          {prescribeLoading ? 'Saving...' : 'Save Prescription & Complete Visit'}
        </Button>
      </Box>
    </Paper>
  );
}