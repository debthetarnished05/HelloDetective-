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
    position: 'fixed' as const, 
    top: 0, 
    left: 0, 
    right: 0, 
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.85)', /* Darker overlay to focus on the full-screen chat */
    zIndex: 2000, /* Ensure it sits above the navigation bar */
    display: 'flex', 
    justifyContent: 'center', 
    alignItems: 'center',
    padding: '20px'
  },
  modal: {
    width: '100%', 
    maxWidth: '1200px', /* Wide proportion matching the reference layout */
    height: '90vh', /* Takes up most of the vertical screen space */
    display: 'flex', 
    flexDirection: 'column' as const,
    transform: 'none', /* Remove any tilt for a clean full-screen reading experience */
    position: 'relative' as const
  },
  closeBtn: {
    position: 'absolute' as const, 
    top: '20px', 
    right: '25px',
    background: 'none', 
    border: 'none', 
    fontSize: '1.5rem', 
    cursor: 'pointer', 
    fontWeight: 'bold',
    color: '#8b3a3a'
  },
  chatHistory: {
    flex: 1, 
    overflowY: 'auto' as const, 
    padding: '20px',
    border: '1px solid #ccc', 
    marginTop: '20px', 
    marginBottom: '20px', 
    backgroundColor: '#fffdf9', /* Slightly warm paper color */
    boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.05)'
  },
  inputArea: {
    display: 'flex', 
    gap: '15px'
  },
  input: {
    flex: 1, 
    padding: '15px', 
    fontFamily: 'monospace', 
    fontSize: '1.1rem',
    border: '2px solid #ccc',
    borderRadius: '4px'
  },
  sendBtn: {
    marginTop: 0, 
    width: '120px',
    fontSize: '1.1rem'
  }
};

export default ChatModal;