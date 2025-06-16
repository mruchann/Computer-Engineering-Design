import { useState } from 'react';
import { useRouter } from 'next/router';
import { useAuthStore } from '../store/useAuthStore';
import { API_ENDPOINTS } from '../constants/api';
import { 
  Button, 
  TextField, 
  Container, 
  Box, 
  Typography, 
  Paper,
  Alert,
  CircularProgress,
  InputAdornment,
  IconButton,
  useTheme,
  Link,
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  Person as PersonIcon,
  Lock as LockIcon,
} from '@mui/icons-material';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();
  const { login } = useAuthStore();
  const theme = useTheme();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch(API_ENDPOINTS.LOGIN, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Login failed:', {
          status: response.status,
          statusText: response.statusText,
          data: errorData
        });
        throw new Error(errorData.detail || 'Invalid credentials');
      }

      const data = await response.json();
      login({
        access: data.access,
        refresh: data.refresh
      });
      router.replace('/');
    } catch (err) {
      console.error('Login error:', err);
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterClick = () => {
    router.push('/register');
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: theme.palette.mode === 'light'
          ? 'linear-gradient(120deg, #f0f2f5 0%, #e3e8ec 100%)'
          : 'linear-gradient(120deg, #0a1929 0%, #001e3c 100%)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Decorative elements */}
      <Box
        sx={{
          position: 'absolute',
          width: '100%',
          height: '100%',
          opacity: 0.1,
          background: `radial-gradient(circle at 20% 30%, ${theme.palette.primary.main}40 0%, transparent 70%),
                      radial-gradient(circle at 80% 70%, ${theme.palette.secondary.main}40 0%, transparent 70%)`,
        }}
      />

      <Container component="main" maxWidth="xs">
        <Paper
          elevation={24}
          sx={{
            p: 4,
            backdropFilter: 'blur(20px)',
            backgroundColor: theme.palette.mode === 'light'
              ? 'rgba(255, 255, 255, 0.9)'
              : 'rgba(255, 255, 255, 0.05)',
            border: '1px solid',
            borderColor: theme.palette.mode === 'light'
              ? 'rgba(255, 255, 255, 0.7)'
              : 'rgba(255, 255, 255, 0.1)',
            borderRadius: 3,
            transition: 'transform 0.2s ease-in-out',
            '&:hover': {
              transform: 'scale(1.02)',
            },
          }}
        >
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
            }}
          >
            {/* Logo/Brand */}
            <Box
              sx={{
                mb: 3,
                p: 2,
                borderRadius: '50%',
                backgroundColor: theme.palette.mode === 'light'
                  ? 'rgba(33, 150, 243, 0.1)'
                  : 'rgba(33, 150, 243, 0.2)',
              }}
            >
              <Typography
                variant="h4"
                sx={{
                  fontWeight: 'bold',
                  background: 'linear-gradient(45deg, #2196f3 30%, #7c4dff 90%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  letterSpacing: '0.5px',
                }}
              >
                PeerLink
              </Typography>
            </Box>

            <Typography variant="h5" gutterBottom sx={{ color: theme.palette.text.primary }}>
              Welcome Back
            </Typography>
            <Typography 
              variant="body2" 
              sx={{ 
                mb: 3, 
                color: theme.palette.text.secondary,
                textAlign: 'center',
              }}
            >
              Sign in to access your files and continue sharing
            </Typography>

            {error && (
              <Alert 
                severity="error" 
                sx={{ 
                  mb: 2, 
                  width: '100%',
                  backgroundColor: 'rgba(211, 47, 47, 0.1)',
                }}
              >
                {error}
              </Alert>
            )}

            <Box component="form" onSubmit={handleSubmit} noValidate sx={{ mt: 1, width: '100%' }}>
              <TextField
                margin="normal"
                required
                fullWidth
                id="username"
                label="Username"
                name="username"
                autoComplete="username"
                autoFocus
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <PersonIcon sx={{ color: theme.palette.text.secondary }} />
                    </InputAdornment>
                  ),
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    '& fieldset': {
                      borderColor: theme.palette.mode === 'light'
                        ? 'rgba(0, 0, 0, 0.23)'
                        : 'rgba(255, 255, 255, 0.23)',
                    },
                    '&:hover fieldset': {
                      borderColor: theme.palette.mode === 'light'
                        ? 'rgba(0, 0, 0, 0.87)'
                        : 'rgba(255, 255, 255, 0.87)',
                    },
                  },
                  '& .MuiInputLabel-root': {
                    color: theme.palette.text.secondary,
                  },
                  '& .MuiInputBase-input': {
                    color: theme.palette.text.primary,
                  },
                }}
              />
              <TextField
                margin="normal"
                required
                fullWidth
                name="password"
                label="Password"
                type={showPassword ? 'text' : 'password'}
                id="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <LockIcon sx={{ color: theme.palette.text.secondary }} />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        aria-label="toggle password visibility"
                        onClick={() => setShowPassword(!showPassword)}
                        edge="end"
                        sx={{ color: theme.palette.text.secondary }}
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    '& fieldset': {
                      borderColor: theme.palette.mode === 'light'
                        ? 'rgba(0, 0, 0, 0.23)'
                        : 'rgba(255, 255, 255, 0.23)',
                    },
                    '&:hover fieldset': {
                      borderColor: theme.palette.mode === 'light'
                        ? 'rgba(0, 0, 0, 0.87)'
                        : 'rgba(255, 255, 255, 0.87)',
                    },
                  },
                  '& .MuiInputLabel-root': {
                    color: theme.palette.text.secondary,
                  },
                  '& .MuiInputBase-input': {
                    color: theme.palette.text.primary,
                  },
                }}
              />

              <Button
                type="submit"
                fullWidth
                variant="contained"
                sx={{
                  mt: 3,
                  mb: 2,
                  py: 1.5,
                  fontSize: '1rem',
                  background: 'linear-gradient(45deg, #2196f3 30%, #7c4dff 90%)',
                  '&:hover': {
                    background: 'linear-gradient(45deg, #1976d2 30%, #6c3fff 90%)',
                    transform: 'translateY(-2px)',
                    boxShadow: '0 8px 16px rgba(33, 150, 243, 0.2)',
                  },
                }}
                disabled={loading}
              >
                {loading ? <CircularProgress size={24} /> : 'Sign In'}
              </Button>

              <Box sx={{ 
                mt: 2, 
                display: 'flex', 
                justifyContent: 'center',
                gap: 1,
                color: theme.palette.text.secondary,
              }}>
              </Box>

              <Box sx={{ 
                mt: 2, 
                display: 'flex', 
                justifyContent: 'center',
                gap: 1,
                color: theme.palette.text.secondary,
              }}>
                <Typography variant="body2">
                  Don't have an account?{' '}
                  <Link
                    onClick={handleRegisterClick}
                    component="button"
                    sx={{
                      color: theme.palette.primary.main,
                      textDecoration: 'none',
                      cursor: 'pointer',
                      border: 'none',
                      background: 'none',
                      padding: 0,
                      '&:hover': {
                        textDecoration: 'underline',
                      },
                    }}
                  >
                    Register now
                  </Link>
                </Typography>
              </Box>
            </Box>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
} 