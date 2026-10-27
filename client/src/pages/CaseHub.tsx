import { useGameStore } from '../store/gameStore';
import ChatModal from '../components/ChatModal';

export default function CaseHub() {
  const { story, currentStage, sessionId, suspectStates, activeSuspectId, setActiveSuspect } = useGameStore();

  if (!story) {
    return (
      <div className="page-wrapper">
        <div className="taped-title handwritten">Loading Case File...</div>
      </div>
    );
  }

  const currentStageDef = story.stages?.find(s => s.stage === currentStage);

  return (
    <div className="page-wrapper">
      {/* Title Card */}
      <div className="taped-title handwritten">
        {story.title} · Stage {currentStage}: {currentStageDef ? currentStageDef.title : ''}
      </div>

      {/* Grid Layout for the Dashboard Notes */}
      <div style={styles.dashboardGrid}>
        
        {/* Card 1: Case Details & Victim Profile */}
        <div className="paper-note center-tape-note" style={styles.card}>
          <h2 className="handwritten" style={styles.cardHeader}>Victim Profile</h2>
          
          <div style={styles.contentBlock}>
            <p><strong>Case Number:</strong> {story.caseNumber}</p>
            <p><strong>Status:</strong> {story.status}</p>
            <p><strong>Lead Detective:</strong> {story.leadDetective}</p>
          </div>
          
          <div style={styles.contentBlock}>
            <p><strong>Name:</strong> {story.victimProfile.name} (Age: {story.victimProfile.age})</p>
            <p><strong>Occupation:</strong> {story.victimProfile.occupation}</p>
            <p><strong>Discovered:</strong> {story.victimProfile.discovered}</p>
            <p><strong>Cause of Death:</strong> {story.victimProfile.causeOfDeath}</p>
            <p><strong>Time of Death:</strong> {story.victimProfile.timeOfDeath}</p>
          </div>
        </div>

        {/* Card 2: Initial Briefing & Insights */}
        <div className="paper-note center-tape-note" style={styles.card}>
          <h2 className="handwritten" style={styles.cardHeader}>Briefing & Insights</h2>
          
          <div style={styles.contentBlock}>
            <h3 style={styles.subHeader}>Initial Briefing</h3>
            <p style={styles.text}>{story.briefing.initialBriefing}</p>
          </div>

          <div style={styles.contentBlock}>
            <h3 style={styles.subHeader}>Detective's Insights</h3>
            <p style={styles.text}>{story.briefing.detectiveInsights}</p>
          </div>
        </div>

        {/* Card 3: Status & Objectives */}
        <div className="paper-note center-tape-note" style={styles.card}>
          <h2 className="handwritten" style={styles.cardHeader}>Progress & Objectives</h2>
          
          <div style={styles.contentBlock}>
            <h3 style={styles.subHeader}>Investigation Progress</h3>
            <ul style={styles.list}>
              {(story.objectives.progress || []).map((p, i) => (
                <li key={i}>{p}</li>
              ))}
            </ul>
          </div>

          <div style={styles.contentBlock}>
            <h3 style={styles.subHeader}>Current Objectives</h3>
            <ol style={styles.list}>
              {(story.objectives.currentObjectives || []).map((o, i) => (
                <li key={i}>{o}</li>
              ))}
            </ol>
          </div>
        </div>

        {/* Card 4: Prime Suspects Board */}
        <div className="paper-note center-tape-note" style={styles.card}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid rgba(0,0,0,0.1)', paddingBottom: '8px', marginBottom: '18px' }}>
            <h2 className="handwritten" style={{ ...styles.cardHeader, margin: 0, border: 'none', padding: 0 }}>Prime Suspects</h2>
            <span style={{ fontFamily: 'monospace', fontSize: '0.8rem', backgroundColor: '#8b3a3a', color: 'white', padding: '3px 8px', borderRadius: '10px' }}>
              PRIMARY TARGETS
            </span>
          </div>

          <p style={{ fontFamily: 'monospace', fontSize: '0.85rem', color: '#555', marginTop: '-8px', marginBottom: '14px' }}>
            Top persons of interest under direct homicide suspicion:
          </p>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            {((story.suspects || []).filter(s => s.isPrimeSuspect || s.category === 'prime_suspect').length > 0
              ? (story.suspects || []).filter(s => s.isPrimeSuspect || s.category === 'prime_suspect').slice(0, 3)
              : (story.suspects || []).slice(0, 3)
            ).map((suspect) => {
              const state = suspectStates[suspect.id] || {
                trustScore: suspect.initialTrust,
                stressLevel: suspect.initialStress,
                mood: 'composed'
              };

              return (
                <div
                  key={suspect.id}
                  onClick={() => setActiveSuspect(suspect.id)}
                  style={{
                    backgroundColor: 'rgba(255,255,255,0.7)',
                    padding: '12px 16px',
                    borderRadius: '4px',
                    borderLeft: '4px solid #8b3a3a',
                    cursor: 'pointer',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' }}>
                    <strong style={{ fontSize: '1.1rem', color: '#2c3e50' }}>{suspect.name}</strong>
                    <span style={{ fontSize: '0.8rem', fontFamily: 'monospace', textTransform: 'uppercase', color: '#8b3a3a', fontWeight: 'bold' }}>
                      {suspect.role}
                    </span>
                  </div>

                  <p style={{ margin: '0 0 8px 0', fontSize: '0.9rem', color: '#444', fontStyle: 'italic' }}>
                    Alibi: "{suspect.alibi}"
                  </p>

                  {/* Meters Preview */}
                  <div style={{ display: 'flex', gap: '15px', fontSize: '0.8rem', fontFamily: 'monospace' }}>
                    <span>Trust: <strong>{state.trustScore}%</strong></span>
                    <span>Stress: <strong>{state.stressLevel}%</strong></span>
                    <span style={{ color: '#8b3a3a', marginLeft: 'auto', fontWeight: 'bold' }}>Interrogate ➔</span>
                  </div>
                </div>
              );
            })}
          </div>

          <div style={{ marginTop: '16px', textAlign: 'center', borderTop: '1px solid rgba(0,0,0,0.1)', paddingTop: '12px' }}>
            <p style={{ fontFamily: 'monospace', fontSize: '0.82rem', color: '#555', margin: '0 0 8px 0' }}>
              More witnesses & persons of interest available:
            </p>
            <a
              href="/suspects"
              style={{
                display: 'inline-block',
                fontFamily: 'monospace',
                fontSize: '0.9rem',
                color: '#1a365d',
                fontWeight: 'bold',
                textDecoration: 'none',
                border: '1px solid #1a365d',
                padding: '6px 14px',
                borderRadius: '4px',
                backgroundColor: 'rgba(255,255,255,0.6)'
              }}
            >
              Open Interrogation Directory (All {(story.suspects || []).length} Characters) ➔
            </a>
          </div>
        </div>

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
  dashboardGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))',
    gap: '35px',
    width: '100%',
    maxWidth: '1400px',
    marginTop: '10px',
    alignItems: 'start'
  },
  card: {
    backgroundColor: '#c9d6b8',
    padding: '28px',
    boxShadow: '2px 4px 15px rgba(0, 0, 0, 0.4)',
    transform: 'none',
    maxWidth: '100%',
    boxSizing: 'border-box' as const
  },
  cardHeader: {
    fontSize: '2.2rem',
    color: '#2c3e50',
    borderBottom: '2px solid rgba(0,0,0,0.1)',
    paddingBottom: '8px',
    marginBottom: '18px',
    textAlign: 'center' as const
  },
  contentBlock: {
    marginBottom: '18px'
  },
  subHeader: {
    fontSize: '1.05rem',
    fontFamily: 'monospace',
    color: '#8b3a3a',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.5px',
    marginBottom: '8px'
  },
  text: {
    fontFamily: 'monospace',
    fontSize: '0.95rem',
    lineHeight: '1.6',
    color: '#333',
    marginBottom: '10px'
  },
  list: {
    fontFamily: 'monospace',
    fontSize: '0.9rem',
    lineHeight: '1.6',
    color: '#333',
    paddingLeft: '20px'
  }
};