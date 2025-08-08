import React from 'react';
import { Container } from 'react-bootstrap';
import Dashboard from '../../components/admin/Dashboard';
import Navbar from '../../components/common/Navbar';
import Footer from '../../components/common/Footer';

const DashboardPage = () => {
  return (
    <div className="page-container">
      <Navbar />
      <div className="content-wrap">
        <Container className="py-4">
          <h1 className="mb-4">Admin Dashboard</h1>
          <Dashboard />
        </Container>
      </div>
      <Footer />
    </div>
  );
};

export default DashboardPage;