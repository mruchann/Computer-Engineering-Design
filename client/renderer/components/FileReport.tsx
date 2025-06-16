import React, { useState } from 'react';
import {
  Box,
  TextField,
  Button,
  Typography,
  Alert,
  CircularProgress,
} from '@mui/material';
import { api } from '../store/useAuthStore';
import { API_ENDPOINTS } from '../constants/api';

interface FileReportProps {
  fileHash: string;
  fileName: string;
}

const FileReport: React.FC<FileReportProps> = ({ fileHash, fileName }) => {
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async () => {
    if (!reason.trim()) {
      setError('Please provide a reason for reporting');
      return;
    }

    setLoading(true);
    setError('');
    try {
      // Create the report directly with the file hash
      const reportResponse = await api.fetch(API_ENDPOINTS.REPORTS, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          file: fileHash, // Use the file_hash directly since it's the primary key
          reason: reason.trim(),
          // reporter will be automatically set by the backend using the authenticated user
        }),
      });

      if (!reportResponse.ok) {
        const errorData = await reportResponse.json();
        console.error('Report submission error:', errorData);
        throw new Error(errorData.detail || 'Failed to submit report');
      }

      const reportData = await reportResponse.json();
      console.log('Report created successfully:', reportData);

      setSuccess(true);
      setReason('');
    } catch (err) {
      console.error('Error submitting report:', err);
      setError(err instanceof Error ? err.message : 'Failed to submit report. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ mt: 2 }}>
      <Typography variant="h6" gutterBottom>
        Report File
      </Typography>
      <Typography variant="body2" color="text.secondary" paragraph>
        You are reporting <strong>{fileName}</strong>. Please provide a reason for your report.
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 2 }}>
          Report submitted successfully. Thank you for helping us maintain a safe environment.
        </Alert>
      )}

      <TextField
        fullWidth
        multiline
        rows={4}
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        placeholder="Please explain why you are reporting this file..."
        variant="outlined"
        sx={{ mb: 2 }}
      />

      <Button
        variant="contained"
        color="error"
        onClick={handleSubmit}
        disabled={loading || success}
        startIcon={loading ? <CircularProgress size={20} /> : null}
      >
        {loading ? 'Submitting...' : success ? 'Report Submitted' : 'Submit Report'}
      </Button>
    </Box>
  );
};

export default FileReport; 