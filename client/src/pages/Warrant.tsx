import { useState } from 'react';
import { useGameStore } from '../store/gameStore';
import { useAuthStore } from '../store/authStore';
import { gameApi } from '../api/client';

export default function Warrant() {
  const { sessionId, story, unlockedEvidence, recordedClues, caseClosingTriggered, remainingClosingQuestions, interrogationLocked, unlockedSuspects } = useGameStore();
  const { isGuest, openAuthModal, updateUserStatsAndBadges } = useAuthStore();

  const [suspect, setSuspect] = useState('');
  const [motive, setMotive] = useState('');
  const [weapon, setWeapon] = useState('');
  const [keyContradiction, setKeyContradiction] = useState('');
  const [loading, setLoading] = useState(false);
  const [verdict, setVerdict] = useState<{
    outcome: string;
    score: number;
    verdictTitle: string;
    epilogue: string;
    userRank?: any;
    newBadges?: string[];
    userStats?: any;
  } | null>(null);

  const availableEvidence = (story?.evidence || []).filter(e => unlockedEvidence.includes(e.id));
  const suspects = (story?.suspects || []).filter(s => unlockedSuspects.includes(s.id));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!suspect || !motive || !weapon || !keyContradiction || !sessionId) return;

    setLoading(true);
    try {
      const result = await gameApi.submitWarrant(sessionId, {
        suspect,
        motive,
        weapon,
        keyContradiction
      });
      setVerdict(result);
      if (result.userRank || result.userStats || result.newBadges) {
        updateUserStatsAndBadges({
          userRank: result.userRank,
          newBadges: result.newBadges,
          userStats: result.userStats
        });
      }
    } catch (error) {
      console.error('Failed to submit warrant:', error);
      alert('Court proceedings failed due to server error. Please retry.');
    } finally {
      setLoading(false);
    }
  };

  if (verdict) {
    const isConvicted = verdict.outcome === 'perfect' || verdict.outcome === 'guilty';
    return (
      <div className="page-wrapper" style={{ paddingBottom: '80px' }}>
        <div style={{ ...styles.clipboard, maxWidth: '850px' }}>
          <div style={styles.clip}>
            <div style={styles.clipHinge}></div>
          </div>
          <div style={styles.paper}>
            <div style={{ textAlign: 'center', borderBottom: '2px solid rgba(0,0,0,0.15)', paddingBottom: '15px', marginBottom: '20px' }}>
              <span
                style={{
                  backgroundColor: isConvicted ? '#2e7d32' : verdict.outcome === 'wrong_suspect' ? '#b71c1c' : '#e65100',
                  color: 'white',
                  fontFamily: 'monospace',
                  fontSize: '0.9rem',
                  padding: '5px 15px',
                  borderRadius: '20px',
                  fontWeight: 'bold',
                  textTransform: 'uppercase'
                }}
              >
                {verdict.verdictTitle} · CASE SCORE: {verdict.score}/100
              </span>
            <h2 className="handwritten" style={{ fontSize: 'clamp(1.8rem, 5vw, 3rem)', margin: '10px 0 0 0', color: '#2c3e50' }}>
              Supreme Court Judicial Epilogue
            </h2>
            </div>

            {/* Rank / Badge Commendations Banner */}
            {verdict.userRank && (
              <div style={{
                backgroundColor: '#fff8e1',
                border: '2px solid #ffb300',
                borderRadius: '6px',
                padding: '12px 16px',
                marginBottom: '15px',
                fontFamily: "'Special Elite', monospace",
                color: '#5d4037',
                fontSize: '0.95rem',
                textAlign: 'center'
              }}>
                🎖️ BUREAU COMMISSION RECORD: Promoted to <strong>{verdict.userRank}</strong>!
              </div>
            )}

            {verdict.newBadges && verdict.newBadges.length > 0 && (
              <div style={{
                backgroundColor: '#e8f5e9',
                border: '2px solid #66bb6a',
                borderRadius: '6px',
                padding: '12px 16px',
                marginBottom: '15px',
                fontFamily: "'Special Elite', monospace",
                color: '#1b5e20',
                fontSize: '0.95rem',
                textAlign: 'center'
              }}>
                ⭐ COMMENDATION MEDAL EARNED: {verdict.newBadges.join(', ')}!
              </div>
            )}

            {isGuest && (
              <div style={{
                backgroundColor: '#efebe9',
                border: '1.5px dashed #8d6e63',
                borderRadius: '6px',
                padding: '12px 18px',
                marginBottom: '18px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '10px'
              }}>
                <span style={{ fontFamily: 'monospace', fontSize: '0.85rem', color: '#4e342e' }}>
                  🕵️ <strong>Playing as Guest:</strong> Issue a free Detective Badge or Sign In to permanently link this conviction to your dossier.
                </span>
                <button
                  type="button"
                  onClick={() => openAuthModal('register', 'Register an official badge to archive this conviction and claim your rank!')}
                  style={{
                    backgroundColor: '#8b3a3a',
                    color: '#ffd54f',
                    border: '1px solid #5c1818',
                    padding: '6px 14px',
                    borderRadius: '4px',
                    fontFamily: "'Special Elite', monospace",
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                    fontWeight: 'bold'
                  }}
                >
                  Claim Official Badge ➔
                </button>
              </div>
            )}

            <div style={{ fontFamily: 'monospace', fontSize: '1.05rem', lineHeight: '1.8', color: '#222', whiteSpace: 'pre-wrap' }}>
              {verdict.epilogue}
            </div>

            <div style={{ marginTop: '35px', textAlign: 'center' }}>
              <button
                type="button"
                className="action-button"
                style={{ maxWidth: '300px', padding: '12px 24px', fontSize: '1.1rem' }}
                onClick={() => setVerdict(null)}
              >
                Review Warrant
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-wrapper" style={{ paddingBottom: '100px' }}>
      <div style={styles.clipboard}>
        {/* Metal Clip */}
        <div style={styles.clip}>
          <div style={styles.clipHinge}></div>
        </div>

        {/* Lined Paper */}
        <div style={styles.paper}>
          <h2 className="handwritten" style={{ fontSize: '2.8rem', color: '#2c3e50', textAlign: 'center', marginBottom: '5px' }}>
            Official Arrest Warrant Form
          </h2>
          <p style={{ fontFamily: 'monospace', textAlign: 'center', color: '#555', marginBottom: '20px', fontSize: '0.9rem' }}>
            Submit your formal indictment to the Superior Court at any time. The Judge will deliberate your physical forensics, suspect admissions and motive.
          </p>

          {interrogationLocked ? (
            <div style={{
              backgroundColor: '#fee2e2',
              border: '1px solid #f87171',
              borderRadius: '4px',
              padding: '8px 14px',
              marginBottom: '20px',
              fontFamily: 'monospace',
              fontSize: '0.85rem',
              color: '#991b1b',
              textAlign: 'center'
            }}>
              🚫 Interrogation rooms are sealed. The District Attorney is waiting for this warrant.
            </div>
          ) : caseClosingTriggered ? (
            <div style={{
              backgroundColor: '#fef3c7',
              border: '1px solid #f59e0b',
              borderRadius: '4px',
              padding: '8px 14px',
              marginBottom: '20px',
              fontFamily: 'monospace',
              fontSize: '0.85rem',
              color: '#92400e',
              textAlign: 'center'
            }}>
              ⏳ Case closing active — {remainingClosingQuestions} questions remaining before court-ordered lockdown.
            </div>
          ) : null}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
            {/* 1. Primary Suspect Dropdown */}
            <div style={styles.inputGroup}>
              <label style={styles.label}>1. The Accused Perpetrator:</label>
              <select
                value={suspect}
                onChange={(e) => setSuspect(e.target.value)}
                style={styles.select}
                required
              >
                <option value="">-- Select Person of Interest --</option>
                {suspects.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.role})
                  </option>
                ))}
              </select>
            </div>

            {/* 2. Motive Input / Select */}
            <div style={styles.inputGroup}>
              <label style={styles.label}>2. The Motive:</label>
              <input
                type="text"
                value={motive}
                onChange={(e) => setMotive(e.target.value)}
                placeholder="e.g. Patent theft and corporate fraud coverup, or financial insurance fraud..."
                style={styles.input}
                required
              />
            </div>

            {/* 3. Weapon / Opportunity Evidence Dropdown */}
            <div style={styles.inputGroup}>
              <label style={styles.label}>3. Murder Weapon / Opportunity Evidence:</label>
              <select
                value={weapon}
                onChange={(e) => setWeapon(e.target.value)}
                style={styles.select}
                required
              >
                <option value="">-- Select from Unlocked Evidence Locker --</option>
                {availableEvidence.map(ev => (
                  <option key={ev.id} value={ev.id}>
                    [{ev.priority}] {ev.title} ({ev.location})
                  </option>
                ))}
              </select>
            </div>

            {/* 4. Key Contradiction */}
            <div style={styles.inputGroup}>
              <label style={styles.label}>4. The Key Contradiction That Broke Their Alibi:</label>
              <select
                value={keyContradiction}
                onChange={(e) => setKeyContradiction(e.target.value)}
                style={styles.select}
                required
              >
                <option value="">-- Select Decisive Contradiction Clue --</option>
                {availableEvidence.map(ev => (
                  <option key={ev.id} value={ev.id}>
                    Clue: {ev.title}
                  </option>
                ))}
                {recordedClues.map(c => (
                  <option key={c.id} value={c.statement}>
                    Admission: {c.suspectName} - "{c.statement.slice(0, 45)}..."
                  </option>
                ))}
              </select>
            </div>

            <button
              type="submit"
              className="action-button"
              style={styles.submitBtn}
              disabled={loading || !suspect || !motive || !weapon || !keyContradiction}
            >
              {loading ? 'The Grand Jury & Judge Are Deliberating...' : 'Submit Warrant to District Attorney & Court'}
            </button>
          </form>

          {/* Pen Artwork (Hidden on screens <= 1100px) */}
          <div className="warrant-pen-artwork" style={styles.penContainer}>
            <svg width="280" height="40" viewBox="0 0 200 30" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M0 15 L25 8 L25 22 Z" fill="#d1d5db" stroke="#9ca3af" strokeWidth="1" />
              <path d="M25 8 L60 8 L60 22 L25 22 Z" fill="#1f2937" />
              <rect x="60" y="6" width="120" height="18" rx="2" fill="#374151" stroke="#1f2937" strokeWidth="1" />
              <rect x="130" y="3" width="40" height="4" rx="2" fill="#e5e7eb" stroke="#9ca3af" strokeWidth="0.5" />
              <path d="M180 6 L195 10 L195 20 L180 24 Z" fill="#1f2937" />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  clipboard: {
    backgroundColor: '#3e2723',
    padding: 'clamp(20px, 3vw, 30px) clamp(12px, 2.5vw, 20px)',
    borderRadius: '12px',
    boxShadow: '4px 10px 25px rgba(0,0,0,0.6)',
    width: '100%',
    maxWidth: '780px',
    position: 'relative' as const,
    boxSizing: 'border-box' as const,
    marginTop: '20px'
  },
  clip: {
    position: 'absolute' as const,
    top: '-15px',
    left: '50%',
    transform: 'translateX(-50%)',
    width: '120px',
    height: '45px',
    backgroundColor: '#cbd5e1',
    borderRadius: '8px',
    boxShadow: '0 4px 6px rgba(0,0,0,0.5), inset 0 2px 4px rgba(255,255,255,0.7)',
    zIndex: 10,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center'
  },
  clipHinge: {
    width: '80%',
    height: '8px',
    backgroundColor: '#94a3b8',
    borderRadius: '4px',
    boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.5)'
  },
  paper: {
    backgroundColor: '#fdfbf7',
    padding: 'clamp(24px, 4vw, 45px) clamp(16px, 3.5vw, 40px)',
    borderRadius: '4px',
    minHeight: '520px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
    position: 'relative' as const,
    boxSizing: 'border-box' as const
  },
  inputGroup: {
    display: 'flex',
    flexDirection: 'column' as const
  },
  label: {
    fontFamily: 'monospace',
    fontWeight: 'bold',
    fontSize: '1rem',
    color: '#333',
    marginBottom: '6px'
  },
  select: {
    padding: '12px',
    fontFamily: 'monospace',
    fontSize: '1rem',
    border: '2px solid #ccc',
    borderRadius: '4px',
    backgroundColor: 'white'
  },
  input: {
    padding: '12px',
    fontFamily: 'monospace',
    fontSize: '1rem',
    border: '2px solid #ccc',
    borderRadius: '4px',
    backgroundColor: 'white'
  },
  submitBtn: {
    marginTop: '20px',
    backgroundColor: '#2c3e50',
    padding: '16px',
    fontSize: '1.15rem',
    fontFamily: 'monospace',
    letterSpacing: '0.5px'
  },
  penContainer: {
    position: 'absolute' as const,
    top: '45%',
    right: '-150px',
    transform: 'rotate(-70deg)',
    filter: 'drop-shadow(3px 5px 6px rgba(0,0,0,0.5))',
    zIndex: 20
  }
};