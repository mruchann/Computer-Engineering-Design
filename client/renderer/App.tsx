import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/useAuthStore';
import LoginPage from './components/LoginPage';
import UploadPage from './pages/upload';
import SharedFilesPage from './pages/shared';

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isInitialized } = useAuthStore();

  if (!isInitialized) {
    return null;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/"
        element={
          <PrivateRoute>
            <UploadPage />
          </PrivateRoute>
        }
      />
      <Route
        path="/shared"
        element={
          <PrivateRoute>
            <SharedFilesPage />
          </PrivateRoute>
        }
      />
      {/* Add more routes as needed */}
      <Route
        path="*"
        element={
          <PrivateRoute>
            <Navigate to="/" replace />
          </PrivateRoute>
        }
      />
    </Routes>
  );
} 