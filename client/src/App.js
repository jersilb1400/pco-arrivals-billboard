// src/App.js
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { SessionProvider } from './context/SessionContext';
import Login from './components/Login';
import AdminPanel from './components/AdminPanel';
import AdminUsers from './components/AdminUsers';
import Billboard from './components/Billboard';
import Unauthorized from './components/Unauthorized';
import NotFound from './components/NotFound';
import LocationBillboard from './components/LocationBillboard';
import SecurityCodeEntry from './components/SecurityCodeEntry';
import SimpleBillboard from './components/SimpleBillboard';
import './App.css';

function App() {
  return (
    <SessionProvider>
      <BrowserRouter>
        <Routes>
          {/* Simplified routes (no authentication required) */}
          <Route path="/" element={<SecurityCodeEntry />} />
          <Route path="/billboard" element={<SimpleBillboard />} />
          
          {/* Admin routes (authentication required) */}
          <Route path="/admin" element={<AdminPanel />} />
          <Route path="/admin/users" element={<AdminUsers />} />
          <Route path="/admin/billboard" element={<Billboard />} />
          <Route path="/unauthorized" element={<Unauthorized />} />
          <Route path="/404" element={<NotFound />} />
          <Route path="/location-billboard" element={<LocationBillboard />} />
          <Route path="*" element={<Navigate to="/404" />} />
        </Routes>
      </BrowserRouter>
    </SessionProvider>
  );
}

export default App;