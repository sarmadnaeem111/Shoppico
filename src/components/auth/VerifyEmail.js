import React, { useState, useEffect } from 'react';
import { Card, Button, Alert, Container, Spinner } from 'react-bootstrap';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { sanitizeInput } from '../../utils/security';

const VerifyEmail = () => {
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const { currentUser, verifyEmail, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  useEffect(() => {
    // Check if there's an oobCode in the URL (from email link)
    const queryParams = new URLSearchParams(location.search);
    const oobCode = queryParams.get('oobCode');
    
    if (oobCode) {
      handleVerifyEmail(oobCode);
    }
  }, [location]);
  
  const handleVerifyEmail = async (oobCode) => {
    if (!oobCode) return;
    
    setVerifying(true);
    setError('');
    
    try {
      // Sanitize the oobCode to prevent XSS
      const sanitizedCode = sanitizeInput(oobCode);
      await verifyEmail(sanitizedCode);
      setMessage('Email verified successfully! You can now log in.');
      
      // If user is already logged in, update their session
      if (currentUser) {
        setTimeout(() => {
          navigate('/profile');
        }, 2000);
      } else {
        setTimeout(() => {
          navigate('/login');
        }, 2000);
      }
    } catch (error) {
      console.error('Verification error:', error);
      setError('Failed to verify email. The link may be invalid or expired.');
    } finally {
      setVerifying(false);
    }
  };
  
  const handleSendVerificationEmail = async () => {
    setLoading(true);
    setError('');
    setMessage('');
    
    try {
      await verifyEmail();
      setMessage('Verification email sent! Please check your inbox.');
    } catch (error) {
      setError('Failed to send verification email. Please try again later.');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <Container className="d-flex align-items-center justify-content-center" style={{ minHeight: '80vh' }}>
      <div className="w-100" style={{ maxWidth: '400px' }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Card className="shadow">
            <Card.Body>
              <h2 className="text-center mb-4">Email Verification</h2>
              
              {error && <Alert variant="danger">{error}</Alert>}
              {message && <Alert variant="success">{message}</Alert>}
              
              {verifying ? (
                <div className="text-center my-4">
                  <Spinner animation="border" variant="primary" />
                  <p className="mt-3">Verifying your email...</p>
                </div>
              ) : (
                <>
                  {!message && (
                    <div className="text-center">
                      <p>
                        Please verify your email address to complete your registration and access all features.
                      </p>
                      
                      {currentUser && !currentUser.emailVerified && (
                        <Button 
                          className="w-100 mb-3" 
                          onClick={handleSendVerificationEmail}
                          disabled={loading}
                        >
                          {loading ? 'Sending...' : 'Send Verification Email'}
                        </Button>
                      )}
                      
                      <div className="text-center mt-3">
                        <Button 
                          variant="link" 
                          onClick={() => navigate('/login')}
                        >
                          Back to Login
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </Card.Body>
          </Card>
          
          <div className="w-100 text-center mt-2">
            <small className="text-muted">
              Secured with advanced verification protocols
            </small>
          </div>
        </motion.div>
      </div>
    </Container>
  );
};

export default VerifyEmail;