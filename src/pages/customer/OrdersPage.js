import React from 'react';
import { Container } from 'react-bootstrap';
import Orders from '../../components/customer/Orders';
import Navbar from '../../components/common/Navbar';
import Footer from '../../components/common/Footer';

const OrdersPage = () => {
  return (
    <div className="page-container">
      <Navbar />
      <div className="content-wrap">
        <Container className="py-4">
          <Orders />
        </Container>
      </div>
      <Footer />
    </div>
  );
};

export default OrdersPage;