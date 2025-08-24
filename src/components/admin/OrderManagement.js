import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Table, Badge, Button, Form, Modal, Spinner, Card, Image, Accordion } from 'react-bootstrap';
import { motion } from 'framer-motion';
import { getAllOrders, updateOrderStatus } from '../../services/firestore';
import { formatCurrency, formatDate } from '../../utils/helpers';
import { optimizeImage } from '../../services/cloudinaryService';

const OrderManagement = () => {
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [newStatus, setNewStatus] = useState('');
  const [updating, setUpdating] = useState(false);
  const [expandedOrders, setExpandedOrders] = useState(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('date-desc');

  // Fetch all orders on component mount
  useEffect(() => {
    fetchOrders();
  }, []);

  // Filter and sort orders when dependencies change
  useEffect(() => {
    let filtered = [...orders];

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(order => 
        order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        `${order.customerInfo.firstName} ${order.customerInfo.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.customerInfo.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.items.some(item => item.name.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(order => order.status === statusFilter);
    }

    // Apply sorting
    switch (sortBy) {
      case 'date-asc':
        filtered.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
        break;
      case 'date-desc':
        filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        break;
      case 'total-asc':
        filtered.sort((a, b) => a.total - b.total);
        break;
      case 'total-desc':
        filtered.sort((a, b) => b.total - a.total);
        break;
      case 'name-asc':
        filtered.sort((a, b) => 
          `${a.customerInfo.firstName} ${a.customerInfo.lastName}`.localeCompare(
            `${b.customerInfo.firstName} ${b.customerInfo.lastName}`
          )
        );
        break;
      case 'name-desc':
        filtered.sort((a, b) => 
          `${b.customerInfo.firstName} ${b.customerInfo.lastName}`.localeCompare(
            `${a.customerInfo.firstName} ${a.customerInfo.lastName}`
          )
        );
        break;
      default:
        break;
    }

    setFilteredOrders(filtered);
  }, [orders, searchTerm, statusFilter, sortBy]);

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

  const toggleOrderExpansion = (orderId) => {
    setExpandedOrders(prev => {
      const newSet = new Set(prev);
      if (newSet.has(orderId)) {
        newSet.delete(orderId);
      } else {
        newSet.add(orderId);
      }
      return newSet;
    });
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleStatusFilterChange = (e) => {
    setStatusFilter(e.target.value);
  };

  const handleSortChange = (e) => {
    setSortBy(e.target.value);
  };

  const exportOrders = () => {
    const csvContent = [
      ['Order ID', 'Customer Name', 'Email', 'Date', 'Status', 'Total', 'Items'],
      ...filteredOrders.map(order => [
        order.id,
        `${order.customerInfo.firstName} ${order.customerInfo.lastName}`,
        order.customerInfo.email,
        formatDate(order.createdAt),
        order.status,
        formatCurrency(order.total),
        order.items.map(item => `${item.name} (${item.quantity})`).join('; ')
      ])
    ].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `orders_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
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
            <h2>Order Management</h2>
            <p>View and manage customer orders with complete product details</p>
          </Col>
          <Col xs="auto">
            <Button variant="outline-primary" onClick={fetchOrders} className="me-2">
              <i className="bi bi-arrow-clockwise me-2"></i>
              Refresh
            </Button>
            <Button variant="outline-success" onClick={exportOrders}>
              <i className="bi bi-download me-2"></i>
              Export CSV
            </Button>
          </Col>
        </Row>

        {/* Search and Filter Controls */}
        <Card className="mb-4">
          <Card.Body>
            <Row>
              <Col md={4}>
                <Form.Group>
                  <Form.Label>Search</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="Search by order ID, customer, email, or product..."
                    value={searchTerm}
                    onChange={handleSearchChange}
                  />
                </Form.Group>
              </Col>
              <Col md={3}>
                <Form.Group>
                  <Form.Label>Status Filter</Form.Label>
                  <Form.Select value={statusFilter} onChange={handleStatusFilterChange}>
                    <option value="all">All Statuses</option>
                    <option value="pending">Pending</option>
                    <option value="on the way">On the Way</option>
                    <option value="completed">Completed</option>
                    <option value="canceled">Canceled</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={3}>
                <Form.Group>
                  <Form.Label>Sort By</Form.Label>
                  <Form.Select value={sortBy} onChange={handleSortChange}>
                    <option value="date-desc">Date (Newest First)</option>
                    <option value="date-asc">Date (Oldest First)</option>
                    <option value="total-desc">Total (High to Low)</option>
                    <option value="total-asc">Total (Low to High)</option>
                    <option value="name-asc">Customer Name (A-Z)</option>
                    <option value="name-desc">Customer Name (Z-A)</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={2} className="d-flex align-items-end">
                <span className="text-muted">
                  {filteredOrders.length} orders
                </span>
              </Col>
            </Row>
          </Card.Body>
        </Card>

        {filteredOrders.length === 0 ? (
          <div className="text-center p-5 bg-light rounded">
            <h4>No orders found</h4>
            <p>{searchTerm || statusFilter !== 'all' ? 'Try adjusting your search or filter criteria.' : 'There are currently no customer orders in the system.'}</p>
          </div>
        ) : (
          <div className="table-responsive">
            <Table striped bordered hover>
              <thead className="table-light">
                <tr>
                  <th style={{ width: '8%' }}>Order ID</th>
                  <th style={{ width: '15%' }}>Customer Details</th>
                  <th style={{ width: '20%' }}>Shipping Address</th>
                  <th style={{ width: '30%' }}>Products</th>
                  <th style={{ width: '8%' }}>Total</th>
                  <th style={{ width: '8%' }}>Status</th>
                  <th style={{ width: '11%' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map((order) => (
                  <React.Fragment key={order.id}>
                    <tr>
                      <td>
                        <div className="fw-bold">{order.id.substring(0, 8).toUpperCase()}</div>
                        <div className="small text-muted">{formatDate(order.createdAt)}</div>
                      </td>
                      <td>
                        <div className="fw-semibold">
                          {order.customerInfo.firstName} {order.customerInfo.lastName}
                        </div>
                        <div className="small text-muted">
                          <i className="bi bi-envelope"></i> {order.customerInfo.email}
                        </div>
                        <div className="small text-muted">
                          <i className="bi bi-telephone"></i> {order.customerInfo.phone || 'N/A'}
                        </div>
                      </td>
                      <td>
                        <div className="small">
                          {order.customerInfo.address}<br />
                          {order.customerInfo.city}, {order.customerInfo.state} {order.customerInfo.zip}<br />
                          {order.customerInfo.country}
                        </div>
                      </td>
                      <td>
                        <div className="d-flex align-items-center">
                          <span className="me-2">{order.items.length} items</span>
                          <Button
                            variant="link"
                            size="sm"
                            onClick={() => toggleOrderExpansion(order.id)}
                            className="p-0"
                          >
                            {expandedOrders.has(order.id) ? (
                              <i className="bi bi-chevron-up"></i>
                            ) : (
                              <i className="bi bi-chevron-down"></i>
                            )}
                            {expandedOrders.has(order.id) ? ' Hide' : ' Show'} Details
                          </Button>
                        </div>
                      </td>
                      <td>
                        <div className="fw-bold text-primary">
                          {formatCurrency(order.total)}
                        </div>
                        <div className="small text-muted">
                          {order.paymentMethod}
                        </div>
                      </td>
                      <td>{getStatusBadge(order.status)}</td>
                      <td>
                        <Button 
                          variant="outline-primary" 
                          size="sm"
                          onClick={() => openStatusModal(order)}
                          className="w-100 mb-1"
                        >
                          Update
                        </Button>
                        <Button 
                          variant="outline-info" 
                          size="sm"
                          onClick={() => toggleOrderExpansion(order.id)}
                          className="w-100"
                        >
                          {expandedOrders.has(order.id) ? 'Hide' : 'View'}
                        </Button>
                      </td>
                    </tr>
                    {expandedOrders.has(order.id) && (
                      <tr>
                        <td colSpan={7} className="p-0">
                          <div className="bg-light p-3">
                            <h6 className="mb-3">Order #{order.id.substring(0, 8).toUpperCase()} - Complete Details</h6>
                            
                            {/* Customer Information Card */}
                            <Card className="mb-3">
                              <Card.Header className="bg-primary text-white">
                                <h6 className="mb-0">Customer Information</h6>
                              </Card.Header>
                              <Card.Body>
                                <Row>
                                  <Col md={6}>
                                    <strong>Name:</strong> {order.customerInfo.firstName} {order.customerInfo.lastName}<br />
                                    <strong>Email:</strong> {order.customerInfo.email}<br />
                                    <strong>Phone:</strong> {order.customerInfo.phone || 'N/A'}
                                  </Col>
                                  <Col md={6}>
                                    <strong>Payment Method:</strong> {order.paymentMethod}<br />
                                    <strong>Order Status:</strong> {getStatusBadge(order.status)}<br />
                                    <strong>Order Date:</strong> {formatDate(order.createdAt)}
                                  </Col>
                                </Row>
                              </Card.Body>
                            </Card>

                            {/* Shipping Information Card */}
                            <Card className="mb-3">
                              <Card.Header className="bg-info text-white">
                                <h6 className="mb-0">Shipping Address</h6>
                              </Card.Header>
                              <Card.Body>
                                <strong>{order.customerInfo.firstName} {order.customerInfo.lastName}</strong><br />
                                {order.customerInfo.address}<br />
                                {order.customerInfo.city}, {order.customerInfo.state} {order.customerInfo.zip}<br />
                                {order.customerInfo.country}
                              </Card.Body>
                            </Card>

                            {/* Products Card */}
                            <Card>
                              <Card.Header className="bg-success text-white">
                                <h6 className="mb-0">Products Ordered ({order.items.length} items)</h6>
                              </Card.Header>
                              <Card.Body>
                                <Table responsive className="mb-0">
                                  <thead>
                                    <tr>
                                      <th style={{ width: '8%' }}>Image</th>
                                      <th style={{ width: '35%' }}>Product Name</th>
                                      <th style={{ width: '15%' }}>Price</th>
                                      <th style={{ width: '10%' }}>Quantity</th>
                                      <th style={{ width: '15%' }}>Subtotal</th>
                                      <th style={{ width: '17%' }}>SKU</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {order.items.map((item, index) => (
                                      <tr key={index}>
                                        <td>
                                          <Image
                                            src={optimizeImage(item.imageUrl, 60) || '/placeholder-product.jpg'}
                                            alt={item.name}
                                            width={60}
                                            height={60}
                                            className="rounded"
                                            style={{ objectFit: 'cover' }}
                                          />
                                        </td>
                                        <td className="fw-semibold">{item.name}</td>
                                        <td>{formatCurrency(item.price)}</td>
                                        <td>
                                          <Badge bg="secondary">{item.quantity}</Badge>
                                        </td>
                                        <td className="fw-bold text-primary">
                                          {formatCurrency(item.price * item.quantity)}
                                        </td>
                                        <td>
                                          <small className="text-muted">{item.sku || 'N/A'}</small>
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                  <tfoot>
                                    <tr>
                                      <td colSpan={4} className="text-end fw-bold">Order Total:</td>
                                      <td colSpan={2} className="fw-bold text-primary fs-5">
                                        {formatCurrency(order.total)}
                                      </td>
                                    </tr>
                                  </tfoot>
                                </Table>
                              </Card.Body>
                            </Card>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
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
