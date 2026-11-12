import ChatModal from '../components/ChatModal';
import MobileCarousel from '../components/MobileCarousel';
import { useGameStore } from '../store/gameStore';

export default function SuspectsDirectory() {
  const {
    story,
    sessionId,
    suspectStates,
    activeSuspectId,
    setActiveSuspect,
    unlockedSuspects,
    caseClosingTriggered,
    remainingClosingQuestions,
    interrogationLocked
  } = useGameStore();

  const displayedSuspects = (story?.suspects || []).filter(s => unlockedSuspects.includes(s.id));

  const getMoodColor = (mood: string) => {
    switch (mood) {
      case 'broken_down': return '#b71c1c';
      case 'nervous': return '#e65100';
      case 'defensive': return '#c2185b';
      case 'composed':
      default: return '#2e7d32';
    }
  };

  const getPersonalityBadge = (personality?: string) => {
    switch (personality) {
      case 'confident':
        return { text: '💼 Confident', bg: '#1e3a8a' };
      case 'nervous':
        return { text: '😰 Nervous', bg: '#b45309' };
      case 'cunning':
        return { text: '🦊 Cunning', bg: '#701a75' };
      case 'aggressive':
        return { text: '⚡ Aggressive', bg: '#991b1b' };
      case 'defensive':
        return { text: '🛡️ Defensive', bg: '#374151' };
      default:
        return { text: '🎭 Composed', bg: '#475569' };
    }
  };

  return (
    <div className="page-wrapper" style={{ paddingBottom: '90px' }}>
      <div className="taped-title handwritten">
        Interrogation Room
      </div>

      {/* CASE CLOSING BANNER */}
      {interrogationLocked ? (
        <div style={styles.lockedBanner}>
          <div style={{ fontSize: '1.4rem' }}>🚫</div>
          <div>
            <strong style={{ fontFamily: 'monospace', fontSize: '1.05rem', color: '#ffcdd2', display: 'block' }}>
              DISTRICT ATTORNEY MANDATE: INTERROGATION ROOMS SEALED
            </strong>
            <span style={{ fontFamily: 'monospace', fontSize: '0.88rem', color: '#f5f5f5' }}>
              You may no longer interrogate suspects. Review your case notes and submit your formal Arrest Warrant.
            </span>
          </div>
        </div>
      ) : caseClosingTriggered ? (
        <div style={styles.closingBanner}>
          <div style={{ fontSize: '1.4rem' }}>⏳</div>
          <div>
            <strong style={{ fontFamily: 'monospace', fontSize: '1.05rem', color: '#fff9c4', display: 'block' }}>
              CLOSING WINDOW ACTIVE — {remainingClosingQuestions} QUESTIONS REMAINING
            </strong>
            <span style={{ fontFamily: 'monospace', fontSize: '0.88rem', color: '#fff' }}>
              The DA demands an arrest warrant. Each question asked to any suspect reduces this remaining counter!
            </span>
          </div>
        </div>
      ) : null}

      <p style={{ color: 'white', fontFamily: 'monospace', fontSize: '0.95rem', marginBottom: '22px', textAlign: 'center', maxWidth: '750px' }}>
        Cross-examine suspects and persons of interest. Interrogate them with targeted pressure or physical evidence to break alibis and uncover new leads.
      </p>

      {/* Suspect Cards Grid / Mobile Sideways Carousel */}
      <MobileCarousel
        itemCount={displayedSuspects.length}
        itemLabel="Suspect"
        className="suspect-board"
        style={{ maxWidth: '1200px', marginTop: '15px' }}
      >
        {displayedSuspects.map((suspect, index) => {
          const state = suspectStates[suspect.id] || {
            trustScore: suspect.initialTrust ?? 50,
            stressLevel: suspect.initialStress ?? 5,
            mood: 'composed' as const
          };

          const personalityInfo = getPersonalityBadge(suspect.personality);

          return (
            <div
              key={suspect.id}
              className="polaroid"
              style={{
                transform: `rotate(${index % 2 === 0 ? 1.5 : -1.5}deg)`,
                width: 'min(280px, 84vw)',
                boxSizing: 'border-box',
                padding: '14px 14px 20px 14px',
                cursor: interrogationLocked ? 'not-allowed' : 'pointer',
                transition: 'transform 0.2s',
                backgroundColor: '#fffdf9'
              }}
              onClick={() => {
                if (interrogationLocked) {
                  alert('Interrogations are locked by DA mandate. You must proceed to Court & Submit your Arrest Warrant.');
                  return;
                }
                setActiveSuspect(suspect.id);
              }}
              onMouseEnter={(e) => {
                if (!interrogationLocked) e.currentTarget.style.transform = 'rotate(0deg) scale(1.04)';
              }}
              onMouseLeave={(e) => {
                if (!interrogationLocked) e.currentTarget.style.transform = `rotate(${index % 2 === 0 ? 1.5 : -1.5}deg) scale(1)`;
              }}
            >
              {/* Avatar placeholder with badges */}
              <div
                style={{
                  width: '100%',
                  height: '140px',
                  background: 'linear-gradient(135deg, #374151, #1f2937)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  position: 'relative',
                  borderRadius: '3px'
                }}
              >
                <span style={{ fontSize: '3.2rem' }}>👤</span>

                {/* Mood Badge (Top Right) */}
                <span
                  style={{
                    position: 'absolute',
                    top: '8px',
                    right: '8px',
                    backgroundColor: getMoodColor(state.mood),
                    color: 'white',
                    fontFamily: 'monospace',
                    fontSize: '0.68rem',
                    padding: '2px 7px',
                    borderRadius: '8px',
                    fontWeight: 'bold',
                    textTransform: 'uppercase'
                  }}
                >
                  {state.mood.replace('_', ' ')}
                </span>
              </div>

              <div className="polaroid-caption" style={{ marginTop: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <strong style={{ fontSize: '1.25rem', color: '#1e293b' }}>
                    {suspect.name}
                  </strong>
                  <span
                    style={{
                      backgroundColor: personalityInfo.bg,
                      color: 'white',
                      fontFamily: 'monospace',
                      fontSize: '0.7rem',
                      padding: '2px 6px',
                      borderRadius: '4px',
                      fontWeight: 'bold'
                    }}
                  >
                    {personalityInfo.text}
                  </span>
                </div>
                <div style={{ color: '#8b3a3a', fontFamily: 'monospace', fontSize: '0.85rem', fontWeight: 'bold', marginTop: '2px' }}>
                  {suspect.role}
                </div>
                <div style={{ fontSize: '0.8rem', color: '#666', fontStyle: 'italic', marginTop: '4px', minHeight: '34px', lineHeight: '1.3' }}>
                  "{suspect.trait}"
                </div>

                {/* Alibi Snippet */}
                <div style={{ backgroundColor: 'rgba(0,0,0,0.04)', padding: '6px 8px', borderRadius: '4px', margin: '8px 0', textAlign: 'left' }}>
                  <span style={{ fontFamily: 'monospace', fontSize: '0.72rem', color: '#555', display: 'block', fontWeight: 'bold' }}>
                    CLAIMED ALIBI:
                  </span>
                  <p style={{ margin: 0, fontSize: '0.8rem', color: '#333', lineHeight: '1.3' }}>
                    {suspect.alibi.length > 70 ? `${suspect.alibi.slice(0, 70)}...` : suspect.alibi}
                  </p>
                </div>

                {/* Dynamic Meters */}
                <div style={{ marginTop: '6px', paddingTop: '8px', borderTop: '1px solid #eee' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', fontFamily: 'monospace', marginBottom: '2px' }}>
                    <span>Trust:</span>
                    <strong>{state.trustScore}%</strong>
                  </div>
                  <div style={{ height: '6px', backgroundColor: '#e2e8f0', borderRadius: '3px', marginBottom: '6px', overflow: 'hidden' }}>
                    <div
                      style={{
                        height: '100%',
                        width: `${state.trustScore}%`,
                        backgroundColor: state.trustScore > 65 ? '#2e7d32' : state.trustScore > 35 ? '#f57c00' : '#d32f2f',
                        transition: 'width 0.3s'
                      }}
                    />
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', fontFamily: 'monospace', marginBottom: '2px' }}>
                    <span>Pressure / Stress:</span>
                    <strong style={{ color: state.stressLevel >= 80 ? '#b71c1c' : '#333' }}>{state.stressLevel}%</strong>
                  </div>
                  <div style={{ height: '6px', backgroundColor: '#e2e8f0', borderRadius: '3px', overflow: 'hidden' }}>
                    <div
                      style={{
                        height: '100%',
                        width: `${state.stressLevel}%`,
                        backgroundColor: state.stressLevel >= 80 ? '#b71c1c' : state.stressLevel >= 50 ? '#e65100' : '#0288d1',
                        transition: 'width 0.3s'
                      }}
                    />
                  </div>
                </div>

                <div
                  style={{
                    marginTop: '12px',
                    color: '#8b3a3a',
                    fontFamily: 'monospace',
                    fontSize: '0.85rem',
                    fontWeight: 'bold',
                    borderTop: '1px solid #eee',
                    paddingTop: '8px'
                  }}
                >
                  Enter Interrogation Room ➔
                </div>
              </div>
            </div>
          );
        })}
      </MobileCarousel>

      {activeSuspectId && sessionId && (
        <ChatModal
          suspectId={activeSuspectId}
          sessionId={sessionId}
          onClose={() => setActiveSuspect(null)}
        />
      )}
    </div>
  );
}

const styles = {
  tabContainer: {
    display: 'flex',
    gap: '12px',
    justifyContent: 'center',
    flexWrap: 'wrap' as const,
    marginBottom: '15px'
  },
  tabBtn: {
    padding: '8px 18px',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    fontFamily: 'monospace',
    fontSize: '0.92rem',
    cursor: 'pointer',
    boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
  },
  closingBanner: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    backgroundColor: '#b45309',
    border: '2px solid #fbbf24',
    borderRadius: '8px',
    padding: '12px 16px',
    maxWidth: '900px',
    width: '100%',
    boxSizing: 'border-box' as const,
    margin: '0 auto 20px auto',
    boxShadow: '0 4px 15px rgba(217,119,6,0.3)'
  },
  lockedBanner: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    backgroundColor: '#7f1d1d',
    border: '2px solid #f87171',
    borderRadius: '8px',
    padding: '12px 16px',
    maxWidth: '900px',
    width: '100%',
    boxSizing: 'border-box' as const,
    margin: '0 auto 20px auto',
    boxShadow: '0 4px 15px rgba(185,28,28,0.4)'
  }
};