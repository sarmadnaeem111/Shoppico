import React from 'react';
import { Container } from 'react-bootstrap';
import Cart from '../../components/customer/Cart';
import Navbar from '../../components/common/Navbar';
import Footer from '../../components/common/Footer';

const CartPage = () => {
  return (
    <div className="page-container">
      <Navbar />
      <div className="content-wrap">
        <Container className="py-4">
          <Cart />
        </Container>
      </div>
      <Footer />
    </div>
  );
};

export default CartPage;