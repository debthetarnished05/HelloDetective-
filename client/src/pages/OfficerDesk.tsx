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
      setTimeout(() => {
        if (currentStage === 1 && deduction.toLowerCase().includes('coffee')) {
          setResponse("Good catch, Detective. I'll get a warrant for the coffee shop immediately.");
          advanceStage(2);
          unlockItems(['threatening_email'], ['riverside_brews']);
        } else {
          setResponse("I'm not seeing the connection yet, Detective. We need something more concrete.");
        }
        setLoading(false);
        setDeduction('');
      }, 1000);
    } catch (error) {
      console.error(error);
      setLoading(false);
    }
  };

  return (
    <div className="page-wrapper">
      <div className="taped-title handwritten">
        Submit Deductions
      </div>
      
      <div className="paper-note notebook" style={{ width: '600px', minHeight: '400px', marginTop: '20px' }}>
        <h2 className="handwritten">Officer Davis's Desk</h2>
        <p style={{ fontSize: '0.9rem', marginBottom: '20px' }}>
          "What do you have for me, Detective? If you've found a solid lead or a hole in someone's story, lay it out."
        </p>

        {response && (
          <div style={{ background: '#e3f2fd', padding: '15px', marginBottom: '20px', borderRadius: '4px', fontStyle: 'italic' }}>
            Davis: "{response}"
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <textarea
            value={deduction}
            onChange={(e) => setDeduction(e.target.value)}
            placeholder="Type your deduction here... (e.g., 'Marcus is lying about the coffee shop')"
            style={{ width: '100%', height: '100px', padding: '10px', marginBottom: '15px', fontFamily: 'monospace' }}
            disabled={loading}
          />
          <button type="submit" className="action-button" disabled={loading}>
            {loading ? 'Reviewing...' : 'Submit Deduction'}
          </button>
        </form>
      </div>
    </div>
  );
}