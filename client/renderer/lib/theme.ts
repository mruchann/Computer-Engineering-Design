import { Roboto } from 'next/font/google'
import { createTheme, PaletteMode } from '@mui/material/styles'
import { red } from '@mui/material/colors'

export const roboto = Roboto({
  weight: ['300', '400', '500', '700'],
  subsets: ['latin'],
  display: 'swap',
})

const getDesignTokens = (mode: PaletteMode) => ({
  palette: {
    mode,
    primary: {
      main: '#2196f3',
      light: '#64b5f6',
      dark: '#1976d2',
      contrastText: '#fff',
    },
    secondary: {
      main: '#7c4dff',
      light: '#b47cff',
      dark: '#3f1dcb',
      contrastText: '#fff',
    },
    background: {
      default: mode === 'light' ? '#f8f9fa' : '#0a1929',
      paper: mode === 'light' ? '#ffffff' : '#0a1929',
    },
    text: {
      primary: mode === 'light' ? '#2c3e50' : '#ffffff',
      secondary: mode === 'light' ? '#596877' : '#b2bac2',
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: { fontWeight: 700 },
    h2: { fontWeight: 700 },
    h3: { fontWeight: 600 },
    h4: { fontWeight: 600 },
    h5: { fontWeight: 500 },
    h6: { fontWeight: 500 },
  },
  shape: {
    borderRadius: 12,
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          transition: 'background-color 0.3s ease',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: '8px',
          textTransform: 'none',
          fontWeight: 600,
          padding: '8px 16px',
          transition: 'all 0.2s ease-in-out',
        },
        contained: {
          boxShadow: 'none',
          '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: '0 8px 16px rgba(33, 150, 243, 0.2)',
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          backgroundColor: mode === 'light' ? '#ffffff' : '#1a2027',
          transition: 'background-color 0.3s ease, box-shadow 0.3s ease',
          '&:hover': {
            transform: 'translateY(-4px)',
            boxShadow: mode === 'light'
              ? '0 8px 24px rgba(0, 0, 0, 0.1)'
              : '0 8px 24px rgba(33, 150, 243, 0.15)',
          },
          '&.search-paper': {
            backgroundColor: mode === 'light' 
              ? '#ffffff' 
              : 'rgba(255, 255, 255, 0.03)',
            backdropFilter: 'blur(20px)',
          },
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: mode === 'light' ? '#ffffff' : '#0a1929',
          borderBottom: `1px solid ${mode === 'light' ? 'rgba(0, 0, 0, 0.12)' : 'rgba(255, 255, 255, 0.12)'}`,
          color: mode === 'light' ? '#2c3e50' : '#ffffff',
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          backgroundColor: mode === 'light' ? '#f8f9fa' : '#0a1929',
          borderRight: `1px solid ${mode === 'light' ? 'rgba(0, 0, 0, 0.12)' : 'rgba(255, 255, 255, 0.12)'}`,
          transition: 'background-color 0.3s ease, border-color 0.3s ease',
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            backgroundColor: mode === 'light' 
              ? 'rgba(0, 0, 0, 0.02)' 
              : 'rgba(255, 255, 255, 0.02)',
            '&:hover': {
              backgroundColor: mode === 'light' 
                ? 'rgba(0, 0, 0, 0.04)' 
                : 'rgba(255, 255, 255, 0.04)',
            },
            '&.Mui-focused': {
              backgroundColor: mode === 'light' 
                ? 'rgba(0, 0, 0, 0.06)' 
                : 'rgba(255, 255, 255, 0.06)',
            },
            '& input': {
              color: mode === 'light' ? '#2c3e50' : '#ffffff',
            },
          },
          '& .MuiInputLabel-root': {
            color: mode === 'light' ? '#2c3e50' : '#ffffff',
            opacity: 0.7,
            '&.Mui-focused': {
              opacity: 1,
              color: mode === 'light' ? '#2196f3' : '#90caf9',
            },
          },
          '& .MuiOutlinedInput-notchedOutline': {
            borderColor: mode === 'light' 
              ? 'rgba(0, 0, 0, 0.23)' 
              : 'rgba(255, 255, 255, 0.23)',
          },
          '&:hover .MuiOutlinedInput-notchedOutline': {
            borderColor: mode === 'light' 
              ? 'rgba(0, 0, 0, 0.87)' 
              : 'rgba(255, 255, 255, 0.87)',
          },
        },
      },
    },
    MuiListItem: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          margin: '4px 8px',
          width: 'auto',
          '&:hover': {
            backgroundColor: mode === 'light' 
              ? 'rgba(0, 0, 0, 0.04)' 
              : 'rgba(255, 255, 255, 0.08)',
          },
        },
      },
    },
    MuiListItemIcon: {
      styleOverrides: {
        root: {
          color: mode === 'light' ? '#2c3e50' : '#ffffff',
          minWidth: 40,
        },
      },
    },
    MuiListItemText: {
      styleOverrides: {
        primary: {
          color: mode === 'light' ? '#2c3e50' : '#ffffff',
          fontSize: '0.95rem',
          fontWeight: 500,
        },
      },
    },
    MuiInputBase: {
      styleOverrides: {
        root: {
          color: mode === 'light' ? '#2c3e50' : '#ffffff',
        },
      },
    },
  },
})

export const createAppTheme = (mode: PaletteMode) => createTheme(getDesignTokens(mode))
