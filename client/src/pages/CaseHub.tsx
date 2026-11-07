import { useGameStore } from '../store/gameStore';
import { useAuthStore } from '../store/authStore';

export default function CaseHub() {
  const { story, unlockedSuspects } = useGameStore();
  const { user } = useAuthStore();

  if (!story) {
    return (
      <div className="page-wrapper">
        <div className="taped-title handwritten">Loading Case File...</div>
      </div>
    );
  }

  const leadDetectiveDisplay = user ? `Detective ${user.username}` : ('Detective Gene Yuss');
  const allSuspects = story.suspects || [];
  const displaySuspects = allSuspects.filter(s => unlockedSuspects.includes(s.id));

  return (
    <div className="page-wrapper">
      {/* Title Card */}
      <div className="taped-title handwritten">
        {story.title}
      </div>

      {/* Grid Layout for the Dashboard Notes */}
      <div style={styles.dashboardGrid}>
        
        {/* Card 1: Case Details & Victim Profile */}
        <div className="paper-note center-tape-note" style={styles.card}>
          <h2 className="handwritten" style={styles.cardHeader}>Victim Profile</h2>
          
          <div style={styles.contentBlock}>
            <p><strong>Case Number:</strong> {story.caseNumber}</p>
            <p><strong>Status:</strong> {story.status}</p>
            <p>
              <strong>Lead Detective:</strong>{' '}
              <span style={{ color: '#8b3a3a', fontWeight: 'bold' }}>
                {user ? `⭐ ${leadDetectiveDisplay}` : `🕵️ ${leadDetectiveDisplay}`}
              </span>
            </p>
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

        {/* Card 4: Case Board Status - Persons of Interest (Pure Text Aesthetic) */}
        <div className="paper-note center-tape-note" style={styles.card}>
          <h2 className="handwritten" style={styles.cardHeader}>
            Persons of Interest
          </h2>

          {displaySuspects.map((suspect) => (
            <div key={suspect.id} style={styles.contentBlock}>
              <h3 style={styles.subHeader}>
                {suspect.name} ({suspect.role})
              </h3>
              <ul style={styles.list}>
                <li><strong>Motive:</strong> {suspect.motive}</li>
                <li><strong>Alibi:</strong> {suspect.alibi}</li>
                <li><strong>Notes:</strong> {suspect.trait}</li>
              </ul>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}

const styles = {
  dashboardGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 340px), 1fr))',
    gap: '25px',
    width: '100%',
    maxWidth: '1400px',
    marginTop: '10px',
    alignItems: 'start'
  },
  card: {
    padding: 'clamp(18px, 3vw, 28px)',
    maxWidth: '100%',
    boxSizing: 'border-box' as const
  },
  cardHeader: {
    fontSize: 'clamp(1.7rem, 4vw, 2.2rem)',
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