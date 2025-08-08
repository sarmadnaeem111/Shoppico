import React, { useState, useEffect } from 'react';
import { Card, Form, Button, Alert, Container, Row, Col, ProgressBar } from 'react-bootstrap';
import { useAuth } from '../../contexts/AuthContext';
import { checkPasswordStrength } from '../../utils/security';
import { motion } from 'framer-motion';

const SecuritySettings = () => {
  const { currentUser, enableTwoFactorAuth, disableTwoFactorAuth } = useAuth();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [showBackupCodes, setShowBackupCodes] = useState(false);
  const [backupCodes, setBackupCodes] = useState([]);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordStrength, setPasswordStrength] = useState({ score: 0, feedback: '' });
  
  // Fetch user's security settings
  useEffect(() => {
    const fetchSecuritySettings = async () => {
      try {
        // In a real implementation, you would fetch this from Firestore
        // For demo purposes, we'll just check if the user document has 2FA enabled
        setTwoFactorEnabled(false); // Default to false until we implement the actual check
      } catch (error) {
        setError('Failed to load security settings');
      }
    };
    
    if (currentUser) {
      fetchSecuritySettings();
    }
  }, [currentUser]);
  
  // Check password strength when password changes
  useEffect(() => {
    if (newPassword) {
      const strength = checkPasswordStrength(newPassword);
      setPasswordStrength(strength);
    } else {
      setPasswordStrength({ score: 0, feedback: '' });
    }
  }, [newPassword]);
  
  const handlePasswordChange = async (e) => {
    e.preventDefault();
    
    // Reset states
    setError('');
    setMessage('');
    
    // Validate passwords
    if (newPassword !== confirmPassword) {
      return setError('Passwords do not match');
    }
    
    if (passwordStrength.score < 3) {
      return setError('Please choose a stronger password: ' + passwordStrength.feedback);
    }
    
    setLoading(true);
    
    try {
      // In a real implementation, you would call Firebase Auth to update the password
      // For demo purposes, we'll just show a success message
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setMessage('Password updated successfully');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      setError('Failed to update password');
    } finally {
      setLoading(false);
    }
  };
  
  const handleToggleTwoFactor = async () => {
    setError('');
    setMessage('');
    setLoading(true);
    
    try {
      if (twoFactorEnabled) {
        // Disable 2FA
        await disableTwoFactorAuth();
        setTwoFactorEnabled(false);
        setMessage('Two-factor authentication disabled');
      } else {
        // Enable 2FA
        const result = await enableTwoFactorAuth();
        setTwoFactorEnabled(true);
        setBackupCodes(result.backupCodes || []);
        setShowBackupCodes(true);
        setMessage('Two-factor authentication enabled');
      }
    } catch (error) {
      setError('Failed to update two-factor authentication settings');
    } finally {
      setLoading(false);
    }
  };
  
  const getProgressVariant = (score) => {
    if (score <= 1) return 'danger';
    if (score === 2) return 'warning';
    if (score === 3) return 'info';
    return 'success';
  };
  
  return (
    <Container>
      <h2 className="mb-4">Security Settings</h2>
      
      {error && <Alert variant="danger">{error}</Alert>}
      {message && <Alert variant="success">{message}</Alert>}
      
      <Row className="mb-4">
        <Col md={6}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Card className="shadow">
              <Card.Header as="h5">Change Password</Card.Header>
              <Card.Body>
                <Form onSubmit={handlePasswordChange}>
                  <Form.Group className="mb-3">
                    <Form.Label>Current Password</Form.Label>
                    <Form.Control 
                      type="password" 
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      required 
                    />
                  </Form.Group>
                  
                  <Form.Group className="mb-3">
                    <Form.Label>New Password</Form.Label>
                    <Form.Control 
                      type="password" 
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required 
                    />
                    {newPassword && (
                      <div className="mt-2">
                        <ProgressBar 
                          now={passwordStrength.score * 25} 
                          variant={getProgressVariant(passwordStrength.score)} 
                        />
                        <small className="text-muted">{passwordStrength.feedback}</small>
                      </div>
                    )}
                  </Form.Group>
                  
                  <Form.Group className="mb-3">
                    <Form.Label>Confirm New Password</Form.Label>
                    <Form.Control 
                      type="password" 
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required 
                    />
                  </Form.Group>
                  
                  <Button 
                    type="submit" 
                    disabled={loading}
                    className="w-100"
                  >
                    {loading ? 'Updating...' : 'Update Password'}
                  </Button>
                </Form>
              </Card.Body>
            </Card>
          </motion.div>
        </Col>
        
        <Col md={6}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Card className="shadow">
              <Card.Header as="h5">Two-Factor Authentication</Card.Header>
              <Card.Body>
                <p>
                  Two-factor authentication adds an extra layer of security to your account. 
                  When enabled, you'll need to enter a verification code sent to your email 
                  in addition to your password when signing in.
                </p>
                
                <Form.Check 
                  type="switch"
                  id="two-factor-switch"
                  label={twoFactorEnabled ? "Enabled" : "Disabled"}
                  checked={twoFactorEnabled}
                  onChange={handleToggleTwoFactor}
                  disabled={loading}
                  className="mb-3"
                />
                
                {showBackupCodes && backupCodes.length > 0 && (
                  <Alert variant="warning">
                    <p className="fw-bold">Backup Codes</p>
                    <p>Save these backup codes in a secure place. You can use them to sign in if you lose access to your email.</p>
                    <div className="d-flex flex-wrap gap-2 mb-3">
                      {backupCodes.map((code, index) => (
                        <code key={index} className="p-2 bg-light">{code}</code>
                      ))}
                    </div>
                    <Button 
                      variant="secondary" 
                      size="sm"
                      onClick={() => setShowBackupCodes(false)}
                    >
                      Hide Codes
                    </Button>
                  </Alert>
                )}
              </Card.Body>
            </Card>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="mt-4"
          >
            <Card className="shadow">
              <Card.Header as="h5">Session Management</Card.Header>
              <Card.Body>
                <p>
                  Your account is currently set to automatically log out after 30 minutes of inactivity.
                </p>
                <Button variant="outline-danger" className="w-100">
                  Log Out All Other Devices
                </Button>
              </Card.Body>
            </Card>
          </motion.div>
        </Col>
      </Row>
    </Container>
  );
};

export default SecuritySettings;