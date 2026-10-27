import { useState } from 'react';
import { useGameStore } from '../store/gameStore';
import { gameApi } from '../api/client';

export default function OfficerDesk() {
  const {
    sessionId,
    officerChatHistory,
    setOfficerChatHistory,
    caseClosingTriggered,
    remainingClosingQuestions,
    interrogationLocked
  } = useGameStore();

  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const QUICK_QUESTIONS = [
    "Davis, what's our current case status & tally?",
    "Who should I press or interrogate next?",
    "Review our physical forensic evidence with me",
    "Do we have enough to file an arrest warrant?"
  ];

  const handleSend = async (userText: string) => {
    if (!userText.trim() || !sessionId || loading) return;

    setLoading(true);
    const query = userText.trim();
    setMessage('');

    // Optimistically add user message
    const updatedHistory = [
      ...officerChatHistory,
      { role: 'user' as const, content: query, timestamp: new Date() }
    ];
    setOfficerChatHistory(updatedHistory);

    try {
      const result = await gameApi.chatOfficer(sessionId, query);
      if (result.officerChatHistory) {
        setOfficerChatHistory(result.officerChatHistory);
      } else if (result.dialogue) {
        setOfficerChatHistory([
          ...updatedHistory,
          { role: 'assistant' as const, content: result.dialogue, timestamp: new Date() }
        ]);
      }
    } catch (error) {
      console.error('Failed to chat with Officer Davis:', error);
      setOfficerChatHistory([
        ...updatedHistory,
        {
          role: 'assistant' as const,
          content: "Precinct radio crackles with static... 'Detective, couldn't read your transmission. Try me again in a second.'",
          timestamp: new Date()
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-wrapper" style={{ paddingBottom: '90px' }}>
      <div
        className="notebook"
        style={{
          width: '100%',
          maxWidth: '1100px',
          minHeight: '82vh',
          display: 'flex',
          flexDirection: 'column',
          padding: '30px 40px',
          boxSizing: 'border-box'
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid rgba(0,0,0,0.15)', paddingBottom: '12px', marginBottom: '15px', flexWrap: 'wrap', gap: '15px' }}>
          <div>
            <h2 className="handwritten" style={{ fontSize: '2.8rem', margin: 0, color: '#2c3e50' }}>
              Officer Davis's Desk
            </h2>
            <p style={{ margin: '4px 0 0 0', fontFamily: 'monospace', fontSize: '0.95rem', color: '#555' }}>
              Lead Precinct Partner & Silent Investigation Advisor · Homicide Division
            </p>
          </div>
          <div
            style={{
              backgroundColor: '#1e3a8a',
              color: 'white',
              padding: '6px 14px',
              borderRadius: '20px',
              fontFamily: 'monospace',
              fontSize: '0.85rem',
              fontWeight: 'bold',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <span>🛡️</span>
            <span>PRECINCT PARTNER</span>
          </div>
        </div>

        {/* DA CLOSING BANNER */}
        {interrogationLocked ? (
          <div style={{
            backgroundColor: '#7f1d1d',
            border: '2px solid #ef4444',
            borderRadius: '6px',
            padding: '12px 18px',
            marginBottom: '18px',
            color: 'white',
            fontFamily: 'monospace'
          }}>
            <strong style={{ fontSize: '1rem', display: 'block', color: '#fca5a5' }}>
              🚫 DA MANDATE: 12 CLOSING QUESTIONS EXHAUSTED
            </strong>
            <p style={{ margin: '4px 0 0 0', fontSize: '0.88rem' }}>
              "Detective, court orders require us to close the file. Suspect rooms are sealed. Head over to the Warrant desk, review the physical evidence and alibis, and submit the formal indictment."
            </p>
          </div>
        ) : caseClosingTriggered ? (
          <div style={{
            backgroundColor: '#92400e',
            border: '2px solid #f59e0b',
            borderRadius: '6px',
            padding: '12px 18px',
            marginBottom: '18px',
            color: 'white',
            fontFamily: 'monospace',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px',
            boxShadow: '0 4px 15px rgba(245,158,11,0.25)'
          }}>
            <div>
              <strong style={{ fontSize: '1rem', display: 'block', color: '#fef08a' }}>
                🚨 PRECINCT DISPATCH: ALL LEADS & FORENSICS SECURED
              </strong>
              <p style={{ margin: '4px 0 0 0', fontSize: '0.88rem' }}>
                Every crime scene has been canvassed and all forensic evidence collected. The DA wants this wrapped up!
              </p>
            </div>
            <div style={{
              backgroundColor: '#f59e0b',
              color: '#1e293b',
              fontWeight: 'bold',
              padding: '6px 14px',
              borderRadius: '6px',
              fontSize: '0.92rem'
            }}>
              ⏳ {remainingClosingQuestions} QUESTIONS REMAINING
            </div>
          </div>
        ) : (
          <div style={{
            backgroundColor: 'rgba(255, 255, 255, 0.75)',
            borderLeft: '4px solid #2563eb',
            padding: '12px 18px',
            marginBottom: '18px',
            borderRadius: '4px'
          }}>
            <p style={{ margin: 0, fontFamily: 'monospace', fontSize: '0.9rem', color: '#333' }}>
              ℹ️ <strong>Officer Davis's Directive:</strong> "I'm monitoring the case board and tracking our physical forensics and crime scenes behind the scenes. Ask me anything about our leads, bounce suspect theories off me, or ask for a case tally whenever you need."
            </p>
          </div>
        )}

        {/* Quick Consultation Prompt Chips */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '16px' }}>
          {QUICK_QUESTIONS.map((q, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleSend(q)}
              disabled={loading}
              style={{
                backgroundColor: 'rgba(255,255,255,0.85)',
                border: '1px solid #c5d4e8',
                borderRadius: '16px',
                padding: '6px 14px',
                fontFamily: 'monospace',
                fontSize: '0.82rem',
                color: '#1e3a8a',
                cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'background 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#e0f2fe'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.85)'}
            >
              💬 {q}
            </button>
          ))}
        </div>

        {/* Officer Chat History */}
        <div
          style={{
            flex: 1,
            maxHeight: '400px',
            overflowY: 'auto',
            padding: '18px',
            backgroundColor: 'rgba(255, 255, 255, 0.7)',
            border: '1px solid #ccc',
            borderRadius: '6px',
            marginBottom: '20px',
            boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.06)'
          }}
        >
          {officerChatHistory.length === 0 ? (
            <div style={{ textAlign: 'center', color: '#666', fontFamily: 'monospace', padding: '40px 20px' }}>
              <p className="handwritten" style={{ fontSize: '2rem', color: '#2c3e50', margin: '0 0 8px 0' }}>
                "What's on your mind, Detective?"
              </p>
              <p style={{ fontSize: '0.92rem', margin: 0 }}>
                Ask Davis about suspect alibis, forensic contradictions, or ask for a case status tally.
              </p>
            </div>
          ) : (
            officerChatHistory.map((msg, i) => (
              <div
                key={i}
                style={{
                  marginBottom: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start'
                }}
              >
                <div
                  style={{
                    maxWidth: '85%',
                    backgroundColor: msg.role === 'user' ? '#e3f2fd' : '#ffffff',
                    border: msg.role === 'user' ? '1px solid #bbdefb' : '1px solid #ddd',
                    borderLeft: msg.role === 'assistant' ? '4px solid #1e3a8a' : '1px solid #bbdefb',
                    padding: '12px 18px',
                    borderRadius: '6px',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', gap: '20px' }}>
                    <strong style={{ fontFamily: 'monospace', fontSize: '0.85rem', color: msg.role === 'user' ? '#1565c0' : '#1e3a8a' }}>
                      {msg.role === 'user' ? 'Lead Detective' : 'Officer Davis'}
                    </strong>
                    <span style={{ fontFamily: 'monospace', fontSize: '0.75rem', color: '#888' }}>
                      {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p
                    style={{
                      margin: 0,
                      fontFamily: msg.role === 'user' ? 'Caveat, cursive' : 'monospace',
                      fontSize: msg.role === 'user' ? '1.45rem' : '1rem',
                      lineHeight: '1.5',
                      color: '#222',
                      whiteSpace: 'pre-wrap'
                    }}
                  >
                    {msg.content}
                  </p>
                </div>
              </div>
            ))
          )}
          {loading && (
            <div style={{ fontStyle: 'italic', color: '#1e3a8a', fontFamily: 'monospace', padding: '10px' }}>
              Officer Davis is reviewing the precinct files...
            </div>
          )}
        </div>

        {/* Input Form */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend(message);
          }}
          style={{ display: 'flex', gap: '12px' }}
        >
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Consult Officer Davis or ask: 'What is our current status tally?'..."
            style={{
              flex: 1,
              padding: '14px 18px',
              fontFamily: 'monospace',
              fontSize: '1rem',
              border: '2px solid #ccc',
              borderRadius: '4px',
              outline: 'none',
              backgroundColor: 'white'
            }}
            disabled={loading}
          />
          <button
            type="submit"
            className="action-button"
            style={{ padding: '0 25px', fontSize: '1rem', marginTop: 0, width: 'auto' }}
            disabled={loading || !message.trim()}
          >
            {loading ? 'Consulting...' : 'Ask Davis'}
          </button>
        </form>
      </div>
    </div>
  );
}