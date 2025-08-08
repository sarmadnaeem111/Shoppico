import React from 'react';
import { Alert } from 'react-bootstrap';

const ErrorAlert = ({ error, onClose, dismissible = true, variant = 'danger' }) => {
  if (!error) return null;

  // Handle different error formats
  let errorMessage = '';
  if (typeof error === 'string') {
    errorMessage = error;
  } else if (error.message) {
    errorMessage = error.message;
  } else if (error.code) {
    // Firebase error codes
    switch (error.code) {
      case 'auth/user-not-found':
      case 'auth/wrong-password':
        errorMessage = 'Invalid email or password';
        break;
      case 'auth/email-already-in-use':
        errorMessage = 'Email is already in use';
        break;
      case 'auth/weak-password':
        errorMessage = 'Password is too weak';
        break;
      case 'auth/invalid-email':
        errorMessage = 'Invalid email address';
        break;
      case 'auth/requires-recent-login':
        errorMessage = 'This operation requires recent authentication. Please log in again.';
        break;
      default:
        errorMessage = error.code.replace('auth/', '').replace(/-/g, ' ');
    }
  } else {
    errorMessage = 'An unknown error occurred';
  }

  return (
    <Alert 
      variant={variant} 
      dismissible={dismissible} 
      onClose={onClose}
      className="animate__animated animate__fadeIn"
    >
      <Alert.Heading>Error</Alert.Heading>
      <p className="mb-0">{errorMessage}</p>
    </Alert>
  );
};

export default ErrorAlert;