import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

// Route that requires authentication
export function PrivateRoute({ children }) {
  const { currentUser, loading } = useAuth();
  
  if (loading) return <div>Loading...</div>;
  
  return currentUser ? children : <Navigate to="/login" />;
}

// Route that requires admin role
export function AdminRoute({ children }) {
  const { currentUser, isAdmin, loading } = useAuth();
  
  if (loading) return <div>Loading...</div>;
  
  return currentUser && isAdmin ? 
    children : 
    <Navigate to={currentUser ? "/unauthorized" : "/login"} />;
}

// Route that requires customer role
export function CustomerRoute({ children }) {
  const { currentUser, isCustomer, loading } = useAuth();
  
  if (loading) return <div>Loading...</div>;
  
  return currentUser && isCustomer ? 
    children : 
    <Navigate to={currentUser ? "/unauthorized" : "/login"} />;
}

// Route accessible only to non-authenticated users
export function PublicRoute({ children }) {
  const { currentUser, loading } = useAuth();
  
  if (loading) return <div>Loading...</div>;
  
  return !currentUser ? children : <Navigate to="/" />;
}