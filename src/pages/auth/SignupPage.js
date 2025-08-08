import React from 'react';
import { Container, Row, Col, Card } from 'react-bootstrap';
import Signup from '../../components/auth/Signup';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import Navbar from '../../components/common/Navbar';
import Footer from '../../components/common/Footer';

const SignupPage = () => {
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
            <Card className="shadow-sm border-0">
              <Card.Body className="p-4 p-md-5">
                <Signup />
                
                <div className="text-center mt-4">
                  <p className="mb-0">
                    Already have an account?{' '}
                    <Link to="/login" className="text-decoration-none">
                      Sign in
                    </Link>
                  </p>
                </div>
              </Card.Body>
            </Card>
            
            <div className="text-center mt-4">
              <Link to="/" className="text-decoration-none">
                &larr; Back to Home
              </Link>
            </div>
          </motion.div>
        </Col>
      </Row>
    </Container>
      <Footer />
    </>
  );
};

export default SignupPage;