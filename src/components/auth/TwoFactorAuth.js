import React, { useState, useEffect } from 'react';
import { Card, Form, Button, Alert, Container, Row, Col } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { sanitizeInput } from '../../utils/security';
import { motion } from 'framer-motion';

const TwoFactorAuth = () => {
  const [verificationCode, setVerificationCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(300); // 5 minutes in seconds
  const { currentUser, verifyTwoFactorCode, resendTwoFactorCode } = useAuth();
  const navigate = useNavigate();

  // Redirect if no user is logged in
  useEffect(() => {
    if (!currentUser || !currentUser.email) {
      navigate('/login');
    }
  }, [currentUser, navigate]);

  // Countdown timer
  useEffect(() => {
    if (countdown <= 0) return;
    
    const timer = setInterval(() => {
      setCountdown(prev => prev - 1);
    }, 1000);
    
    return () => clearInterval(timer);
  }, [countdown]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!verificationCode || verificationCode.length !== 6) {
      return setError('Please enter a valid 6-digit verification code');
    }
    
    try {
      setError('');
      setLoading(true);
      
      // Sanitize input
      const sanitizedCode = sanitizeInput(verificationCode.trim());
      
      await verifyTwoFactorCode(sanitizedCode);
      navigate('/');
    } catch (error) {
      setError('Invalid verification code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    try {
      setError('');
      await resendTwoFactorCode();
      setCountdown(300); // Reset countdown to 5 minutes
    } catch (error) {
      setError('Failed to resend verification code. Please try again later.');
    }
  };

  return (
    <Container className="d-flex align-items-center justify-content-center" style={{ minHeight: '80vh' }}>
      <Row className="w-100">
        <Col md={6} className="mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Card className="shadow">
              <Card.Body>
                <h2 className="text-center mb-4">Two-Factor Authentication</h2>
                {error && <Alert variant="danger">{error}</Alert>}
                <Alert variant="info">
                  A verification code has been sent to your email address. Please enter the code below to complete the login process.
                </Alert>
                <Form onSubmit={handleSubmit}>
                  <Form.Group id="verification-code" className="mb-3">
                    <Form.Label>Verification Code</Form.Label>
                    <Form.Control 
                      type="text" 
                      value={verificationCode}
                      onChange={(e) => setVerificationCode(e.target.value.replace(/[^0-9]/g, '').substring(0, 6))}
                      placeholder="Enter 6-digit code"
                      required 
                      maxLength={6}
                      pattern="[0-9]{6}"
                    />
                  </Form.Group>
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <small className="text-muted">
                      Code expires in: {formatTime(countdown)}
                    </small>
                    <Button 
                      variant="link" 
                      onClick={handleResendCode} 
                      disabled={countdown > 0 && countdown < 270} // Disable for 30 seconds after sending
                      className="p-0"
                    >
                      Resend Code
                    </Button>
                  </div>
                  <Button 
                    disabled={loading} 
                    className="w-100 mt-3" 
                    type="submit"
                  >
                    {loading ? 'Verifying...' : 'Verify'}
                  </Button>
                </Form>
              </Card.Body>
              <Card.Footer className="text-center">
                <small className="text-muted">
                  This additional security step helps protect your account from unauthorized access.
                </small>
              </Card.Footer>
            </Card>
          </motion.div>
        </Col>
      </Row>
    </Container>
  );
};

export default TwoFactorAuth;