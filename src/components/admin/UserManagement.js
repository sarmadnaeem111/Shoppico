import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Table, Button, Form, InputGroup, Modal, Badge } from 'react-bootstrap';
import { motion } from 'framer-motion';
import { getAllUsers, updateUserStatus, deleteUser } from '../../services/firestore';
import LoadingSpinner from '../common/LoadingSpinner';
import ErrorAlert from '../common/ErrorAlert';
import { formatDate } from '../../utils/helpers';
import UserDetails from './UserDetails';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  
  // User details view
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [showUserDetails, setShowUserDetails] = useState(false);
  
  // Delete confirmation modal
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState(null);
  
  // Status change modal
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [userToUpdate, setUserToUpdate] = useState(null);
  const [newStatus, setNewStatus] = useState('');
  const [statusLoading, setStatusLoading] = useState(false);
  const [statusError, setStatusError] = useState(null);

  // Fetch users on component mount
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        const data = await getAllUsers();
        setUsers(data);
      } catch (err) {
        console.error('Error fetching users:', err);
        setError('Failed to load users. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  // Filter users based on search term, role, and status
  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    
    const matchesStatus = statusFilter === 'all' || 
      (statusFilter === 'active' && user.status !== 'disabled') ||
      (statusFilter === 'disabled' && user.status === 'disabled');
    
    return matchesSearch && matchesRole && matchesStatus;
  });

  // Open delete confirmation modal
  const handleDeleteClick = (user) => {
    setUserToDelete(user);
    setShowDeleteModal(true);
    setDeleteError(null);
  };

  // Handle user deletion
  const confirmDelete = async () => {
    if (!userToDelete) return;
    
    try {
      setDeleteLoading(true);
      await deleteUser(userToDelete.uid);
      setUsers(users.filter(u => u.uid !== userToDelete.uid));
      setShowDeleteModal(false);
    } catch (err) {
      console.error('Error deleting user:', err);
      setDeleteError('Failed to delete user. Please try again.');
    } finally {
      setDeleteLoading(false);
    }
  };
  
  // Open status change modal
  const handleStatusClick = (user) => {
    setUserToUpdate(user);
    setNewStatus(user.status === 'disabled' ? 'active' : 'disabled');
    setShowStatusModal(true);
    setStatusError(null);
  };
  
  // View user details
  const handleViewDetails = (userId) => {
    setSelectedUserId(userId);
    setShowUserDetails(true);
  };
  
  // Return from user details view to user list
  const handleBackFromDetails = () => {
    setShowUserDetails(false);
    setSelectedUserId(null);
  };
  
  // Handle user status update
  const confirmStatusChange = async () => {
    if (!userToUpdate) return;
    
    try {
      setStatusLoading(true);
      await updateUserStatus(userToUpdate.uid, newStatus);
      
      // Update local state
      setUsers(users.map(u => {
        if (u.uid === userToUpdate.uid) {
          return { ...u, status: newStatus };
        }
        return u;
      }));
      
      setShowStatusModal(false);
    } catch (err) {
      console.error('Error updating user status:', err);
      setStatusError('Failed to update user status. Please try again.');
    } finally {
      setStatusLoading(false);
    }
  };

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
    return <LoadingSpinner fullPage text="Loading users..." />
  }
  
  // Show user details view if a user is selected
  if (showUserDetails && selectedUserId) {
    return <UserDetails userId={selectedUserId} onBack={handleBackFromDetails} />;
  }

  return (
    <Container className="py-5">
      <div className="d-flex justify-content-between align-items-center mb-4">
      </div>

      {error && (
        <ErrorAlert 
          error={error} 
          onClose={() => setError(null)} 
          className="mb-4" 
        />
      )}

      <Card className="shadow-sm mb-4">
        <Card.Body>
          <Row className="mb-3">
            <Col md={4}>
              <InputGroup>
                <InputGroup.Text>
                  <i className="bi bi-search"></i>
                </InputGroup.Text>
                <Form.Control
                  placeholder="Search users..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </InputGroup>
            </Col>
            <Col md={3} className="mt-3 mt-md-0">
              <Form.Select 
                value={roleFilter} 
                onChange={(e) => setRoleFilter(e.target.value)}
              >
                <option key="role-all" value="all">All Roles</option>
                <option key="role-admin" value="admin">Admin</option>
                <option key="role-customer" value="customer">Customer</option>
              </Form.Select>
            </Col>
            <Col md={3} className="mt-3 mt-md-0">
              <Form.Select 
                value={statusFilter} 
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option key="status-all" value="all">All Status</option>
                <option key="status-active" value="active">Active</option>
                <option key="status-disabled" value="disabled">Disabled</option>
              </Form.Select>
            </Col>
            <Col md={2} className="d-flex align-items-center mt-3 mt-md-0">
              <span className="ms-auto">
                {filteredUsers.length} user{filteredUsers.length !== 1 ? 's' : ''}
              </span>
            </Col>
          </Row>

          {filteredUsers.length === 0 ? (
            <div className="text-center py-5">
              <i className="bi bi-people display-1 text-muted mb-3"></i>
              <h5>No users found</h5>
              <p className="text-muted">
                {searchTerm || roleFilter !== 'all' || statusFilter !== 'all' ? 
                  'Try adjusting your search filters to find what you\'re looking for.' : 
                  'There are no users in the system yet.'}
              </p>
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              <Table responsive hover className="align-middle">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Status</th>
                    <th>Joined</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map(user => (
                    <tr key={user.uid}>
                      <td className="fw-bold">{user.name || 'N/A'}</td>
                      <td>{user.email}</td>
                      <td>{renderRoleBadge(user.role)}</td>
                      <td>{renderStatusBadge(user.status || 'active')}</td>
                      <td>{user.createdAt ? formatDate(user.createdAt) : 'N/A'}</td>
                      <td>
                        <Button
                          variant="outline-primary"
                          size="sm"
                          className="me-2"
                          onClick={() => handleViewDetails(user.uid)}
                        >
                          <i className="bi bi-eye"></i> View
                        </Button>
                        <Button
                          variant={user.status === 'disabled' ? 'outline-success' : 'outline-warning'}
                          size="sm"
                          className="me-2"
                          onClick={() => handleStatusClick(user)}
                          disabled={user.role === 'admin'} // Prevent disabling admin accounts
                        >
                          <i className={`bi bi-${user.status === 'disabled' ? 'check-circle' : 'slash-circle'}`}></i>
                          {user.status === 'disabled' ? ' Enable' : ' Disable'}
                        </Button>
                        <Button
                          variant="outline-danger"
                          size="sm"
                          onClick={() => handleDeleteClick(user)}
                          disabled={user.role === 'admin'} // Prevent deleting admin accounts
                        >
                          <i className="bi bi-trash"></i> Delete
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </motion.div>
          )}
        </Card.Body>
      </Card>

      {/* Delete Confirmation Modal */}
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Confirm Deletion</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {deleteError && (
            <ErrorAlert 
              error={deleteError} 
              onClose={() => setDeleteError(null)} 
              className="mb-3" 
            />
          )}
          <p>Are you sure you want to delete the user <strong>{userToDelete?.name || userToDelete?.email}</strong>?</p>
          <p className="text-danger">This action cannot be undone and will permanently remove the user account and all associated data.</p>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)} disabled={deleteLoading}>
            Cancel
          </Button>
          <Button variant="danger" onClick={confirmDelete} disabled={deleteLoading}>
            {deleteLoading ? <LoadingSpinner size="sm" text="" /> : 'Delete User'}
          </Button>
        </Modal.Footer>
      </Modal>
      
      {/* Status Change Modal */}
      <Modal show={showStatusModal} onHide={() => setShowStatusModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>
            {newStatus === 'disabled' ? 'Disable User Account' : 'Enable User Account'}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {statusError && (
            <ErrorAlert 
              error={statusError} 
              onClose={() => setStatusError(null)} 
              className="mb-3" 
            />
          )}
          <p>
            Are you sure you want to {newStatus === 'disabled' ? 'disable' : 'enable'} the account for 
            <strong> {userToUpdate?.name || userToUpdate?.email}</strong>?
          </p>
          {newStatus === 'disabled' && (
            <p className="text-warning">
              The user will not be able to log in or access their account while disabled.
            </p>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowStatusModal(false)} disabled={statusLoading}>
            Cancel
          </Button>
          <Button 
            variant={newStatus === 'disabled' ? 'warning' : 'success'} 
            onClick={confirmStatusChange} 
            disabled={statusLoading}
          >
            {statusLoading ? (
              <LoadingSpinner size="sm" text="" />
            ) : (
              newStatus === 'disabled' ? 'Disable Account' : 'Enable Account'
            )}
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default UserManagement;