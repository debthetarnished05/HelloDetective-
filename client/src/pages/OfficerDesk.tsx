import { useState } from 'react';
import { useGameStore } from '../store/gameStore';
import { gameApi } from '../api/client';

export default function OfficerDesk() {
  const { sessionId, currentStage, story, officerChatHistory, advanceStage } = useGameStore();
  const [deduction, setDeduction] = useState('');
  const [response, setResponse] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [justAdvanced, setJustAdvanced] = useState<boolean>(false);

  const currentStageDef = story?.stages?.find(s => s.stage === currentStage);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!deduction.trim() || !sessionId || loading) return;

    setLoading(true);
    setResponse(null);
    setFeedback(null);
    setJustAdvanced(false);

    try {
      const result = await gameApi.submitDeduction(sessionId, deduction);
      setResponse(result.dialogue);
      setFeedback(result.feedback);

      if (result.isApproved) {
        advanceStage(result.newStage, result.unlockedEvidence, result.unlockedLocations);
        setJustAdvanced(true);
      }
      setDeduction('');
    } catch (error) {
      console.error('Failed to submit deduction:', error);
      setResponse("Precinct radio is down. Try again in a moment, Detective.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-wrapper">
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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid rgba(0,0,0,0.15)', paddingBottom: '12px', marginBottom: '15px' }}>
          <div>
            <h2 className="handwritten" style={{ fontSize: '2.8rem', margin: 0, color: '#2c3e50' }}>
              Officer Davis's Desk
            </h2>
            <p style={{ margin: '4px 0 0 0', fontFamily: 'monospace', fontSize: '0.95rem', color: '#555' }}>
              Lead Precinct Partner · Stage {currentStage} Deduction Gate
            </p>
          </div>
          <div
            style={{
              backgroundColor: currentStage >= 4 ? '#b71c1c' : '#2c3e50',
              color: 'white',
              padding: '6px 14px',
              borderRadius: '20px',
              fontFamily: 'monospace',
              fontSize: '0.85rem',
              fontWeight: 'bold'
            }}
          >
            STAGE {currentStage} OF 4
          </div>
        </div>

        {/* Current Stage Objective Card */}
        {currentStageDef && (
          <div
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.75)',
              borderLeft: '4px solid #8b3a3a',
              padding: '14px 20px',
              marginBottom: '20px',
              borderRadius: '4px',
              boxShadow: '0 1px 4px rgba(0,0,0,0.08)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
              <strong style={{ fontFamily: 'monospace', color: '#8b3a3a', fontSize: '1rem', textTransform: 'uppercase' }}>
                CURRENT OBJECTIVE: {currentStageDef.title}
              </strong>
            </div>
            <p style={{ margin: 0, fontFamily: 'monospace', fontSize: '0.92rem', color: '#333' }}>
              {currentStageDef.description}
            </p>
          </div>
        )}

        {/* Officer Chat History / Dialogue */}
        <div
          style={{
            flex: 1,
            maxHeight: '340px',
            overflowY: 'auto',
            padding: '15px',
            backgroundColor: 'rgba(255, 255, 255, 0.65)',
            border: '1px solid #ccc',
            borderRadius: '4px',
            marginBottom: '20px'
          }}
        >
          {officerChatHistory.length === 0 ? (
            <p style={{ fontStyle: 'italic', color: '#666', fontFamily: 'monospace', textAlign: 'center', marginTop: '30px' }}>
              "What do you have for me, Detective? If you've found a solid contradiction or cracked someone's alibi, lay it out."
            </p>
          ) : (
            officerChatHistory.map((msg, i) => (
              <div
                key={i}
                style={{
                  marginBottom: '14px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start'
                }}
              >
                <div
                  style={{
                    maxWidth: '85%',
                    backgroundColor: msg.role === 'user' ? '#e3f2fd' : msg.isApproved ? '#e8f5e9' : '#fff',
                    border: msg.role === 'user' ? '1px solid #bbdefb' : msg.isApproved ? '2px solid #2e7d32' : '1px solid #ddd',
                    padding: '10px 16px',
                    borderRadius: '6px'
                  }}
                >
                  <strong style={{ fontFamily: 'monospace', fontSize: '0.85rem', color: msg.role === 'user' ? '#1565c0' : msg.isApproved ? '#2e7d32' : '#8b3a3a' }}>
                    {msg.role === 'user' ? 'You' : 'Officer Davis'}
                  </strong>
                  <p
                    style={{
                      margin: '4px 0 0 0',
                      fontFamily: msg.role === 'user' ? 'Caveat, cursive' : 'monospace',
                      fontSize: msg.role === 'user' ? '1.4rem' : '0.98rem',
                      color: '#222'
                    }}
                  >
                    {msg.content}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Live Feedback / Stage Advancement Announcement */}
        {response && (
          <div
            style={{
              backgroundColor: justAdvanced ? '#d4edda' : '#fff3cd',
              border: `1px solid ${justAdvanced ? '#c3e6cb' : '#ffeeba'}`,
              color: justAdvanced ? '#155724' : '#856404',
              padding: '14px 18px',
              marginBottom: '20px',
              borderRadius: '4px',
              boxShadow: '0 2px 5px rgba(0,0,0,0.05)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <span style={{ fontSize: '1.2rem' }}>{justAdvanced ? '🎉' : '⚠️'}</span>
              <strong style={{ fontFamily: 'monospace', fontSize: '1rem' }}>
                {justAdvanced ? `DEDUCTION ACCEPTED! ADVANCED TO STAGE ${currentStage}!` : 'DAVIS EVALUATION:'}
              </strong>
            </div>
            <p style={{ margin: 0, fontFamily: 'monospace', fontSize: '0.95rem' }}>
              "{response}"
            </p>
            {feedback && (
              <p style={{ margin: '6px 0 0 0', fontFamily: 'monospace', fontSize: '0.85rem', color: '#555', fontStyle: 'italic' }}>
                Precinct Guidance: {feedback}
              </p>
            )}
          </div>
        )}

        {/* Deduction Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column' }}>
          <textarea
            value={deduction}
            onChange={(e) => setDeduction(e.target.value)}
            placeholder="Present your deduction to Davis (e.g. 'Marcus is lying about being at Riverside Brews all night because the parkade log proves his Audi arrived at the corporate center at 10:48 PM...')"
            style={{
              padding: '16px',
              fontFamily: 'monospace',
              fontSize: '1rem',
              border: '2px solid #ccc',
              borderRadius: '4px',
              resize: 'none',
              minHeight: '90px',
              backgroundColor: 'rgba(255, 255, 255, 0.75)',
              marginBottom: '15px'
            }}
            disabled={loading}
          />
          <button
            type="submit"
            className="action-button"
            style={{ padding: '14px', fontSize: '1.1rem', marginTop: 0 }}
            disabled={loading || !deduction.trim()}
          >
            {loading ? 'Officer Davis is evaluating your case files...' : 'Submit Deduction to Officer Davis'}
          </button>
        </form>
      </div>
    </div>
  );
}