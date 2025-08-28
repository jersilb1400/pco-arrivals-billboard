import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../utils/api';

const SessionContext = createContext();

export function SessionProvider({ children }) {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [eventTimes, setEventTimes] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState('');
  const [selectedEventTime, setSelectedEventTime] = useState('');

  const checkSession = useCallback(async () => {
    try {
      const response = await api.get('/auth-status');
      const newSession = response.data;
      setSession(newSession);
      return newSession;
    } catch (error) {
      console.error('Session check failed:', error);
      const errorSession = { authenticated: false };
      setSession(errorSession);
      return errorSession;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkSession();
  }, [checkSession]);

  // Set up periodic session checks to detect when users log in/out independently
  useEffect(() => {
    const intervalId = setInterval(async () => {
      try {
        const currentSession = await checkSession();
        
        // If authentication status changed, trigger a refresh
        if (currentSession.authenticated !== session?.authenticated) {
          console.log('🔄 Authentication status changed:', {
            was: session?.authenticated,
            now: currentSession.authenticated,
            user: currentSession.user?.name || 'No user'
          });
          
          // Force a page refresh if user was logged out
          if (session?.authenticated && !currentSession.authenticated) {
            console.log('🚪 User logged out, refreshing page...');
            window.location.reload();
          }
        }
      } catch (error) {
        console.error('Session check error:', error);
        // If session check fails, assume user is logged out
        if (session?.authenticated) {
          console.log('🚪 Session check failed, assuming logout...');
          setSession({ authenticated: false, user: null });
        }
      }
    }, 120000); // Increased from 60 seconds to 120 seconds (2 minutes) to reduce API calls further
    
    return () => clearInterval(intervalId);
  }, [checkSession, session?.authenticated]);

  useEffect(() => {
    if (selectedEvent) {
      api.get(`/api/events/${selectedEvent}/event-times`)
        .then(res => {
          console.log('Fetched Events:');
          res.data.forEach(event => {
            console.log(`ID: ${event.id}, Name: ${event.attributes.name}`);
            console.log('Event object:', event);
          });
          setEventTimes(res.data);
        })
        .catch(() => setEventTimes([]));
    } else {
      setEventTimes([]);
      setSelectedEventTime('');
    }
  }, [selectedEvent]);

  // Enhanced logout function
  const logout = useCallback(async () => {
    try {
      console.log('🚪 SessionContext: Initiating logout...');
      
      // Clear local session state immediately
      setSession({ authenticated: false, user: null });
      
      // Call logout endpoint
      const redirectTo = `${window.location.origin}/login`;
      window.location.href = `/api/auth/logout?redirectTo=${encodeURIComponent(redirectTo)}`;
    } catch (error) {
      console.error('Logout error:', error);
      // Fallback: clear state and redirect
      setSession({ authenticated: false, user: null });
      window.location.href = '/login';
    }
  }, []);

  const value = {
    session,
    setSession,
    loading,
    eventTimes,
    setEventTimes,
    selectedEvent,
    setSelectedEvent,
    selectedEventTime,
    setSelectedEventTime,
    checkSession, // Expose the checkSession function for components to use
    logout // Expose the logout function for components to use
  };

  return (
    <SessionContext.Provider value={value}>
      {children}
    </SessionContext.Provider>
  );
}

export function useSession() {
  const context = useContext(SessionContext);
  if (context === undefined) {
    throw new Error('useSession must be used within a SessionProvider');
  }
  return context;
} 