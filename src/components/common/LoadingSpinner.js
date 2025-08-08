import React from 'react';
import { Spinner, Container } from 'react-bootstrap';

const LoadingSpinner = ({ size = 'md', variant = 'primary', fullPage = false, text = 'Loading...' }) => {
  const spinnerComponent = (
    <div className="d-flex flex-column align-items-center justify-content-center">
      <Spinner
        animation="border"
        role="status"
        variant={variant}
        className={`spinner-${size}`}
      >
        <span className="visually-hidden">{text}</span>
      </Spinner>
      {text && <p className="mt-2 text-muted">{text}</p>}
    </div>
  );

  if (fullPage) {
    return (
      <Container 
        fluid 
        className="d-flex align-items-center justify-content-center" 
        style={{ minHeight: '80vh' }}
      >
        {spinnerComponent}
      </Container>
    );
  }

  return spinnerComponent;
};

export default LoadingSpinner;