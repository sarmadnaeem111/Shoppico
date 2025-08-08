import React from 'react';
import { Container } from 'react-bootstrap';
import CategoryManagement from '../../components/admin/CategoryManagement';
import Navbar from '../../components/common/Navbar';
import Footer from '../../components/common/Footer';

const CategoryManagementPage = () => {
  return (
    <div className="page-container">
      <Navbar />
      <div className="content-wrap">
        <Container className="py-4">
          <h1 className="mb-4">Category Management</h1>
          <CategoryManagement />
        </Container>
      </div>
      <Footer />
    </div>
  );
};

export default CategoryManagementPage;