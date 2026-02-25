import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#3d8a99', // Grace teal (from website header)
      dark: '#2d6e7c',
      light: '#b8dce5',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#c98b73', // Grace terracotta (from website footer)
      dark: '#a86b54',
      light: '#e8c4b0',
      contrastText: '#ffffff',
    },
    error: {
      main: '#ef4444',
      light: '#fca5a5',
    },
    warning: {
      main: '#c98b73',
      light: '#e8c4b0',
    },
    grey: {
      50: '#f4fafb',
      100: '#e8f4f7',
      200: '#d0e8ed',
      500: '#7aaab8',
      700: '#4a7080',
      900: '#1a3040',
    },
    background: {
      default: '#f4fafb',
      paper: '#ffffff',
    },
    text: {
      primary: '#1a3040',
      secondary: '#4a7080',
    },
    divider: '#d0e8ed',
  },
  typography: {
    fontFamily: [
      'Outfit',
      '-apple-system',
      'BlinkMacSystemFont',
      '"Segoe UI"',
      'sans-serif',
    ].join(','),
    h1: {
      fontSize: '2rem',
      fontWeight: 700,
      lineHeight: 1.2,
    },
    h2: {
      fontSize: '1.5rem',
      fontWeight: 600,
      lineHeight: 1.3,
    },
    h3: {
      fontSize: '1.25rem',
      fontWeight: 600,
      lineHeight: 1.4,
    },
    h4: {
      fontSize: '1.125rem',
      fontWeight: 600,
      lineHeight: 1.4,
    },
    body1: {
      fontSize: '0.875rem',
      lineHeight: 1.5,
    },
    body2: {
      fontSize: '0.875rem',
      lineHeight: 1.5,
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
            boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.15)',
          },
        },
        contained: {
          '&:hover': {
            boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.15)',
          },
        },
        outlined: {
          borderColor: '#d0e8ed',
          '&:hover': {
            borderColor: '#3d8a99',
            backgroundColor: 'rgba(61, 138, 153, 0.08)',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.08), 0px 1px 2px rgba(0, 0, 0, 0.06)',
          border: '1px solid #d0e8ed',
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 8,
            '& fieldset': {
              borderColor: '#d0e8ed',
            },
            '&:hover fieldset': {
              borderColor: '#3d8a99',
            },
            '&.Mui-focused fieldset': {
              borderColor: '#3d8a99',
            },
          },
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: '#ffffff',
          color: '#1a3040',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
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
