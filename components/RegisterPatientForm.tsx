'use client';

import { useState } from 'react';
import {
  Box,
  TextField,
  Button,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  Alert,
  CircularProgress,
  SelectChangeEvent,
  InputAdornment,
  IconButton,
  AlertTitle,
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Phone as PhoneIcon,
  Home as HomeIcon,
  Cake as CakeIcon,
  Wc as WcIcon,
  Close as CloseIcon,
} from '@mui/icons-material';

export default function RegisterPatientForm({ onRegistrationComplete }: { onRegistrationComplete: () => void }) {
  const [formData, setFormData] = useState({
    name: '',
    lastName: '',
    middleName: '',
    phone: '',
    address: '',
    gender: '',
    age: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }
    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    }
    if (!formData.middleName.trim()) {
      newErrors.middleName = 'Middle name is required';
    }
    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (!/^\d{10,15}$/.test(formData.phone.replace(/[^0-9]/g, ''))) {
      newErrors.phone = 'Please enter a valid phone number';
    }

    if (!formData.gender) {
      newErrors.gender = 'Gender selection is required';
    }

    if (!formData.age) {
      newErrors.age = 'Age is required';
    } else if (isNaN(Number(formData.age)) || Number(formData.age) < 0 || Number(formData.age) > 120) {
      newErrors.age = 'Please enter a valid age (0-120)';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      setSubmitStatus('error');
      setSubmitError('Please fix the errors in the form.');
      return;
    }

    setSubmitStatus('submitting');
    setSubmitError(null);

    try {
      const res = await fetch('/api/patients/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          age: Number(formData.age),
        }),
      });

      const data = await res.json();
      console.log('Registration response:', data); // Debug log

      if (res.ok) {
        setSubmitStatus('success');
        setShowSuccess(true);
        if (onRegistrationComplete) {
          onRegistrationComplete();
        }
        setTimeout(() => {
          setFormData({
            name: '',
            middleName: '',
            lastName: '',
            phone: '',
            address: '',
            gender: '',
            age: '',
          });
          setSubmitStatus('idle');
          setShowSuccess(false);
          window.location.href = '/receptionist';
        }, 2500);
      } else {
        throw new Error(data.error || 'Registration failed');
      }
    } catch (err: any) {
      console.error('Registration error:', err); // Debug log
      setSubmitStatus('error');
      setSubmitError(err.message || 'An error occurred during registration.');
      setTimeout(() => {
        setSubmitStatus('idle');
        setSubmitError(null);
      }, 3000);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | SelectChangeEvent) => {
    const { name, value } = e.target as { name: string; value: string };

    if (name) {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));

      if (errors[name]) {
        setErrors((prev) => {
          const newErrors = { ...prev };
          delete newErrors[name];
          return newErrors;
        });
      }
    }
  };

  const handleClearField = (fieldName: string) => {
    setFormData((prev) => ({
      ...prev,
      [fieldName]: '',
    }));
  };

  return (
    <Box
      component="form"
      onSubmit={handleSubmit}
    >
      {/* Success Animation */}
      {showSuccess && (
        <Box
          sx={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgba(26, 35, 126, 0.9)',
            zIndex: 2000,
            animation: 'fadeIn 0.3s ease-in-out',
          }}
        >
          <Box
            sx={{
              textAlign: 'center',
              animation: 'bounceIn 0.6s ease-in-out',
            }}
          >
            <CheckCircleIcon sx={{ fontSize: 80, color: '#4caf50', mb: 2 }} />
            <Typography
              variant="h4"
              sx={{ color: 'white', fontWeight: 600, mb: 1 }}
            >
              Success!
            </Typography>
            <Typography
              variant="h6"
              sx={{ color: 'rgba(255, 255, 255, 0.8)' }}
            >
              Patient registered successfully
            </Typography>
          </Box>
        </Box>
      )}

      {/* Error Message */}
      {submitError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          <AlertTitle>Error</AlertTitle>
          {submitError}
        </Alert>
      )}

      {/* Form Fields */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, width: '100%' }}>
  <Box sx={{ display: 'flex', gap: 2 }}>
    <TextField
      fullWidth
      label="First Name *"
      name="name"
      value={formData.name}
      onChange={handleChange}
      error={!!errors.firstName}
      helperText={errors.firstName}
      required
      sx={{
        backgroundColor: '#fff',
        borderRadius: 1,
        '& .MuiOutlinedInput-root': {
          borderRadius: 1,
        },
        flex: 1,
      }}
    />
    <TextField
      fullWidth
      label="Middle Name *"
      name="middleName"
      value={formData.middleName}
      onChange={handleChange}
      error={!!errors.middleName}
      helperText={errors.middleName}
      required
      sx={{
        backgroundColor: '#fff',
        borderRadius: 1,
        '& .MuiOutlinedInput-root': {
          borderRadius: 1,
        },
        flex: 1,
      }}
    />
    <TextField
      fullWidth
      label="Last Name *"
      name="lastName"
      value={formData.lastName}
      onChange={handleChange}
      error={!!errors.lastName}
      helperText={errors.lastName}
      required
      sx={{
        backgroundColor: '#fff',
        borderRadius: 1,
        '& .MuiOutlinedInput-root': {
          borderRadius: 1,
        },
        flex: 1,
      }}
    />
     
  </Box>

  <Box sx={{ display: 'flex', gap: 2 }}>
    <TextField
      fullWidth
      label="What is your age? *"
      name="age"
      type="number"
      value={formData.age}
      onChange={handleChange}
      error={!!errors.age}
      helperText={errors.age}
      required
      sx={{
        backgroundColor: '#fff',
        borderRadius: 1,
        '& .MuiOutlinedInput-root': {
          borderRadius: 1,
        },
        flex: 1,
      }}
    />
    <FormControl fullWidth error={!!errors.gender} sx={{ flex: 1 }}>
      <InputLabel id="gender-label" shrink>What is your gender? *</InputLabel>
      <Select
        labelId="gender-label"
        name="gender"
        value={formData.gender}
        onChange={handleChange}
        label="What is your gender? *"
        displayEmpty
        required
        sx={{
          backgroundColor: '#fff',
          borderRadius: 1,
          '& .MuiOutlinedInput-notchedOutline': {
            borderRadius: 1,
          },
        }}
      >
        <MenuItem value=""><em>Please Select</em></MenuItem>
        <MenuItem value="MALE">Male</MenuItem>
        <MenuItem value="FEMALE">Female</MenuItem>
      </Select>
      {errors.gender && <FormHelperText>{errors.gender}</FormHelperText>}
    </FormControl>
  </Box>

  <TextField
    fullWidth
    label="Phone Number *"
    name="phone"
    value={formData.phone}
    onChange={handleChange}
    error={!!errors.phone}
    helperText={errors.phone}
    required
    sx={{
      backgroundColor: '#fff',
      borderRadius: 1,
      '& .MuiOutlinedInput-root': {
        borderRadius: 1,
      },
    }}
  />

  <TextField
    fullWidth
    label="Address"
    name="address"
    multiline
    rows={3}
    value={formData.address}
    onChange={handleChange}
    sx={{
      backgroundColor: '#fff',
      borderRadius: 1,
      '& .MuiOutlinedInput-root': {
        borderRadius: 1,
      },
    }}
  />
</Box>


      {/* Submit Button */}
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4, pt: 3, borderTop: '1px solid #eee' }}>
        <Button
          type="submit"
          variant="contained"
          disabled={submitStatus === 'submitting'}
          sx={{
            px: 6,
            py: 1.5,
            textTransform: 'none',
            fontWeight: 600,
            fontSize: '1.1rem',
            borderRadius: 3,
            background: 'linear-gradient(45deg, #1a237e 30%, #283593 90%)',
            boxShadow: '0 4px 12px rgba(26, 35, 126, 0.3)',
            '&:hover': {
              background: 'linear-gradient(45deg, #121a55 30%, #1a237e 90%)',
              boxShadow: '0 6px 16px rgba(26, 35, 126, 0.4)',
            },
            '&:disabled': {
              background: 'linear-gradient(45deg, #b0bec5 30%, #cfd8dc 90%)',
            },
          }}
        >
          {submitStatus === 'submitting' ? (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <CircularProgress size={24} color="inherit" />
              Processing...
            </Box>
          ) : submitStatus === 'success' ? (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <CheckCircleIcon />
              Registered!
            </Box>
          ) : submitStatus === 'error' ? (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <ErrorIcon />
              Try Again
            </Box>
          ) : (
            'Register Patient'
          )}
        </Button>
      </Box>
    </Box>
  );
}