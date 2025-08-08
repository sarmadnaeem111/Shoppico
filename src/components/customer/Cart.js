import React from 'react';
import { Container, Row, Col, Card, Button, Table, Image, Form, Alert } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useCart } from '../../contexts/CartContext';
import { formatCurrency } from '../../utils/helpers';
import { optimizeImage } from '../../services/cloudinaryService';
import LoadingSpinner from '../common/LoadingSpinner';

const Cart = () => {
  const { items, total, itemCount, loading, error, removeFromCart, updateQuantity, clearCart } = useCart();

  if (loading) {
    return <LoadingSpinner fullPage text="Loading your cart..." />;
  }

  if (error) {
    return (
      <Container className="py-5">
        <Alert variant="danger">
          <Alert.Heading>Error Loading Cart</Alert.Heading>
          <p>{error}</p>
        </Alert>
      </Container>
    );
  }

  if (items.length === 0) {
    return (
      <Container className="py-5">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <Card className="text-center shadow-sm">
            <Card.Body className="p-5">
              <div className="mb-4">
                <i className="bi bi-cart3 display-1 text-muted"></i>
              </div>
              <Card.Title className="fs-2 mb-3">Your Cart is Empty</Card.Title>
              <Card.Text className="text-muted mb-4">
                Looks like you haven't added any products to your cart yet.
              </Card.Text>
              <Button as={Link} to="/products" variant="primary" size="lg">
                Browse Products
              </Button>
            </Card.Body>
          </Card>
        </motion.div>
      </Container>
    );
  }

  const handleQuantityChange = (productId, newQuantity) => {
    updateQuantity(productId, parseInt(newQuantity));
  };

  const handleRemoveItem = (productId) => {
    removeFromCart(productId);
  };

  return (
    <Container className="py-5">
      <h1 className="mb-4">Your Shopping Cart</h1>
      <Row>
        <Col lg={8}>
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Card className="shadow-sm mb-4">
              <Card.Body>
                <Table responsive className="cart-table">
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th>Price</th>
                      <th>Quantity</th>
                      <th>Total</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item) => (
                      <tr key={item.id}>
                        <td>
                          <div className="d-flex align-items-center">
                            <Image 
                              src={optimizeImage(item.imageUrl, 80) || '/placeholder-product.jpg'} 
                              alt={item.name}
                              width={80}
                              height={80}
                              className="me-3 product-thumbnail"
                              rounded
                            />
                            <div>
                              <h6 className="mb-1">
                                <Link to={`/products/${item.id}`} className="text-decoration-none">
                                  {item.name}
                                </Link>
                              </h6>
                              <small className="text-muted">{item.category}</small>
                            </div>
                          </div>
                        </td>
                        <td>{formatCurrency(item.price)}</td>
                        <td>
                          <Form.Control
                            type="number"
                            min="1"
                            max="99"
                            value={item.quantity}
                            onChange={(e) => handleQuantityChange(item.id, e.target.value)}
                            style={{ width: '70px' }}
                          />
                        </td>
                        <td className="fw-bold">{formatCurrency(item.price * item.quantity)}</td>
                        <td>
                          <Button
                            variant="outline-danger"
                            size="sm"
                            onClick={() => handleRemoveItem(item.id)}
                          >
                            <i className="bi bi-trash"></i>
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </Card.Body>
              <Card.Footer className="d-flex justify-content-between align-items-center bg-white">
                <Button variant="outline-secondary" onClick={clearCart}>
                  <i className="bi bi-x-circle me-2"></i>
                  Clear Cart
                </Button>
                <Button as={Link} to="/products" variant="outline-primary">
                  <i className="bi bi-arrow-left me-2"></i>
                  Continue Shopping
                </Button>
              </Card.Footer>
            </Card>
          </motion.div>
        </Col>
        <Col lg={4}>
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Card className="shadow-sm">
              <Card.Header className="bg-white">
                <h5 className="mb-0">Order Summary</h5>
              </Card.Header>
              <Card.Body>
                <div className="d-flex justify-content-between mb-2">
                  <span>Items ({itemCount}):</span>
                  <span>{formatCurrency(total)}</span>
                </div>
                <div className="d-flex justify-content-between mb-2">
                  <span>Shipping:</span>
                  <span>Free</span>
                </div>
                <hr />
                <div className="d-flex justify-content-between mb-3 fw-bold">
                  <span>Total:</span>
                  <span className="text-primary fs-5">{formatCurrency(total)}</span>
                </div>
                <div className="d-grid gap-2">
                  <Button variant="primary" size="lg" as={Link} to="/checkout">
                    Proceed to Checkout
                  </Button>
                </div>
              </Card.Body>
            </Card>
          </motion.div>
        </Col>
      </Row>
    </Container>
  );
};

export default Cart;