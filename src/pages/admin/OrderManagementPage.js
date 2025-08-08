import React from 'react';
import { Container } from 'react-bootstrap';
import OrderManagement from '../../components/admin/OrderManagement';
import Navbar from '../../components/common/Navbar';
import Footer from '../../components/common/Footer';

const OrderManagementPage = () => {
  return (
    <div className="page-container">
      <Navbar />
      <div className="content-wrap">
        <Container className="py-4">
          <h1 className="mb-4">Order Management</h1>
          <OrderManagement />
        </Container>
      </div>
      <Footer />
    </div>
  );
};

export default OrderManagementPage;