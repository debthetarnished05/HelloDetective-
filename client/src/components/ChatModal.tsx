import React, { useState } from 'react';
import { useGameStore } from '../store/gameStore';
import { gameApi } from '../api/client';

interface ChatModalProps {
  suspectId: string;
  sessionId: string;
  onClose: () => void;
}

export default function ChatModal({ suspectId, sessionId, onClose }: ChatModalProps) {
  const { unlockedEvidence } = useGameStore();
  const [messages, setMessages] = useState<{role: 'user' | 'suspect', content: string}[]>([]);
  const [input, setInput] = useState('');
  const [selectedEvidence, setSelectedEvidence] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [trustScore, setTrustScore] = useState(50);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMsg = input;
    const evidenceToPresent = selectedEvidence || null;
    
    setMessages(prev => [...prev, { role: 'user', content: evidenceToPresent ? `[Presents ${evidenceToPresent.replace(/_/g, ' ')}] ${userMsg}` : userMsg }]);
    setInput('');
    setSelectedEvidence('');
    setLoading(true);

    try {
      const response = await gameApi.chatWithSuspect(sessionId, suspectId, userMsg, evidenceToPresent);
      setMessages(prev => [...prev, { role: 'suspect', content: response.dialogue }]);
      setTrustScore(response.trustScore);
    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, { role: 'suspect', content: '*The suspect ignores you. (Connection error)*' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.overlay}>
      <div className="paper-note center-tape-note" style={styles.modal}>
        <button style={styles.closeBtn} onClick={onClose}>X</button>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 className="handwritten" style={{ fontSize: '2.5rem', textTransform: 'capitalize' }}>
            Interrogation: {suspectId.replace('_', ' ')}
          </h2>
          <div style={{ fontFamily: 'monospace', fontSize: '1.2rem', color: trustScore < 30 ? '#d32f2f' : '#2e7d32' }}>
            Trust / Pressure: {trustScore}/100
          </div>
        </div>

        <div style={styles.chatHistory}>
          {messages.length === 0 && (
            <p style={{ fontStyle: 'italic', color: '#666', textAlign: 'center', marginTop: '20px' }}>
              Begin questioning...
            </p>
          )}
          {messages.map((msg, i) => (
            <div key={i} style={{ 
              marginBottom: '15px', 
              textAlign: msg.role === 'user' ? 'right' : 'left',
              color: msg.role === 'user' ? '#1a365d' : '#8b3a3a',
              fontFamily: msg.role === 'user' ? 'Caveat, cursive' : 'monospace',
              fontSize: msg.role === 'user' ? '1.5rem' : '1.1rem'
            }}>
              <strong>{msg.role === 'user' ? 'You: ' : `${suspectId.split('_')[0]}: `}</strong>
              {msg.content}
            </div>
          ))}
          {loading && <div style={{ fontStyle: 'italic', color: '#666' }}>Suspect is thinking...</div>}
        </div>

        <form onSubmit={handleSend} style={styles.inputArea}>
          <select 
            value={selectedEvidence} 
            onChange={(e) => setSelectedEvidence(e.target.value)}
            style={styles.evidenceSelect}
          >
            <option value="">-- No Evidence Attached --</option>
            {unlockedEvidence.map(ev => (
              <option key={ev} value={ev}>Attach: {ev.replace(/_/g, ' ')}</option>
            ))}
          </select>
          
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            style={styles.input}
            placeholder="Ask a question or present a theory..."
            disabled={loading}
          />
          <button type="submit" className="action-button" style={styles.sendBtn} disabled={loading}>
            Send
          </button>
        </form>
      </div>
    </div>
  );
}

const styles = {
  overlay: {
    position: 'fixed' as const, top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.85)', zIndex: 2000,
    display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '20px'
  },
  modal: {
    width: '100%', maxWidth: '1200px', height: '90vh',
    display: 'flex', flexDirection: 'column' as const, position: 'relative' as const
  },
  closeBtn: {
    position: 'absolute' as const, top: '20px', right: '25px',
    background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', fontWeight: 'bold', color: '#8b3a3a'
  },
  chatHistory: {
    flex: 1, overflowY: 'auto' as const, padding: '20px',
    border: '1px solid #ccc', marginTop: '20px', marginBottom: '20px',
    backgroundColor: '#fffdf9', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.05)'
  },
  inputArea: {
    display: 'flex', gap: '15px'
  },
  evidenceSelect: {
    padding: '10px', fontFamily: 'monospace', fontSize: '1rem',
    border: '2px solid #8b3a3a', borderRadius: '4px', backgroundColor: '#fff',
    maxWidth: '250px'
  },
  input: {
    flex: 1, padding: '15px', fontFamily: 'monospace', fontSize: '1.1rem',
    border: '2px solid #ccc', borderRadius: '4px'
  },
  sendBtn: {
    marginTop: 0, width: '120px', fontSize: '1.1rem'
  }
};