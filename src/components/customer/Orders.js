import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Table, Badge, Button, Card, Spinner, Accordion, Image } from 'react-bootstrap';
import { motion } from 'framer-motion';
import { getOrdersByUserId } from '../../services/firestore';
import { useAuth } from '../../contexts/AuthContext';
import { formatCurrency, formatDate } from '../../utils/helpers';
import { optimizeImage } from '../../services/cloudinaryService';

const Orders = () => {
  const { currentUser } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch user orders on component mount
  useEffect(() => {
    if (currentUser?.uid) {
      fetchOrders(currentUser.uid);
    }
  }, [currentUser]);

  const fetchOrders = async (userId) => {
    try {
      setLoading(true);
      setError(null);
      const ordersData = await getOrdersByUserId(userId);
      setOrders(ordersData);
    } catch (err) {
      // Handle any unexpected errors gracefully
      console.error('Error fetching orders:', err);
      setError('Failed to load your orders. Please try again.');
    } finally {
      setLoading(false);
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
        <Button variant="primary" onClick={() => fetchOrders(currentUser.uid)}>Try Again</Button>
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
            <h2>My Orders</h2>
            <p>View your order history and track current orders</p>
          </Col>
          <Col xs="auto">
            <Button variant="outline-primary" onClick={() => fetchOrders(currentUser.uid)}>
              <i className="bi bi-arrow-clockwise me-2"></i>
              Refresh
            </Button>
          </Col>
        </Row>

        {orders.length === 0 ? (
          <Card className="text-center p-5 bg-light">
            <Card.Body>
              <i className="bi bi-bag-x" style={{ fontSize: '3rem' }}></i>
              <h4 className="mt-3">No Orders Found</h4>
              <p className="text-muted">You haven't placed any orders yet.</p>
              <Button variant="primary" href="/products">Browse Products</Button>
            </Card.Body>
          </Card>
        ) : (
          <div className="mb-4">
            {orders.map((order) => (
              <Card key={order.id} className="mb-4 shadow-sm">
                <Card.Header className="bg-white">
                  <Row className="align-items-center">
                    <Col>
                      <h5 className="mb-0">Order #{order.id.substring(0, 8)}</h5>
                      <small className="text-muted">Placed on {formatDate(order.createdAt)}</small>
                    </Col>
                    <Col xs="auto">
                      {getStatusBadge(order.status)}
                    </Col>
                  </Row>
                </Card.Header>
                <Card.Body>
                  <Row className="mb-3">
                    <Col md={6}>
                      <h6>Shipping Address</h6>
                      <p className="mb-0">{order.customerInfo.firstName} {order.customerInfo.lastName}</p>
                      <p className="mb-0">{order.customerInfo.address}</p>
                      <p className="mb-0">{order.customerInfo.city}, {order.customerInfo.state} {order.customerInfo.zip}</p>
                      <p className="mb-0">{order.customerInfo.country}</p>
                    </Col>
                    <Col md={6}>
                      <h6>Order Summary</h6>
                      <p className="mb-0"><strong>Total:</strong> {formatCurrency(order.total)}</p>
                      <p className="mb-0"><strong>Payment Method:</strong> {order.paymentMethod}</p>
                      <p className="mb-0"><strong>Items:</strong> {order.items.length}</p>
                    </Col>
                  </Row>
                  
                  <Accordion>
                    <Accordion.Item eventKey="0">
                      <Accordion.Header>View Order Items</Accordion.Header>
                      <Accordion.Body>
                        <Table responsive className="mb-0">
                          <thead>
                            <tr>
                              <th>Product</th>
                              <th>Price</th>
                              <th>Quantity</th>
                              <th>Total</th>
                            </tr>
                          </thead>
                          <tbody>
                            {order.items.map((item, index) => (
                              <tr key={index}>
                                <td>
                                  <div className="d-flex align-items-center">
                                    <Image 
                                      src={optimizeImage(item.imageUrl, 50) || '/placeholder-product.jpg'} 
                                      alt={item.name}
                                      width={50}
                                      height={50}
                                      className="me-3 product-thumbnail"
                                      rounded
                                    />
                                    <span>{item.name}</span>
                                  </div>
                                </td>
                                <td>{formatCurrency(item.price)}</td>
                                <td>{item.quantity}</td>
                                <td>{formatCurrency(item.price * item.quantity)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </Table>
                      </Accordion.Body>
                    </Accordion.Item>
                  </Accordion>
                </Card.Body>
              </Card>
            ))}
          </div>
        )}
      </Container>
    </motion.div>
  );
};

export default Orders;
