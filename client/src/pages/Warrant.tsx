import { useState } from 'react';
import { useGameStore } from '../store/gameStore';

export default function Warrant() {
  const { unlockedEvidence } = useGameStore();
  const [suspect, setSuspect] = useState('');
  const [motive, setMotive] = useState('');
  const [weapon, setWeapon] = useState('');
  const [epilogue, setEpilogue] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setEpilogue("The DA reviewed your case. Because you lacked concrete proof of the murder weapon, the suspect walked free. The case remains unsolved.");
  };

  if (epilogue) {
    return (
      <div className="page-wrapper">
        <div className="taped-title handwritten">
          Trial Results
        </div>
        <div className="paper-note" style={{ width: '600px', transform: 'rotate(1deg)', marginTop: '20px' }}>
          <p style={{ marginTop: '20px', lineHeight: '1.6', fontSize: '1.1rem' }}>{epilogue}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-wrapper">
      <div className="taped-title handwritten">
        Submit Warrant
      </div>
      
      <div className="paper-note notebook" style={{ width: '600px', marginTop: '20px' }}>
        <h2 className="handwritten" style={{ color: '#2c3e50' }}>Official Arrest Warrant</h2>
        <p style={{ fontSize: '0.85rem', marginBottom: '20px' }}>Submit your final deductions. This action ends the investigation.</p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <div>
            <label style={{ fontWeight: 'bold' }}>Suspect:</label>
            <select value={suspect} onChange={(e) => setSuspect(e.target.value)} style={styles.input}>
              <option value="">Select a suspect...</option>
              <option value="marcus_chen">Marcus Chen</option>
              <option value="sarah_reynolds">Sarah Reynolds</option>
              <option value="diana_wilkins">Diana Wilkins</option>
            </select>
          </div>

          <div>
            <label style={{ fontWeight: 'bold' }}>Motive (Evidence):</label>
            <select value={motive} onChange={(e) => setMotive(e.target.value)} style={styles.input}>
              <option value="">Select motive evidence...</option>
              {unlockedEvidence.map(ev => <option key={`m-${ev}`} value={ev}>{ev.replace(/_/g, ' ')}</option>)}
            </select>
          </div>

          <div>
            <label style={{ fontWeight: 'bold' }}>Murder Weapon:</label>
            <select value={weapon} onChange={(e) => setWeapon(e.target.value)} style={styles.input}>
              <option value="">Select weapon...</option>
              {unlockedEvidence.map(ev => <option key={`w-${ev}`} value={ev}>{ev.replace(/_/g, ' ')}</option>)}
            </select>
          </div>

          <button type="submit" className="action-button" style={{ marginTop: '20px', background: '#2c3e50' }}>
            Submit to District Attorney
          </button>
        </form>
      </div>
    </div>
  );
}

const styles = {
  input: { width: '100%', padding: '8px', marginTop: '5px' }
};