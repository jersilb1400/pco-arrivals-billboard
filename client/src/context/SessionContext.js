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
      
      // First check URL parameters for session data (from OAuth redirect)
      const urlParams = new URLSearchParams(window.location.search);
      const sessionParam = urlParams.get('session');
      const tokenParam = urlParams.get('token');
      
      console.log('🔄 SessionContext: URL params check - session:', sessionParam ? 'Present' : 'Not Present', 'token:', tokenParam ? 'Present' : 'Not Present');
      
      if (sessionParam && tokenParam) {
        try {
          const parsedSession = JSON.parse(decodeURIComponent(sessionParam));
          console.log('🔄 SessionContext: Found session data in URL:', parsedSession);
          
          // Store the token for API authentication
          sessionStorage.setItem('pco_auth_token', tokenParam);
          console.log('🔄 SessionContext: Auth token stored in sessionStorage');
          
          // Reset logout flag since user is logging in
          setUserLoggedOut(false);
          
          setSession(parsedSession);
          
          // Clear URL parameters after using them
          const newUrl = window.location.pathname;
          window.history.replaceState({}, document.title, newUrl);
          console.log('🔄 SessionContext: URL parameters cleared');
          
          console.log('🔄 SessionContext: Using URL session data, skipping API call');
          return parsedSession;
        } catch (parseError) {
          console.error('Error parsing URL session data:', parseError);
          // Clear invalid URL parameters
          const newUrl = window.location.pathname;
          window.history.replaceState({}, document.title, newUrl);
        }
      }
      
      // Second check localStorage for session data (fallback)
      let storedSessionData = null;
      try {
        storedSessionData = localStorage.getItem('pco_session_data');
        console.log('🔄 SessionContext: localStorage check - pco_session_data:', storedSessionData ? 'Present' : 'Not Present');
      } catch (localStorageError) {
        console.warn('🔄 SessionContext: localStorage not available:', localStorageError);
      }
      
      if (storedSessionData) {
        try {
          const parsedSession = JSON.parse(storedSessionData);
          console.log('🔄 SessionContext: Found stored session data:', parsedSession);
          setSession(parsedSession);
          // Clear the stored data after using it
          try {
            localStorage.removeItem('pco_session_data');
            localStorage.removeItem('pco_session_token');
          } catch (clearError) {
            console.warn('🔄 SessionContext: Could not clear localStorage:', clearError);
          }
          console.log('🔄 SessionContext: Using stored session data, skipping API call');
          return parsedSession;
        } catch (parseError) {
          console.error('Error parsing stored session data:', parseError);
          try {
            localStorage.removeItem('pco_session_data');
            localStorage.removeItem('pco_session_token');
          } catch (clearError) {
            console.warn('🔄 SessionContext: Could not clear localStorage:', clearError);
          }
        }
      }
      
      console.log('🔄 SessionContext: No session data found, making auth-status request...');
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

  // Add a more frequent check when returning from OAuth callback
  useEffect(() => {
    // Check if we're returning from an OAuth callback (URL might have auth-related params)
    const urlParams = new URLSearchParams(window.location.search);
    const hasAuthParams = urlParams.has('code') || urlParams.has('state') || window.location.pathname.includes('callback');
    
    if (hasAuthParams) {
      console.log('🔄 SessionContext: Detected OAuth callback, checking session more frequently');
      
      // Check session immediately and then every 2 seconds for 10 seconds
      const checkInterval = setInterval(() => {
        checkSession();
      }, 2000);
      
      // Clear interval after 10 seconds
      setTimeout(() => {
        clearInterval(checkInterval);
        console.log('🔄 SessionContext: Stopped frequent OAuth callback checks');
      }, 10000);
      
      return () => clearInterval(checkInterval);
    }
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

  // Enhanced logout function
  const logout = useCallback(async () => {
    try {
      console.log('🚪 SessionContext: Initiating logout...');
      
      // Set logout flag to prevent auto-login
      setUserLoggedOut(true);
      
      // Clear local session state immediately
      setSession({ authenticated: false, user: null });
      
      // Clear auth token from sessionStorage
      try {
        sessionStorage.removeItem('pco_auth_token');
        console.log('🚪 SessionContext: Auth token cleared from sessionStorage');
      } catch (storageError) {
        console.warn('🚪 SessionContext: Could not clear sessionStorage:', storageError);
      }
      
      // Redirect to login page immediately (don't wait for server logout)
      window.location.href = '/login';
      
      // Call server logout in background (don't wait for response)
      fetch('/api/auth/logout', { 
        method: 'GET',
        credentials: 'include'
      }).catch(error => {
        console.warn('🚪 Background logout call failed:', error);
      });
      
    } catch (error) {
      console.error('Logout error:', error);
      // Fallback: clear state and redirect
      setUserLoggedOut(true);
      setSession({ authenticated: false, user: null });
      try {
        sessionStorage.removeItem('pco_auth_token');
      } catch (storageError) {
        console.warn('Could not clear sessionStorage:', storageError);
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