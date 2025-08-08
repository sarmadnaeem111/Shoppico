import React from 'react';
import { Container } from 'react-bootstrap';
import { useParams, useNavigate } from 'react-router-dom';
import ProductForm from '../../components/admin/ProductForm';
import Navbar from '../../components/common/Navbar';
import Footer from '../../components/common/Footer';

const ProductFormPage = () => {
  const { productId } = useParams();
  const navigate = useNavigate();
  const isEditMode = !!productId;

  const handleBack = () => {
    navigate('/admin/products');
  };

  return (
    <div className="page-container">
      <Navbar />
      <div className="content-wrap">
        <Container className="py-4">
          <h1 className="mb-4">{isEditMode ? 'Edit Product' : 'Add New Product'}</h1>
          <ProductForm productId={productId} onBack={handleBack} />
        </Container>
      </div>
      <Footer />
    </div>
  );
};

export default ProductFormPage;