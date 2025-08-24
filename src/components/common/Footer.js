import React from 'react';
import { Container, Row, Col } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import './Footer.css';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  // Animation variants
  const footerVariants = {
    hidden: { opacity: 0, y: 50 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { 
        type: 'spring',
        stiffness: 50,
        damping: 20,
        when: "beforeChildren",
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { 
        type: 'spring',
        stiffness: 100,
        damping: 10 
      }
    }
  };

  const linkVariants = {
    hover: { 
      scale: 1.05, 
      color: "#ffffff", 
      transition: { duration: 0.2 } 
    },
    tap: { scale: 0.95 }
  };

  return (
    <motion.footer 
      className="text-light py-4 footer-animated"
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.1 }}
      variants={footerVariants}
    >
      <Container>
        <Row>
          <Col md={4} className="mb-4 mb-md-0">
            <motion.div variants={itemVariants}>
              <h5 className="footer-title">E-Commerce Store</h5>
              <p className="text-muted">
                Your one-stop shop for all your needs. We provide high-quality products at affordable prices.
              </p>
            </motion.div>
          </Col>
          <Col md={2} className="mb-4 mb-md-0">
            <motion.div variants={itemVariants}>
              <h5 className="footer-title">Shop</h5>
              <ul className="list-unstyled">
                <motion.li variants={itemVariants}>
                  <motion.div whileHover="hover" whileTap="tap" variants={linkVariants}>
                    <Link to="/products" className="text-decoration-none text-light footer-link">All Products</Link>
                  </motion.div>
                </motion.li>
                <motion.li variants={itemVariants}>
                  <motion.div whileHover="hover" whileTap="tap" variants={linkVariants}>
                    <Link to="/categories" className="text-decoration-none text-light footer-link">Categories</Link>
                  </motion.div>
                </motion.li>
                <motion.li variants={itemVariants}>
                  <motion.div whileHover="hover" whileTap="tap" variants={linkVariants}>
                    <Link to="/deals" className="text-decoration-none text-light footer-link">Special Deals</Link>
                  </motion.div>
                </motion.li>
              </ul>
            </motion.div>
          </Col>
          <Col md={2} className="mb-4 mb-md-0">
            <motion.div variants={itemVariants}>
              <h5 className="footer-title">Account</h5>
              <ul className="list-unstyled">
                <motion.li variants={itemVariants}>
                  <motion.div whileHover="hover" whileTap="tap" variants={linkVariants}>
                    <Link to="/login" className="text-decoration-none text-light footer-link">Login</Link>
                  </motion.div>
                </motion.li>
                <motion.li variants={itemVariants}>
                  <motion.div whileHover="hover" whileTap="tap" variants={linkVariants}>
                    <Link to="/register" className="text-decoration-none text-light footer-link">Register</Link>
                  </motion.div>
                </motion.li>
                <motion.li variants={itemVariants}>
                  <motion.div whileHover="hover" whileTap="tap" variants={linkVariants}>
                    <Link to="/profile" className="text-decoration-none text-light footer-link">My Account</Link>
                  </motion.div>
                </motion.li>
                <motion.li variants={itemVariants}>
                  <motion.div whileHover="hover" whileTap="tap" variants={linkVariants}>
                    <Link to="/orders" className="text-decoration-none text-light footer-link">Orders</Link>
                  </motion.div>
                </motion.li>
              </ul>
            </motion.div>
          </Col>
          <Col md={4}>
            <motion.div variants={itemVariants}>
              <h5 className="footer-title">Contact Us</h5>
              <address className="text-muted contact-info">
                // <motion.p variants={itemVariants}>123 E-Commerce Street</motion.p>
                // <motion.p variants={itemVariants}>Shopping District, SD 12345</motion.p>
                <motion.p variants={itemVariants}>Email: shoppico@gmail.com</motion.p>
                <motion.p variants={itemVariants}>Phone: 03311041968</motion.p>
              </address>
            </motion.div>
          </Col>
        </Row>
        <motion.hr 
          className="my-4 bg-secondary" 
          variants={itemVariants}
          initial={{ width: 0 }}
          whileInView={{ width: "100%" }}
          transition={{ duration: 1 }}
        />
        <Row>
          <Col className="text-center text-muted">
            <motion.p 
              variants={itemVariants}
              className="copyright"
            >
              &copy; {2019} E-Commerce Store. All rights reserved.
            </motion.p>
          </Col>
        </Row>
      </Container>
    </motion.footer>
  );
};

export default Footer;
