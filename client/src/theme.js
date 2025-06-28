import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    primary: {
      main: '#2e77bb', // PCO Blue
      dark: '#1a5fa0',
      light: '#e9f1f9',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#6db56d', // PCO Green
      dark: '#5a9a5a',
      light: '#e8f5e8',
      contrastText: '#ffffff',
    },
    error: {
      main: '#e15241', // PCO Red
      light: '#fde8e6',
    },
    warning: {
      main: '#f9a825', // PCO Yellow
      light: '#fef7e0',
    },
    grey: {
      50: '#f8f9fa', // PCO Gray Lightest
      100: '#eaecf0', // PCO Gray Light
      200: '#d0d5dd', // PCO Border
      500: '#667085', // PCO Gray
      700: '#344054', // PCO Gray Dark
      900: '#101828', // PCO Black
    },
    background: {
      default: '#f8f9fa',
      paper: '#ffffff',
    },
    text: {
      primary: '#101828',
      secondary: '#667085',
    },
  },
  typography: {
    fontFamily: [
      '-apple-system',
      'BlinkMacSystemFont',
      '"Segoe UI"',
      'Roboto',
      'Helvetica',
      'Arial',
      'sans-serif',
      '"Apple Color Emoji"',
      '"Segoe UI Emoji"',
      '"Segoe UI Symbol"',
    ].join(','),
    h1: {
      fontSize: '2rem',
      fontWeight: 600,
      lineHeight: 1.2,
      color: '#101828',
    },
    h2: {
      fontSize: '1.5rem',
      fontWeight: 600,
      lineHeight: 1.3,
      color: '#101828',
    },
    h3: {
      fontSize: '1.25rem',
      fontWeight: 600,
      lineHeight: 1.4,
      color: '#101828',
    },
    h4: {
      fontSize: '1.125rem',
      fontWeight: 600,
      lineHeight: 1.4,
      color: '#101828',
    },
    body1: {
      fontSize: '0.875rem',
      lineHeight: 1.5,
      color: '#667085',
    },
    body2: {
      fontSize: '0.875rem',
      lineHeight: 1.5,
      color: '#667085',
    },
    button: {
      fontSize: '0.875rem',
      fontWeight: 500,
      textTransform: 'none',
    },
  },
  shape: {
    borderRadius: 8,
  },
  spacing: 8,
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          padding: '10px 16px',
          fontSize: '0.875rem',
          fontWeight: 500,
          textTransform: 'none',
          boxShadow: 'none',
          '&:hover': {
            boxShadow: '0px 2px 4px rgba(16, 24, 40, 0.1)',
          },
        },
        contained: {
          '&:hover': {
            boxShadow: '0px 2px 4px rgba(16, 24, 40, 0.1)',
          },
        },
        outlined: {
          borderColor: '#d0d5dd',
          '&:hover': {
            borderColor: '#2e77bb',
            backgroundColor: 'rgba(46, 119, 187, 0.04)',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          boxShadow: '0px 1px 3px rgba(16, 24, 40, 0.1), 0px 1px 2px rgba(16, 24, 40, 0.06)',
          border: '1px solid #d0d5dd',
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 8,
            '& fieldset': {
              borderColor: '#d0d5dd',
            },
            '&:hover fieldset': {
              borderColor: '#2e77bb',
            },
            '&.Mui-focused fieldset': {
              borderColor: '#2e77bb',
            },
          },
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: '#ffffff',
          color: '#101828',
          boxShadow: '0 2px 8px rgba(16, 24, 40, 0.08)',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
        },
      },
    },
  },
});

export default theme; 