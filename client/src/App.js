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
import './App.css';

function App() {
  return (
    <SessionProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/admin" element={<AdminPanel />} />
          <Route path="/admin/users" element={<AdminUsers />} />
          <Route path="/billboard" element={<Billboard />} />
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