import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Table, Button, Badge, Modal } from 'react-bootstrap';
import { motion } from 'framer-motion';
import { getUserById } from '../../services/firestore';
import LoadingSpinner from '../common/LoadingSpinner';
import ErrorAlert from '../common/ErrorAlert';
import { formatDate } from '../../utils/helpers';

const UserDetails = ({ userId, onBack }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);

  // Fetch user details on component mount
  useEffect(() => {
    const fetchUserDetails = async () => {
      if (!userId) return;
      
      try {
        setLoading(true);
        const userData = await getUserById(userId);
        
        if (userData) {
          setUser(userData);
        } else {
          setError('User not found');
        }
      } catch (err) {
        console.error('Error fetching user details:', err);
        setError('Failed to load user details. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchUserDetails();
  }, [userId]);

  // Render role badge
  const renderRoleBadge = (role) => {
    switch (role) {
      case 'admin':
        return <Badge bg="danger">Admin</Badge>;
      case 'customer':
        return <Badge bg="info">Customer</Badge>;
      default:
        return <Badge bg="secondary">{role}</Badge>;
    }
  };
  
  // Render status badge
  const renderStatusBadge = (status) => {
    switch (status) {
      case 'disabled':
        return <Badge bg="danger">Disabled</Badge>;
      default:
        return <Badge bg="success">Active</Badge>;
    }
  };

  if (loading) {
    return <LoadingSpinner fullPage text="Loading user details..." />;
  }

  if (error) {
    return (
      <Container className="py-5">
        <ErrorAlert 
          error={error} 
          onClose={() => setError(null)} 
          className="mb-4" 
        />
        <Button variant="secondary" onClick={onBack}>
          <i className="bi bi-arrow-left"></i> Back to User List
        </Button>
      </Container>
    );
  }

  if (!user) {
    return (
      <Container className="py-5">
        <div className="text-center py-5">
          <i className="bi bi-person-x display-1 text-muted mb-3"></i>
          <h3>User Not Found</h3>
          <p className="text-muted">The requested user could not be found.</p>
          <Button variant="primary" onClick={onBack} className="mt-3">
            <i className="bi bi-arrow-left"></i> Back to User List
          </Button>
        </div>
      </Container>
    );
  }

  return (
    <Container className="py-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h2>
            <i className="bi bi-person-circle me-2"></i>
            User Details
          </h2>
          <Button variant="outline-secondary" onClick={onBack}>
            <i className="bi bi-arrow-left"></i> Back to User List
          </Button>
        </div>

        <Row>
          <Col lg={4} className="mb-4">
            <Card className="shadow-sm">
              <Card.Header className="bg-white">
                <h5 className="mb-0">Account Information</h5>
              </Card.Header>
              <Card.Body>
                <div className="text-center mb-4">
                  <div className="bg-light rounded-circle mx-auto d-flex align-items-center justify-content-center" style={{ width: '100px', height: '100px' }}>
                    <i className="bi bi-person-fill display-4 text-primary"></i>
                  </div>
                  <h4 className="mt-3">{user.name || 'No Name'}</h4>
                  <p className="text-muted mb-0">{user.email}</p>
                  <div className="mt-2">
                    {renderRoleBadge(user.role)}
                    {' '}
                    {renderStatusBadge(user.status || 'active')}
                  </div>
                </div>
                
                <Table className="table-borderless">
                  <tbody>
                    <tr>
                      <td><strong>User ID:</strong></td>
                      <td className="text-muted">{user.id || user.uid}</td>
                    </tr>
                    <tr>
                      <td><strong>Member Since:</strong></td>
                      <td className="text-muted">
                        {user.createdAt ? formatDate(user.createdAt) : 'N/A'}
                      </td>
                    </tr>
                    <tr>
                      <td><strong>Last Updated:</strong></td>
                      <td className="text-muted">
                        {user.updatedAt ? formatDate(user.updatedAt) : 'N/A'}
                      </td>
                    </tr>
                  </tbody>
                </Table>
              </Card.Body>
            </Card>
          </Col>
          
          <Col lg={8}>
            <Card className="shadow-sm mb-4">
              <Card.Header className="bg-white">
                <h5 className="mb-0">Personal Information</h5>
              </Card.Header>
              <Card.Body>
                <Row>
                  <Col md={6}>
                    <div className="mb-3">
                      <strong>Full Name:</strong>
                      <p>{user.name || 'Not provided'}</p>
                    </div>
                  </Col>
                  <Col md={6}>
                    <div className="mb-3">
                      <strong>Email Address:</strong>
                      <p>{user.email || 'Not provided'}</p>
                    </div>
                  </Col>
                </Row>
                
                <Row>
                  <Col md={6}>
                    <div className="mb-3">
                      <strong>Phone Number:</strong>
                      <p>{user.phone || 'Not provided'}</p>
                    </div>
                  </Col>
                  <Col md={6}>
                    <div className="mb-3">
                      <strong>Country:</strong>
                      <p>{user.country || 'Not provided'}</p>
                    </div>
                  </Col>
                </Row>
              </Card.Body>
            </Card>
            
            <Card className="shadow-sm mb-4">
              <Card.Header className="bg-white">
                <h5 className="mb-0">Address Information</h5>
              </Card.Header>
              <Card.Body>
                <Row>
                  <Col md={12}>
                    <div className="mb-3">
                      <strong>Street Address:</strong>
                      <p>{user.address || 'Not provided'}</p>
                    </div>
                  </Col>
                </Row>
                
                <Row>
                  <Col md={4}>
                    <div className="mb-3">
                      <strong>City:</strong>
                      <p>{user.city || 'Not provided'}</p>
                    </div>
                  </Col>
                  <Col md={4}>
                    <div className="mb-3">
                      <strong>State/Province:</strong>
                      <p>{user.state || 'Not provided'}</p>
                    </div>
                  </Col>
                  <Col md={4}>
                    <div className="mb-3">
                      <strong>Zip/Postal Code:</strong>
                      <p>{user.zipCode || 'Not provided'}</p>
                    </div>
                  </Col>
                </Row>
              </Card.Body>
            </Card>
            
            <Card className="shadow-sm">
              <Card.Header className="bg-white">
                <h5 className="mb-0">Order History</h5>
              </Card.Header>
              <Card.Body>
                <p className="text-muted text-center py-3">
                  <i className="bi bi-bag me-2"></i>
                  Order history functionality will be implemented in a future update.
                </p>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </motion.div>
    </Container>
  );
};

export default UserDetails;