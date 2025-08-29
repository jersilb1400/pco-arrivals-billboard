import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../utils/api';

const SessionContext = createContext();

export function SessionProvider({ children }) {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [eventTimes, setEventTimes] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState('');
  const [selectedEventTime, setSelectedEventTime] = useState('');
  const [userLoggedOut, setUserLoggedOut] = useState(false);

  const checkSession = useCallback(async () => {
    try {
      console.log('🔄 SessionContext: Starting session check...');
      
      // Check if we have API key and user ID in localStorage
      const apiKey = localStorage.getItem('pco_api_key');
      const userId = localStorage.getItem('pco_user_id');
      
      console.log('🔄 SessionContext: localStorage check - apiKey:', apiKey ? 'Present' : 'Not Present', 'userId:', userId ? 'Present' : 'Not Present');
      
      if (!apiKey || !userId) {
        console.log('🔄 SessionContext: No authentication data found');
        const errorSession = { authenticated: false };
        setSession(errorSession);
        return errorSession;
      }
      
      console.log('🔄 SessionContext: Making auth-status request...');
      const response = await api.get('/auth-status');
      console.log('🔄 SessionContext: Received response:', response.data);
      const newSession = response.data;
      setSession(newSession);
      console.log('🔄 SessionContext: Session state updated:', newSession);
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
      // Skip session checks if user explicitly logged out
      if (userLoggedOut) {
        console.log('🔄 Skipping session check - user explicitly logged out');
        return;
      }
      
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
  }, [checkSession, session?.authenticated, userLoggedOut]);

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

  // Simple logout function
  const logout = useCallback(async () => {
    try {
      console.log('🚪 SessionContext: Initiating logout...');
      
      // Set logout flag to prevent auto-login
      setUserLoggedOut(true);
      
      // Clear local session state immediately
      setSession({ authenticated: false, user: null });
      
      // Clear authentication data from localStorage
      try {
        localStorage.removeItem('pco_api_key');
        localStorage.removeItem('pco_user_id');
        console.log('🚪 SessionContext: Authentication data cleared from localStorage');
      } catch (storageError) {
        console.warn('🚪 SessionContext: Could not clear localStorage:', storageError);
      }
      
      // Redirect to login page immediately
      window.location.href = '/login';
      
    } catch (error) {
      console.error('Logout error:', error);
      // Fallback: clear state and redirect
      setUserLoggedOut(true);
      setSession({ authenticated: false, user: null });
      try {
        localStorage.removeItem('pco_api_key');
        localStorage.removeItem('pco_user_id');
      } catch (storageError) {
        console.warn('Could not clear localStorage:', storageError);
      }
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