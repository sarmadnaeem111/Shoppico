import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Table, Badge, Button, Form, Modal, Spinner } from 'react-bootstrap';
import { motion } from 'framer-motion';
import { getAllOrders, updateOrderStatus } from '../../services/firestore';
import { formatCurrency, formatDate } from '../../utils/helpers';

const OrderManagement = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [newStatus, setNewStatus] = useState('');
  const [updating, setUpdating] = useState(false);

  // Fetch all orders on component mount
  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const ordersData = await getAllOrders();
      setOrders(ordersData);
      setError(null);
    } catch (err) {
      console.error('Error fetching orders:', err);
      setError('Failed to load orders. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = (e) => {
    setNewStatus(e.target.value);
  };

  const openStatusModal = (order) => {
    setSelectedOrder(order);
    setNewStatus(order.status);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedOrder(null);
    setNewStatus('');
  };

  const updateStatus = async () => {
    if (!selectedOrder || !newStatus) return;

    try {
      setUpdating(true);
      await updateOrderStatus(selectedOrder.id, newStatus);
      
      // Update the order in the local state
      setOrders(orders.map(order => 
        order.id === selectedOrder.id 
          ? { ...order, status: newStatus } 
          : order
      ));

      closeModal();
    } catch (err) {
      console.error('Error updating order status:', err);
      setError('Failed to update order status. Please try again.');
    } finally {
      setUpdating(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'pending':
        return <Badge bg="warning">Pending</Badge>;
      case 'on the way':
        return <Badge bg="info">On the Way</Badge>;
      case 'completed':
        return <Badge bg="success">Completed</Badge>;
      case 'canceled':
        return <Badge bg="danger">Canceled</Badge>;
      default:
        return <Badge bg="secondary">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <Container className="d-flex justify-content-center align-items-center" style={{ minHeight: '300px' }}>
        <Spinner animation="border" />
      </Container>
    );
  }

  if (error) {
    return (
      <Container className="mt-4">
        <div className="alert alert-danger">{error}</div>
        <Button variant="primary" onClick={fetchOrders}>Try Again</Button>
      </Container>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <Container className="mt-4">
        <Row className="mb-4">
          <Col>
            <p>View and manage customer orders</p>
          </Col>
          <Col xs="auto">
            <Button variant="outline-primary" onClick={fetchOrders}>
              <i className="bi bi-arrow-clockwise me-2"></i>
              Refresh
            </Button>
          </Col>
        </Row>

        {orders.length === 0 ? (
          <div className="text-center p-5 bg-light rounded">
            <h4>No orders found</h4>
            <p>There are currently no customer orders in the system.</p>
          </div>
        ) : (
          <div className="table-responsive">
            <Table striped bordered hover>
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Customer</th>
                  <th>Date</th>
                  <th>Items</th>
                  <th>Total</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order.id}>
                    <td>{order.id.substring(0, 8)}...</td>
                    <td>
                      {order.customerInfo.firstName} {order.customerInfo.lastName}
                      <div className="small text-muted">{order.customerInfo.email}</div>
                    </td>
                    <td>{formatDate(order.createdAt)}</td>
                    <td>{order.items.length} items</td>
                    <td>{formatCurrency(order.total)}</td>
                    <td>{getStatusBadge(order.status)}</td>
                    <td>
                      <Button 
                        variant="outline-primary" 
                        size="sm"
                        onClick={() => openStatusModal(order)}
                      >
                        Update Status
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>
        )}

        {/* Status Update Modal */}
        <Modal show={showModal} onHide={closeModal}>
          <Modal.Header closeButton>
            <Modal.Title>Update Order Status</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {selectedOrder && (
              <>
                <p>
                  <strong>Order ID:</strong> {selectedOrder.id}
                </p>
                <p>
                  <strong>Customer:</strong> {selectedOrder.customerInfo.firstName} {selectedOrder.customerInfo.lastName}
                </p>
                <p>
                  <strong>Current Status:</strong> {getStatusBadge(selectedOrder.status)}
                </p>
                <Form.Group className="mb-3">
                  <Form.Label>New Status</Form.Label>
                  <Form.Select 
                    value={newStatus} 
                    onChange={handleStatusChange}
                    disabled={updating}
                  >
                    <option value="pending">Pending</option>
                    <option value="on the way">On the Way</option>
                    <option value="completed">Completed</option>
                    <option value="canceled">Canceled</option>
                  </Form.Select>
                </Form.Group>
              </>
            )}
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={closeModal} disabled={updating}>
              Cancel
            </Button>
            <Button 
              variant="primary" 
              onClick={updateStatus} 
              disabled={updating || newStatus === selectedOrder?.status}
            >
              {updating ? (
                <>
                  <Spinner
                    as="span"
                    animation="border"
                    size="sm"
                    role="status"
                    aria-hidden="true"
                    className="me-2"
                  />
                  Updating...
                </>
              ) : (
                'Update Status'
              )}
            </Button>
          </Modal.Footer>
        </Modal>
      </Container>
    </motion.div>
  );
};

export default OrderManagement;