'use client';

import { useState, useEffect, useCallback } from 'react';
import { Box, Paper, Typography, TextField, Button, Dialog, DialogTitle, DialogContent, DialogActions, Collapse } from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import MedicalHistory from './MedicalHistory';
import LabResults from './LabResult';
import CreateAppointmentForm from './CreateAppointmentForm';
import LabAssign from './LabAssign';
import { LabService } from '@/types/appointment';

interface Examination {
  appointmentId: number | null;
  complaints: string | null;
  diagnosis: string | null;
  visitStatus: string;
  createdAt: string;
}

interface Prescription {
  appointmentId: number | null;
  medicines: string | null;
  recommendations: string | null;
  createdAt: string;
}

interface Props {
  patientName: string;
  patientId: number;
  vitals: {
    weight?: number | null;
    bpSystolic?: number | null;
    bpDiastolic?: number | null;
  } | null | undefined;
  services: LabService[];
  examinations: Examination[];
  prescriptions: Prescription[];
  onExamine: (formData: { complaints: string; diagnosis: string }) => Promise<void>;
  onPrescribe: (formData: { medicines: string; recommendations: string }) => Promise<void>;
}

export default function ExaminationSection({
  patientName,
  patientId,
  vitals,
  services,
  examinations = [],
  prescriptions = [],
  onExamine,
  onPrescribe,
}: Props) {
  const [formData, setFormData] = useState({
    complaints: '',
    diagnosis: '',
    medicines: '',
    recommendations: '',
  });
  const [examLoading, setExamLoading] = useState(false);
  const [prescribeLoading, setPrescribeLoading] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);
  const [showLabAssign, setShowLabAssign] = useState(false);
  const [justAssigned, setJustAssigned] = useState(false);
  const [hasCompletedResults, setHasCompletedResults] = useState(false);

  // Debug re-renders
  useEffect(() => {
    console.log('🔄 [ExaminationSection] Rendered');
  });

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    console.log(`📝 [ExaminationSection] Updated ${name}:`, value);
  };

  const handleResultsChange = useCallback((count: number) => {
    console.log(`📊 [ExaminationSection] Lab results count changed: ${count}`);
    setHasCompletedResults(count > 0);
    if (count > 0) {
      setJustAssigned(false);
    }
  }, []);

  // Filter examinations to show only the latest relevant record per day
  const filteredExaminations = examinations.reduce((acc: Examination[], exam: Examination) => {
    const examDate = new Date(exam.createdAt).toISOString().split('T')[0];
    const existingExam = acc.find((e) => new Date(e.createdAt).toISOString().split('T')[0] === examDate);

    if (!existingExam) {
      acc.push(exam);
    } else if (exam.diagnosis && (!existingExam.diagnosis || new Date(exam.createdAt) > new Date(existingExam.createdAt))) {
      acc = acc.filter((e) => new Date(e.createdAt).toISOString().split('T')[0] !== examDate);
      acc.push(exam);
    }
    return acc;
  }, []).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const handleExamine = async () => {
    setExamLoading(true);
    try {
      await onExamine({ complaints: formData.complaints, diagnosis: formData.diagnosis });
      setFormData((prev) => ({ ...prev, complaints: '', diagnosis: '' }));
    } catch (err: any) {
      console.error('💥 [ExaminationSection] Error saving examination:', err);
      alert(`Error: ${err.message}`);
    }
    setExamLoading(false);
  };

  const handlePrescribe = async () => {
    setPrescribeLoading(true);
    try {
      const response = await fetch(`/api/appointments/get?patientId=${patientId}`, {
        headers: { 'Content-Type': 'application/json' },
        cache: 'no-store',
      });
      if (!response.ok) {
        throw new Error('Failed to fetch appointments');
      }
      const appointment = await response.json();
      if (!appointment.id) {
        setOpenDialog(true);
      } else {
        await onPrescribe({ medicines: formData.medicines, recommendations: formData.recommendations });
        setFormData((prev) => ({ ...prev, medicines: '', recommendations: '' }));
      }
    } catch (err: any) {
      console.error('💥 [ExaminationSection] Error checking appointments or saving prescription:', err);
      alert(`Error: ${err.message}`);
    }
    setPrescribeLoading(false);
  };

  const handleDialogClose = () => {
    setOpenDialog(false);
  };

  const handleProceedWithoutAppointment = async () => {
    setOpenDialog(false);
    try {
      await onPrescribe({ medicines: formData.medicines, recommendations: formData.recommendations });
      setFormData((prev) => ({ ...prev, medicines: '', recommendations: '' }));
    } catch (err: any) {
      console.error('💥 [ExaminationSection] Error saving prescription:', err);
      alert(`Error: ${err.message}`);
    }
  };

  const handleAssignSuccess = () => {
    setJustAssigned(true);
    setShowLabAssign(false);
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

      {/* Past Visits */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#1a237e', mb: 2 }}>
          Past Visits
        </Typography>
        {filteredExaminations.length === 0 && prescriptions.length === 0 ? (
          <Typography sx={{ color: '#666' }}>No past visits recorded.</Typography>
        ) : (
          filteredExaminations.map((exam, index) => (
            <Box
              key={`${exam.createdAt}-${index}`}
              sx={{
                p: 2,
                mb: 2,
                border: '1px solid rgba(26, 35, 126, 0.1)',
                borderRadius: 1,
                backgroundColor: '#fff',
              }}
            >
              <Typography variant="body2" sx={{ color: '#1a237e', fontWeight: 500 }}>
                Visit on {new Date(exam.createdAt).toLocaleString()}
              </Typography>
              {exam.appointmentId && (
                <Typography variant="body2" sx={{ color: '#666' }}>
                  Appointment ID: {exam.appointmentId}
                </Typography>
              )}
              {exam.complaints && (
                <Typography variant="body2" sx={{ color: '#666', mt: 1 }}>
                  <strong>Complaints:</strong> {exam.complaints}
                </Typography>
              )}
              {exam.diagnosis && (
                <Typography variant="body2" sx={{ color: '#666' }}>
                  <strong>Diagnosis:</strong> {exam.diagnosis}
                </Typography>
              )}
              <Typography variant="body2" sx={{ color: '#666' }}>
                <strong>Visit Status:</strong> {exam.visitStatus.replace(/_/g, ' ')}
              </Typography>
              {Array.isArray(prescriptions) && prescriptions[index] && (
                <>
                  {prescriptions[index].medicines && (
                    <Typography variant="body2" sx={{ color: '#666', mt: 1 }}>
                      <strong>Medicines:</strong> {prescriptions[index].medicines}
                    </Typography>
                  )}
                  {prescriptions[index].recommendations && (
                    <Typography variant="body2" sx={{ color: '#666' }}>
                      <strong>Recommendations:</strong> {prescriptions[index].recommendations}
                    </Typography>
                  )}
                </>
              )}
            </Box>
          ))
        )}
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
          value={formData.complaints}
          onChange={handleChange}
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
          value={formData.diagnosis}
          onChange={handleChange}
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

      {/* Lab Assign Toggle */}
      {!justAssigned && (
        <Box sx={{ mb: 2 }}>
          <Button
            onClick={() => setShowLabAssign(!showLabAssign)}
            variant="outlined"
            sx={{
              borderRadius: 2,
              textTransform: 'none',
              color: '#1a237e',
              borderColor: '#1a237e',
              '&:hover': { borderColor: '#283593', backgroundColor: '#e8eaf6' },
              display: 'flex',
              alignItems: 'center',
              gap: 1,
            }}
          >
            {showLabAssign ? 'Hide Lab Assignment' : 'Show Lab Assignment'}
            <ExpandMoreIcon
              sx={{
                transform: showLabAssign ? 'rotate(180deg)' : 'rotate(0deg)',
                transition: 'transform 0.3s ease',
              }}
            />
          </Button>
        </Box>
      )}
      <Collapse in={showLabAssign && !justAssigned} timeout={300}>
        <LabAssign patientId={patientId} services={services} onAssignSuccess={handleAssignSuccess} />
      </Collapse>

      {/* Lab Results with Highlight */}
      <Box sx={{ mt: justAssigned ? 2 : 0, transition: 'all 0.3s ease', border: justAssigned ? '2px solid #1a237e' : 'none', borderRadius: 2 }}>
        <LabResults patientId={patientId} onResultsChange={handleResultsChange} />
      </Box>

      {/* Prescription */}
      <Box component="form" sx={{ pt: 4, borderTop: '1px solid rgba(26, 35, 126, 0.1)' }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#1a237e', mb: 2 }}>
          Prescription
        </Typography>
        <TextField
          name="medicines"
          label="Medicines"
          placeholder="List of medicines..."
          value={formData.medicines}
          onChange={handleChange}
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
          value={formData.recommendations}
          onChange={handleChange}
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

      {/* Appointment Reminder Dialog */}
      <Dialog open={openDialog} onClose={handleDialogClose} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ color: '#1a237e', fontWeight: 600 }}>
          Appointment Reminder
        </DialogTitle>
        <DialogContent>
          <Typography sx={{ mb: 2, color: '#666' }}>
            No appointment scheduled. Close to create one or complete the visit. Appointment form below.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={handleProceedWithoutAppointment}
            variant="contained"
            sx={{
              backgroundColor: '#2e7d32',
              '&:hover': { backgroundColor: '#388e3c' },
              textTransform: 'none',
            }}
          >
            Complete Visit Without Appointment
          </Button>
          <Button
            onClick={handleDialogClose}
            variant="outlined"
            sx={{
              color: '#1a237e',
              borderColor: '#1a237e',
              textTransform: 'none',
              '&:hover': { backgroundColor: '#f8f9ff', borderColor: '#283593' },
            }}
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>
      <CreateAppointmentForm patientId={patientId} />
    </Paper>
  );
}
