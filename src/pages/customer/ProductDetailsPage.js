import React from 'react';
import { Container } from 'react-bootstrap';
import { useParams } from 'react-router-dom';
import ProductDetails from '../../components/customer/ProductDetails';
import Navbar from '../../components/common/Navbar';
import Footer from '../../components/common/Footer';

const ProductDetailsPage = () => {
  const { productId } = useParams();

  return (
    <>
      <Navbar />
      <Container className="py-4">
        <ProductDetails productId={productId} />
      </Container>
      <Footer />
    </>
  );
};

export default ProductDetailsPage;