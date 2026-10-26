import { useGameStore } from '../store/gameStore';

export default function EvidenceLocker() {
  const { unlockedEvidence } = useGameStore();

  return (
    <div className="page-wrapper">
      <div className="taped-title handwritten">
        Evidence Locker
      </div>

      <div style={styles.grid}>
        {unlockedEvidence.length === 0 ? (
          <p className="handwritten" style={{ fontSize: '1.5rem', color: 'white' }}>No evidence collected yet.</p>
        ) : (
          unlockedEvidence.map((evidence, idx) => (
            <div key={idx} className="paper-note" style={{ transform: `rotate(${idx % 2 === 0 ? 2 : -2}deg)` }}>
              <h3 className="handwritten" style={{ textTransform: 'capitalize' }}>
                {evidence.replace(/_/g, ' ')}
              </h3>
              <div style={styles.evidenceImagePlaceholder}>
                [Image of {evidence.replace(/_/g, ' ')}]
              </div>
              <p style={{ fontSize: '0.85rem', marginTop: '10px' }}>
                Recovered and logged into evidence.
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

const styles = {
  grid: {
    display: 'flex', gap: '30px', flexWrap: 'wrap' as const, justifyContent: 'center', maxWidth: '1000px', marginTop: '20px'
  },
  evidenceImagePlaceholder: {
    width: '100%', height: '120px', backgroundColor: '#ccc', marginTop: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontStyle: 'italic', color: '#666', fontSize: '0.8rem'
  }
};