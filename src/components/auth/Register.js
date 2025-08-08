import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Form, Button, Card, Alert, Container, Row, Col, ProgressBar } from 'react-bootstrap';
import { useAuth } from '../../contexts/AuthContext';
import { motion } from 'framer-motion';
import { sanitizeInput, checkPasswordStrength, detectSuspiciousBehavior } from '../../utils/security';
import { FcGoogle } from 'react-icons/fc';

const Register = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState({ score: 0, feedback: '' });
  const [googleLoading, setGoogleLoading] = useState(false);
  const { signup, signInWithGoogle } = useAuth();
  const navigate = useNavigate();

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

  // Check password strength when password changes
  useEffect(() => {
    if (password) {
      const strength = checkPasswordStrength(password);
      setPasswordStrength(strength);
    } else {
      setPasswordStrength({ score: 0, feedback: '' });
    }
  }, [password]);

  const togglePasswordVisibility = () => {
    setPasswordVisible(!passwordVisible);
  };

  const handleGoogleSignIn = async () => {
    try {
      setError('');
      setGoogleLoading(true);
      await signInWithGoogle();
      navigate('/');
    } catch (error) {
      setError('Failed to sign up with Google: ' + error.message);
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Sanitize inputs
    const sanitizedName = sanitizeInput(name.trim());
    const sanitizedEmail = sanitizeInput(email.trim());
    
    // Validate form
    if (password !== confirmPassword) {
      return setError('Passwords do not match');
    }
    
    // Check password strength
    const strength = checkPasswordStrength(password);
    if (strength.score < 2) {
      return setError(`Password is too weak: ${strength.feedback}`);
    }
    
    try {
      setError('');
      setLoading(true);
      await signup(sanitizedEmail, password, sanitizedName);
      navigate('/');
    } catch (error) {
      setError('Failed to create an account: ' + error.message);
    } finally {
      setLoading(false);
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
                <h2 className="text-center mb-4">Create Account</h2>
                <p className="text-center text-muted mb-4">Join our e-commerce platform today</p>
                {error && <Alert variant="danger">{error}</Alert>}
                <Form onSubmit={handleSubmit}>
                  <Form.Group id="name" className="mb-3">
                    <Form.Label>Full Name</Form.Label>
                    <Form.Control 
                      type="text" 
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required 
                    />
                  </Form.Group>
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
                    {password && (
                      <div className="mt-2">
                        <ProgressBar 
                          now={passwordStrength.score * 25} 
                          variant={passwordStrength.score < 2 ? 'danger' : passwordStrength.score < 3 ? 'warning' : 'success'} 
                        />
                        <small className={`d-block mt-1 text-${passwordStrength.score < 2 ? 'danger' : passwordStrength.score < 3 ? 'warning' : 'success'}`}>
                          {passwordStrength.feedback || (passwordStrength.score >= 3 ? 'Strong password' : 'Moderate password')}
                        </small>
                      </div>
                    )}
                  </Form.Group>
                  <Form.Group id="password-confirm" className="mb-3">
                    <Form.Label>Confirm Password</Form.Label>
                    <div className="input-group">
                      <Form.Control 
                        type={passwordVisible ? "text" : "password"}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required 
                      />
                    </div>
                    {password && confirmPassword && password !== confirmPassword && (
                      <small className="text-danger mt-1">Passwords do not match</small>
                    )}
                  </Form.Group>
                  <Button 
                    disabled={loading} 
                    className="w-100 mt-3" 
                    type="submit"
                  >
                    {loading ? 'Creating Account...' : 'Register'}
                  </Button>
                </Form>
                
                <div className="d-flex align-items-center my-3">
                  <hr className="flex-grow-1" />
                  <span className="mx-2 text-muted">or</span>
                  <hr className="flex-grow-1" />
                </div>
                
                <Button 
                  variant="outline-secondary" 
                  className="w-100 d-flex align-items-center justify-content-center" 
                  onClick={handleGoogleSignIn}
                  disabled={googleLoading}
                >
                  <FcGoogle className="me-2" size={20} />
                  {googleLoading ? 'Signing up...' : 'Sign up with Google'}
                </Button>
              </Card.Body>
              <Card.Footer className="text-center">
                <div>Already have an account? <Link to="/login">Sign in</Link></div>
                <div className="mt-2">
                  <small className="text-muted">
                    Password must be at least 8 characters with a mix of letters, numbers, and symbols.
                    This site is protected by security measures including CSRF protection.
                  </small>
                </div>
              </Card.Footer>
            </Card>
          </motion.div>
        </Col>
      </Row>
    </Container>
  );
};

export default Register;