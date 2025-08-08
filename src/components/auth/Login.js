import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Form, Button, Card, Alert, Container, Row, Col } from 'react-bootstrap';
import { useAuth } from '../../contexts/AuthContext';
import { motion } from 'framer-motion';
import { sanitizeInput, detectSuspiciousBehavior } from '../../utils/security';
import { FcGoogle } from 'react-icons/fc';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [loginAttempts, setLoginAttempts] = useState(0);
  const [message, setMessage] = useState('');
  const [googleLoading, setGoogleLoading] = useState(false);
  const { login, signInWithGoogle } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Check for message in location state
  useEffect(() => {
    if (location.state && location.state.message) {
      setMessage(location.state.message);
    }
  }, [location]);

  // Monitor for suspicious behavior
  useEffect(() => {
    const handleSuspiciousActivity = (e) => {
      if (detectSuspiciousBehavior(e)) {
        setError('Suspicious activity detected. Please slow down.');
      }
    };
    
    document.addEventListener('click', handleSuspiciousActivity);
    document.addEventListener('submit', handleSuspiciousActivity);
    
    return () => {
      document.removeEventListener('click', handleSuspiciousActivity);
      document.removeEventListener('submit', handleSuspiciousActivity);
    };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Prevent rapid-fire login attempts
    if (loginAttempts > 10) {
      setError('Too many login attempts. Please try again later.');
      return;
    }
    
    try {
      setError('');
      setLoading(true);
      setLoginAttempts(prev => prev + 1);
      
      // Sanitize inputs to prevent XSS
      const sanitizedEmail = sanitizeInput(email.trim());
      
      await login(sanitizedEmail, password);
      navigate('/');
    } catch (error) {
      setError('Failed to sign in: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      setError('');
      setGoogleLoading(true);
      await signInWithGoogle();
      navigate('/');
    } catch (error) {
      setError('Failed to sign in with Google: ' + error.message);
    } finally {
      setGoogleLoading(false);
    }
  };
  
  const togglePasswordVisibility = () => {
    setPasswordVisible(!passwordVisible);
  };

  return (
    <>
      {error && <Alert variant="danger">{error}</Alert>}
      {message && <Alert variant="info">{message}</Alert>}
      <Form onSubmit={handleSubmit}>
        <Form.Group id="email" className="mb-3">
          <Form.Label>Email</Form.Label>
          <Form.Control 
            type="email" 
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required 
          />
        </Form.Group>
        <Form.Group id="password" className="mb-3">
          <Form.Label>Password</Form.Label>
          <div className="input-group">
            <Form.Control 
              type={passwordVisible ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required 
              aria-describedby="password-toggle"
            />
            <Button 
              variant="outline-secondary" 
              id="password-toggle"
                        onClick={togglePasswordVisibility}
                        type="button"
                      >
                        {passwordVisible ? "Hide" : "Show"}
                      </Button>
                    </div>
                  </Form.Group>
                  <Button 
                    disabled={loading} 
                    className="w-100 mt-3" 
                    type="submit"
                  >
                    {loading ? 'Logging in...' : 'Login'}
                  </Button>
                  
                  <div className="d-flex align-items-center my-3">
                    <hr className="flex-grow-1" />
                    <span className="mx-2 text-muted">OR</span>
                    <hr className="flex-grow-1" />
                  </div>
                  
                  <Button 
                    variant="outline-secondary"
                    className="w-100 d-flex align-items-center justify-content-center"
                    onClick={handleGoogleSignIn}
                    disabled={googleLoading || loading}
                  >
                    <FcGoogle size={20} className="me-2" />
                    {googleLoading ? 'Connecting...' : 'Sign in with Google'}
                  </Button>
                  
                  <div className="mt-3 text-center">
                    <small className="text-muted">This site is protected by security measures including CSRF protection and rate limiting.</small>
                  </div>
                </Form>
    </>
  );
};

export default Login;