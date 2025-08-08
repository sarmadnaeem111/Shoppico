import React from 'react';
import { Container } from 'react-bootstrap';
import ProductManagement from '../../components/admin/ProductManagement';
import Navbar from '../../components/common/Navbar';
import Footer from '../../components/common/Footer';

const ProductManagementPage = () => {
  return (
    <div className="page-container">
      <Navbar />
      <div className="content-wrap">
        <Container className="py-4">
          <h1 className="mb-4">Product Management</h1>
          <ProductManagement />
        </Container>
      </div>
      <Footer />
    </div>
  );
};

export default ProductManagementPage;