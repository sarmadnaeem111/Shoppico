import React, { useEffect } from 'react';
import { Container } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import Navbar from '../../components/common/Navbar';
import Footer from '../../components/common/Footer';
import CheckoutForm from '../../components/customer/CheckoutForm';
import { useCart } from '../../contexts/CartContext';

const CheckoutPage = () => {
  const navigate = useNavigate();
  const { items } = useCart();

  // Redirect to cart if cart is empty
  useEffect(() => {
    if (items.length === 0) {
      navigate('/cart');
    }
  }, [items, navigate]);

  return (
    <div className="page-container">
      <Navbar />
      <div className="content-wrap">
        <Container className="py-5">
          <CheckoutForm />
        </Container>
      </div>
      <Footer />
    </div>
  );
};

export default CheckoutPage;