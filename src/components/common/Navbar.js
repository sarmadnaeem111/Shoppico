import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Navbar, Nav, Container, Button, NavDropdown, Badge } from 'react-bootstrap';
import { useAuth } from '../../contexts/AuthContext';
import { useCart } from '../../contexts/CartContext';
import { motion } from 'framer-motion';
import './Navbar.css';

const AppNavbar = () => {
  const { currentUser, logout, isAdmin, isCustomer } = useAuth();
  const { itemCount } = useCart();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Failed to log out', error);
    }
  };

  // Animation variants
  const navbarVariants = {
    hidden: { opacity: 0, y: -50 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { 
        type: 'spring',
        stiffness: 100,
        damping: 15,
        mass: 1
      }
    }
  };

  const navItemVariants = {
    hidden: { opacity: 0, y: -20 },
    visible: i => ({
      opacity: 1,
      y: 0,
      transition: {
        delay: i * 0.1,
        duration: 0.5,
        ease: 'easeOut'
      }
    })
  };

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={navbarVariants}
    >
      <Navbar variant="dark" expand="lg" sticky="top" className="mb-4 navbar-animated">
        <Container>
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Navbar.Brand as={Link} to="/">Shoppico</Navbar.Brand>
          </motion.div>
          <Navbar.Toggle aria-controls="basic-navbar-nav" />
          <Navbar.Collapse id="basic-navbar-nav">
            <Nav className="me-auto">
              <motion.div custom={0} variants={navItemVariants}>
                <Nav.Link as={Link} to="/" className="nav-link-animated">Home</Nav.Link>
              </motion.div>
              <motion.div custom={1} variants={navItemVariants}>
                <Nav.Link as={Link} to="/products" className="nav-link-animated">Products</Nav.Link>
              </motion.div>
              {isAdmin && (
                <motion.div custom={2} variants={navItemVariants}>
                  <NavDropdown title="Admin" id="admin-dropdown" className="nav-dropdown-animated">
                    <NavDropdown.Item as={Link} to="/admin/dashboard">Dashboard</NavDropdown.Item>
                    <NavDropdown.Item as={Link} to="/admin/products">Products</NavDropdown.Item>
                    <NavDropdown.Item as={Link} to="/admin/categories">Categories</NavDropdown.Item>
                    <NavDropdown.Item as={Link} to="/admin/users">Users</NavDropdown.Item>
                    <NavDropdown.Item as={Link} to="/admin/home-content">Home Content</NavDropdown.Item>
                    <NavDropdown.Item as={Link} to="/admin/orders">Orders</NavDropdown.Item>
                    <NavDropdown.Item as={Link} to="/admin/chats">Customer Chat</NavDropdown.Item>
                  </NavDropdown>
                </motion.div>
              )}
            </Nav>
          <Nav>
            {currentUser ? (
              <>
                {isCustomer && (
                  <motion.div 
                    custom={3} 
                    variants={navItemVariants}
                    whileHover={{ scale: 1.1 }}
                  >
                    <Nav.Link as={Link} to="/cart" className="nav-link-animated position-relative">
                      <i className="bi bi-cart"></i> Cart
                      {itemCount > 0 && (
                        <Badge 
                          pill 
                          bg="danger" 
                          className="position-absolute cart-badge"
                        >
                          {itemCount}
                        </Badge>
                      )}
                    </Nav.Link>
                  </motion.div>
                )}
                <motion.div custom={4} variants={navItemVariants}>
                  <NavDropdown title={currentUser.displayName || 'Account'} id="user-dropdown" className="nav-dropdown-animated">
                    <NavDropdown.Item as={Link} to="/profile">Profile</NavDropdown.Item>
                    {isCustomer && (
                      <NavDropdown.Item as={Link} to="/orders">Orders</NavDropdown.Item>
                    )}
                    <NavDropdown.Divider />
                    <NavDropdown.Item onClick={handleLogout}>Logout</NavDropdown.Item>
                  </NavDropdown>
                </motion.div>
              </>
            ) : (
              <>
                <motion.div 
                  custom={3} 
                  variants={navItemVariants}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Button as={Link} to="/login" variant="outline-light" className="me-2 btn-animated">Login</Button>
                </motion.div>
                <motion.div 
                  custom={4} 
                  variants={navItemVariants}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Button as={Link} to="/register" variant="light" className="btn-animated">Register</Button>
                </motion.div>
              </>  
            )}
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
    </motion.div>
  );
};

export default AppNavbar;