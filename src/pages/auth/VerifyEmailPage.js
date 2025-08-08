import React from 'react';
import { Container, Row, Col, Card } from 'react-bootstrap';
import VerifyEmail from '../../components/auth/VerifyEmail';
import { motion } from 'framer-motion';
import Navbar from '../../components/common/Navbar';
import Footer from '../../components/common/Footer';

const VerifyEmailPage = () => {
  return (
    <>
      <Navbar />
      <Container className="py-5">
        <Row className="justify-content-center">
          <Col md={8} lg={6} xl={5}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <Card className="shadow-sm">
                <Card.Body className="p-4">
                  <h2 className="text-center mb-4">Verify Email</h2>
                  <VerifyEmail />
                </Card.Body>
              </Card>
            </motion.div>
          </Col>
        </Row>
      </Container>
      <Footer />
    </>
  );
};

export default VerifyEmailPage;