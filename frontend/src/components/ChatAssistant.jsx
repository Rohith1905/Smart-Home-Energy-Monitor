import React, { useState } from 'react';
import { Button, Card, Form, Spinner } from 'react-bootstrap';
import { FiCopy } from 'react-icons/fi';
import axios from 'axios';

const ChatAssistant = () => {
  const [message, setMessage] = useState('');
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSendMessage = async () => {
    if (!message.trim()) return;

    setLoading(true);
    try {
      const res = await axios.post('/api/ai/chat', { message });
      setResponse(res.data.response);
    } catch (err) {
      setResponse('Failed to get a response. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handlePasteFromClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setMessage(prev => prev + text); // Append clipboard text to the existing message
    } catch (err) {
      console.error('Failed to paste from clipboard:', err);
    }
  };
  

  return (
    <Card className="mt-4">
      <Card.Body>
        <Card.Title>AI Energy Assistant</Card.Title>
        <Card.Text>
          Ask me anything about energy conservation or predictions!
        </Card.Text>

        <Form.Group className="mb-3">
  <Form.Control
    as="textarea"
    rows={6}
    placeholder="Type your question..."
    value={message}
    onChange={(e) => setMessage(e.target.value)}
  />
</Form.Group>

<div className="d-flex gap-2">
  <Button variant="secondary" onClick={handlePasteFromClipboard}>
    <FiCopy className="me-2" /> Paste from Clipboard
  </Button>
  
  <Button onClick={handleSendMessage} disabled={loading}>
    {loading ? <Spinner size="sm" /> : 'Send'}
  </Button>
</div>


        {response && (
  <div className="mt-3">
    <strong>Response:</strong>
    <div style={{ whiteSpace: "pre-line" }}>{response}</div>
  </div>
)}
      </Card.Body>
    </Card>
  );
};

export default ChatAssistant;