'use client';

import React, { createContext, useState, useContext } from 'react';
import { Snackbar, Alert } from '@mui/material';

// Create a context for the notification system
const NotificationContext = createContext({
  showNotification: () => {},
  hideNotification: () => {},
});

/**
 * NotificationProvider component that wraps the application to provide notification functionality
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Child components
 */
export function NotificationProvider({ children }) {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [severity, setSeverity] = useState('info');
  const [autoHideDuration, setAutoHideDuration] = useState(6000);

  /**
   * Show a notification with the given message and severity
   * @param {string} message - The message to display
   * @param {string} severity - The severity level (info, success, warning, error)
   * @param {number} duration - Duration in milliseconds before auto-hiding
   */
  const showNotification = (message, severity = 'info', duration = 6000) => {
    setMessage(message);
    setSeverity(severity);
    setAutoHideDuration(duration);
    setOpen(true);
  };

  /**
   * Hide the currently visible notification
   */
  const hideNotification = () => {
    setOpen(false);
  };

  /**
   * Handle closing the notification
   * @param {Event} event - The event that triggered the close
   * @param {string} reason - The reason for closing
   */
  const handleClose = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    hideNotification();
  };

  return (
    <NotificationContext.Provider value={{ showNotification, hideNotification }}>
      {children}
      <Snackbar
        open={open}
        autoHideDuration={autoHideDuration}
        onClose={handleClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={handleClose} 
          severity={severity} 
          sx={{ width: '100%' }}
          variant="filled"
        >
          {message}
        </Alert>
      </Snackbar>
    </NotificationContext.Provider>
  );
}

/**
 * Custom hook to use the notification system in any component
 * @returns {Object} The notification context with showNotification and hideNotification methods
 */
export function useNotification() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
}