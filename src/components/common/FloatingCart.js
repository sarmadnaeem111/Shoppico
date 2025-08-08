import React from 'react';
import { Link } from 'react-router-dom';
import { Button, Badge } from 'react-bootstrap';
import { motion, AnimatePresence } from 'framer-motion';
import { useCart } from '../../contexts/CartContext';
import './FloatingCart.css';

const FloatingCart = () => {
  const { itemCount } = useCart();

  // Don't show if cart is empty
  if (itemCount === 0) return null;

  return (
    <AnimatePresence>
      <motion.div 
        className="floating-cart"
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 50 }}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        whileHover={{ scale: 1.05 }}
      >
        <Link to="/cart">
          <Button variant="primary" className="rounded-circle floating-cart-button">
            <i className="bi bi-cart-fill"></i>
            <Badge 
              pill 
              bg="danger" 
              className="floating-cart-badge"
            >
              {itemCount}
            </Badge>
          </Button>
        </Link>
      </motion.div>
    </AnimatePresence>
  );
};

export default FloatingCart;