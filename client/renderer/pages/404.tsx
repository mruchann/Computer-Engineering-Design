import { Box, Button, Typography } from '@mui/material';
import { useRouter } from 'next/router';

export default function Custom404() {
  const router = useRouter();

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        textAlign: 'center',
        p: 3
      }}
    >
      <Typography variant="h1" component="h1" gutterBottom>
        404
      </Typography>
      <Typography variant="h4" component="h2" gutterBottom>
        Page Not Found
      </Typography>
      <Typography variant="body1" sx={{ mb: 4 }}>
        The page you're looking for doesn't exist.
      </Typography>
      <Button 
        variant="contained" 
        onClick={() => router.push('/dashboard')}
        sx={{
          mt: 2
        }}
      >
        Go to Dashboard
      </Button>
    </Box>
  );
}
