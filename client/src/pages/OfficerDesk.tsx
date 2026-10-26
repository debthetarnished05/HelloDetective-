import { useState } from 'react';
import { useGameStore } from '../store/gameStore';

export default function OfficerDesk() {
  const { sessionId, currentStage, advanceStage, unlockItems } = useGameStore();
  const [deduction, setDeduction] = useState('');
  const [response, setResponse] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!deduction.trim() || !sessionId) return;

    setLoading(true);
    try {
      const result = await gameApi.submitDeduction(sessionId, deduction);
      
      setResponse(result.dialogue);
      
      if (result.isApproved) {
        advanceStage(currentStage + 1);
        unlockItems(result.unlockEvidence, result.unlockLocations);
      }
      setDeduction('');
    } catch (error) {
      console.error(error);
      setResponse("I can't hear you right now, Detective. (Server Error)");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-wrapper">
      {/* The taped-title div has been completely removed here */}
      
      <div className=" notebook" style={{ 
        width: '100%', 
        maxWidth: '1200px', 
        height: '80vh',     
        display: 'flex', 
        flexDirection: 'column',
        marginTop: '-12px' 
      }}>
        <h2 className="handwritten" style={{ fontSize: '2.5rem' }}>Officer Davis's Desk</h2>
        <p style={{ fontSize: '1.1rem', marginBottom: '20px' }}>
          "What do you have for me, Detective? If you've found a solid lead or a hole in someone's story, lay it out."
        </p>

        {response && (
          <div style={{ background: '#e3f2fd', padding: '15px', marginBottom: '20px', borderRadius: '4px', fontStyle: 'italic', fontSize: '1.1rem' }}>
            Davis: "{response}"
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
          <textarea
            value={deduction}
            onChange={(e) => setDeduction(e.target.value)}
            placeholder="Type your deduction here... (e.g., 'Marcus is lying about the coffee shop')"
            style={{ 
              flex: 1, 
              padding: '20px', 
              marginBottom: '20px', 
              fontFamily: 'monospace', 
              fontSize: '1.1rem',
              border: '2px solid #ccc',
              borderRadius: '4px',
              resize: 'none', 
              backgroundColor: 'rgba(255, 255, 255, 0.6)' 
            }}
            disabled={loading}
          />
          <button type="submit" className="action-button" style={{ padding: '15px', fontSize: '1.1rem' }} disabled={loading}>
            {loading ? 'Reviewing...' : 'Submit Deduction'}
          </button>
        </form>
      </div>
    </div>
  );
}