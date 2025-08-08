import React from 'react';
import { Container } from 'react-bootstrap';
import HomeContentManagement from '../../components/admin/HomeContentManagement';
import Navbar from '../../components/common/Navbar';
import Footer from '../../components/common/Footer';
import { motion } from 'framer-motion';

const HomeContentManagementPage = () => {
  return (
    <div className="page-container">
      <Navbar />
      <div className="content-wrap">
        <Container className="py-4">
          <h1 className="mb-4">Home Content Management</h1>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <HomeContentManagement />
          </motion.div>
        </Container>
      </div>
      <Footer />
    </div>
  );
};

export default HomeContentManagementPage;