import React, { useState, useRef, useEffect } from 'react';
import { gameApi } from '../api/client';

interface ChatModalProps {
  suspectId: string;
  sessionId: string;
  onClose: () => void;
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const ChatModal: React.FC<ChatModalProps> = ({ suspectId, sessionId, onClose }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMsg = input;
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setInput('');
    setIsLoading(true);

    try {
      // Call our backend
      const response = await gameApi.interrogate(sessionId, suspectId, userMsg);
      
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: response.data.dialogue 
      }]);
    } catch (error) {
      console.error("Failed to send message", error);
      setMessages(prev => [...prev, { role: 'assistant', content: "..." }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={styles.overlay}>
      <div className="paper-note" style={styles.modal}>
        <button onClick={onClose} style={styles.closeBtn}>X</button>
        <h2 className="handwritten">Transcript: {suspectId}</h2>
        
        <div style={styles.chatHistory}>
          {messages.map((msg, idx) => (
            <div key={idx} style={{ 
              marginBottom: '15px', 
              textAlign: msg.role === 'user' ? 'right' : 'left' 
            }}>
              <span style={{ 
                background: msg.role === 'user' ? '#e3f2fd' : '#f5f5f5',
                padding: '8px 12px',
                borderRadius: '4px',
                display: 'inline-block',
                maxWidth: '80%',
                fontFamily: 'monospace'
              }}>
                <strong>{msg.role === 'user' ? 'Detective: ' : 'Suspect: '}</strong>
                {msg.content}
              </span>
            </div>
          ))}
          {isLoading && <div style={{ fontFamily: 'monospace' }}>Suspect is typing...</div>}
          <div ref={chatEndRef} />
        </div>

        <form onSubmit={handleSend} style={styles.inputArea}>
          <input 
            type="text" 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask a question..."
            style={styles.input}
            disabled={isLoading}
          />
          <button type="submit" className="action-button" style={styles.sendBtn} disabled={isLoading}>
            Ask
          </button>
        </form>
      </div>
    </div>
  );
};

const styles = {
  overlay: {
    position: 'fixed' as const, top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 100,
    display: 'flex', justifyContent: 'center', alignItems: 'center'
  },
  modal: {
    width: '500px', height: '600px', display: 'flex', flexDirection: 'column' as const,
    transform: 'rotate(0deg)' // override the tilt for readability
  },
  closeBtn: {
    position: 'absolute' as const, top: '10px', right: '15px',
    background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer', fontWeight: 'bold'
  },
  chatHistory: {
    flex: 1, overflowY: 'auto' as const, padding: '10px',
    border: '1px solid #ccc', marginTop: '15px', marginBottom: '15px', backgroundColor: '#fff'
  },
  inputArea: {
    display: 'flex', gap: '10px'
  },
  input: {
    flex: 1, padding: '10px', fontFamily: 'monospace', border: '1px solid #ccc'
  },
  sendBtn: {
    marginTop: 0, width: 'auto'
  }
};

export default ChatModal;