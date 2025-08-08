import React from 'react';
import { Container } from 'react-bootstrap';
import Profile from '../../components/customer/Profile';
import Navbar from '../../components/common/Navbar';
import Footer from '../../components/common/Footer';

const ProfilePage = () => {
  return (
    <>
      <Navbar />
      <Container className="py-4">
        <h1 className="mb-4">My Profile</h1>
        <Profile />
      </Container>
      <Footer />
    </>
  );
};

export default ProfilePage;