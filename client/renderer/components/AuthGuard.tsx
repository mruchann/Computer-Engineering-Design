import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuthStore } from '../store/useAuthStore';
import { Box, CircularProgress } from '@mui/material';

const PUBLIC_PATHS = ['/login', '/register'];

function isTokenExpired(token: string | null): boolean {
  if (!token) return true;
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.exp * 1000 < Date.now();
  } catch {
    return true;
  }
}

interface AuthGuardProps {
  children: React.ReactNode;
}

export default function AuthGuard({ children }: AuthGuardProps) {
  const { isAuthenticated, isInitialized, accessToken, logout } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    // Check for token expiration
    if (isInitialized && accessToken && isTokenExpired(accessToken)) {
      logout();
      router.replace('/login');
      return;
    }

    if (isInitialized && !isAuthenticated && !PUBLIC_PATHS.includes(router.pathname)) {
      router.replace('/login');
    }
  }, [isAuthenticated, isInitialized, router, accessToken, logout]);

  if (!isInitialized) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return <>{children}</>;
} 