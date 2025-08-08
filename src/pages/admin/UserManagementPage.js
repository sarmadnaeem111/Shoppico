import React from 'react';
import { Container } from 'react-bootstrap';
import UserManagement from '../../components/admin/UserManagement';
import Navbar from '../../components/common/Navbar';
import Footer from '../../components/common/Footer';

const UserManagementPage = () => {
  return (
    <div className="page-container">
      <Navbar />
      <div className="content-wrap">
        <Container className="py-4">
          <h1 className="mb-4">User Management</h1>
          <UserManagement />
        </Container>
      </div>
      <Footer />
    </div>
  );
};

export default UserManagementPage;