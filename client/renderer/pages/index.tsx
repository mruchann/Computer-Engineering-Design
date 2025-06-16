import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuthStore } from '../store/useAuthStore';
import LoginPage from '../components/LoginPage';
import { Box, CircularProgress } from '@mui/material';

export default function IndexPage() {
  const { isAuthenticated, isInitialized, accessToken, refreshToken } = useAuthStore();
  const router = useRouter();

  // Don't show login page if we're on the register page
  if (router.pathname === '/register') {
    return null;
  }

  useEffect(() => {
    // Only redirect to dashboard if we're on the login page
    if (isInitialized && isAuthenticated && router.pathname === '/') {
        window.electron.ipcRenderer.send('auth:token-updated', accessToken);
        window.electron.ipcRenderer.send('auth:refresh-token-updated', refreshToken);
        window.electron.ipcRenderer.send('shared-join');
        window.electron.ipcRenderer.send('connect-websocket');
        router.replace('/dashboard');
    }
  }, [isInitialized, isAuthenticated, router, router.pathname]);

  // Show loading state while initializing
  if (!isInitialized) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '100vh',
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  // Show login page if not authenticated
  if (!isAuthenticated) {
    return <LoginPage />;
  }

  // Show loading while redirecting to dashboard
  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
      }}
    >
      <CircularProgress />
    </Box>
  );
}
