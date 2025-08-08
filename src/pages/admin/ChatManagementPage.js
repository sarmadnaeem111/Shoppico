import React from 'react';
import { Container } from 'react-bootstrap';
import AdminChat from '../../components/chat/AdminChat';

const ChatManagementPage = () => {
  return (
    <Container fluid className="p-0" style={{ height: 'calc(100vh - 56px)' }}>
      <AdminChat />
    </Container>
  );
};

export default ChatManagementPage;