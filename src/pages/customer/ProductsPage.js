import React from 'react';
import Products from '../../components/customer/Products';
import Navbar from '../../components/common/Navbar';
import Footer from '../../components/common/Footer';

const ProductsPage = () => {
  return (
    <>
      <Navbar />
      <Products />
      <Footer />
    </>
  );
};

export default ProductsPage;