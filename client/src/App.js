// src/App.js
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { SessionProvider } from './context/SessionContext';
import theme from './theme';
import Login from './components/Login';
import ProtectedRoute from './components/ProtectedRoute';
import AdminPanel from './components/AdminPanel';
import AdminUsers from './components/AdminUsers';
import Unauthorized from './components/Unauthorized';
import NotFound from './components/NotFound';
import LocationStatus from './components/LocationStatus';
import SecurityCodeEntry from './components/SecurityCodeEntry';
import SimpleBillboard from './components/SimpleBillboard';
import './App.css';

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <SessionProvider>
        <BrowserRouter>
          <Routes>
            {/* Public routes (no authentication required) */}
            <Route path="/" element={<SecurityCodeEntry />} />
            <Route path="/billboard" element={<SimpleBillboard />} />
            <Route path="/location-status" element={<LocationStatus />} />
            <Route path="/login" element={<Login />} />
            
            {/* Protected admin routes (authentication required) */}
            <Route path="/admin" element={
              <ProtectedRoute requireAdmin={true}>
                <AdminPanel />
              </ProtectedRoute>
            } />
            <Route path="/admin/users" element={
              <ProtectedRoute requireAdmin={true}>
                <AdminUsers />
              </ProtectedRoute>
            } />
            
            {/* Other routes */}
            <Route path="/unauthorized" element={<Unauthorized />} />
            <Route path="/404" element={<NotFound />} />
            <Route path="*" element={<Navigate to="/404" />} />
          </Routes>
        </BrowserRouter>
      </SessionProvider>
    </ThemeProvider>
  );
}

export default App;