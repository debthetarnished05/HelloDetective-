import { useState } from 'react';
import ChatModal from '../components/ChatModal';
import { useGameStore } from '../store/gameStore';

export default function SuspectsDirectory() {
  const { story, sessionId, suspectStates, activeSuspectId, setActiveSuspect } = useGameStore();
  const [filter, setFilter] = useState<'all' | 'prime' | 'witness'>('all');

  const suspects = story?.suspects || [];

  const primeSuspects = suspects.filter(s => s.isPrimeSuspect || s.category === 'prime_suspect');
  const otherCharacters = suspects.filter(s => !s.isPrimeSuspect && s.category !== 'prime_suspect');

  const displayedSuspects = filter === 'prime'
    ? primeSuspects
    : filter === 'witness'
    ? otherCharacters
    : suspects;

  const getMoodColor = (mood: string) => {
    switch (mood) {
      case 'broken_down': return '#b71c1c';
      case 'nervous': return '#e65100';
      case 'defensive': return '#c2185b';
      case 'composed':
      default: return '#2e7d32';
    }
  };

  const getCategoryBadge = (category?: string, isPrime?: boolean) => {
    if (isPrime || category === 'prime_suspect') {
      return { text: 'PRIME SUSPECT', bg: '#8b3a3a' };
    }
    if (category === 'witness') {
      return { text: 'KEY WITNESS', bg: '#0277bd' };
    }
    return { text: 'PERSON OF INTEREST', bg: '#f57c00' };
  };

  return (
    <div className="page-wrapper" style={{ paddingBottom: '90px' }}>
      <div className="taped-title handwritten">
        Interrogation Directory ({suspects.length} Characters Available)
      </div>

      <p style={{ color: 'white', fontFamily: 'monospace', fontSize: '0.95rem', marginBottom: '18px', textAlign: 'center', maxWidth: '750px' }}>
        Cross-examine prime suspects, witnesses, and persons of interest. Any statement or contradiction uncovered can be saved directly to your Case Notebook.
      </p>

      {/* Filter Tabs */}
      <div style={styles.tabContainer}>
        <button
          onClick={() => setFilter('all')}
          style={{ ...styles.tabBtn, backgroundColor: filter === 'all' ? '#8b3a3a' : '#1e293b' }}
        >
          All Characters ({suspects.length})
        </button>
        <button
          onClick={() => setFilter('prime')}
          style={{ ...styles.tabBtn, backgroundColor: filter === 'prime' ? '#8b3a3a' : '#1e293b' }}
        >
          Prime Suspects ({primeSuspects.length})
        </button>
        <button
          onClick={() => setFilter('witness')}
          style={{ ...styles.tabBtn, backgroundColor: filter === 'witness' ? '#8b3a3a' : '#1e293b' }}
        >
          Witnesses & Staff ({otherCharacters.length})
        </button>
      </div>

      {/* Suspect Cards Grid */}
      <div className="suspect-board" style={{ maxWidth: '1200px', marginTop: '15px' }}>
        {displayedSuspects.map((suspect, index) => {
          const state = suspectStates[suspect.id] || {
            trustScore: suspect.initialTrust ?? 50,
            stressLevel: suspect.initialStress ?? 20,
            mood: 'composed' as const
          };

          const categoryInfo = getCategoryBadge(suspect.category, suspect.isPrimeSuspect);

          return (
            <div
              key={suspect.id}
              className="polaroid"
              style={{
                transform: `rotate(${index % 2 === 0 ? 1.5 : -1.5}deg)`,
                width: '280px',
                padding: '14px 14px 20px 14px',
                cursor: 'pointer',
                transition: 'transform 0.2s',
                backgroundColor: '#fffdf9'
              }}
              onClick={() => setActiveSuspect(suspect.id)}
              onMouseEnter={(e) => e.currentTarget.style.transform = 'rotate(0deg) scale(1.04)'}
              onMouseLeave={(e) => e.currentTarget.style.transform = `rotate(${index % 2 === 0 ? 1.5 : -1.5}deg) scale(1)`}
            >
              {/* Avatar placeholder with badges */}
              <div
                style={{
                  width: '100%',
                  height: '140px',
                  background: suspect.isPrimeSuspect
                    ? 'linear-gradient(135deg, #374151, #1f2937)'
                    : suspect.category === 'witness'
                    ? 'linear-gradient(135deg, #0f766e, #115e59)'
                    : 'linear-gradient(135deg, #854d0e, #713f12)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  position: 'relative',
                  borderRadius: '3px'
                }}
              >
                <span style={{ fontSize: '3.2rem' }}>
                  {suspect.isPrimeSuspect ? '👤' : suspect.category === 'witness' ? '👁️' : '💼'}
                </span>

                {/* Category Badge (Top Left) */}
                <span
                  style={{
                    position: 'absolute',
                    top: '8px',
                    left: '8px',
                    backgroundColor: categoryInfo.bg,
                    color: 'white',
                    fontFamily: 'monospace',
                    fontSize: '0.68rem',
                    padding: '2px 7px',
                    borderRadius: '4px',
                    fontWeight: 'bold',
                    letterSpacing: '0.5px'
                  }}
                >
                  {categoryInfo.text}
                </span>

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
                <strong style={{ fontSize: '1.25rem', color: '#1e293b', display: 'block' }}>
                  {suspect.name}
                </strong>
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
      </div>

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
  }
};