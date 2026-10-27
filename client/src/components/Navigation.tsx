import { Link, useLocation } from 'react-router-dom';
import { useGameStore } from '../store/gameStore';

export default function Navigation() {
  const { story, caseClosingTriggered, remainingClosingQuestions, interrogationLocked } = useGameStore();
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav style={styles.navBar}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
        <h2 style={{ fontFamily: 'Caveat, cursive', margin: 0, fontSize: '1.8rem', color: '#ffd54f' }}>
          {story?.title || 'Hello Detective!'}
        </h2>
        {interrogationLocked ? (
          <span
            style={{
              backgroundColor: '#b71c1c',
              color: 'white',
              fontFamily: 'monospace',
              fontSize: '0.75rem',
              padding: '4px 10px',
              borderRadius: '10px',
              fontWeight: 'bold',
              letterSpacing: '0.5px'
            }}
          >
            🔒 INTERROGATION LOCKED
          </span>
        ) : caseClosingTriggered ? (
          <span
            style={{
              backgroundColor: '#d97706',
              color: 'white',
              fontFamily: 'monospace',
              fontSize: '0.75rem',
              padding: '4px 10px',
              borderRadius: '10px',
              fontWeight: 'bold',
              letterSpacing: '0.5px',
              boxShadow: '0 0 10px rgba(217,119,6,0.6)'
            }}
          >
            ⏳ CLOSING ({remainingClosingQuestions} Qs LEFT)
          </span>
        ) : (
          <span
            style={{
              backgroundColor: '#1e40af',
              color: 'white',
              fontFamily: 'monospace',
              fontSize: '0.75rem',
              padding: '3px 9px',
              borderRadius: '10px',
              fontWeight: 'bold'
            }}
          >
            ACTIVE CASE
          </span>
        )}
      </div>

      <div style={styles.links}>
        <Link to="/" style={{ ...styles.link, borderBottom: isActive('/') ? '2px solid #ffd54f' : 'none' }}>
          Case Hub
        </Link>
        <Link to="/evidence" style={{ ...styles.link, borderBottom: isActive('/evidence') ? '2px solid #ffd54f' : 'none' }}>
          Evidence Locker
        </Link>
        <Link to="/locations" style={{ ...styles.link, borderBottom: isActive('/locations') ? '2px solid #ffd54f' : 'none' }}>
          Locations
        </Link>
        <Link to="/suspects" style={{ ...styles.link, borderBottom: isActive('/suspects') ? '2px solid #ffd54f' : 'none' }}>
          Suspects
        </Link>
        <Link to="/officer" style={{ ...styles.link, borderBottom: isActive('/officer') ? '2px solid #ffd54f' : 'none' }}>
          Officer Davis (Advisor)
        </Link>
        <Link to="/warrant" style={{ ...styles.link, color: '#ff8a80', borderBottom: isActive('/warrant') ? '2px solid #ff8a80' : 'none' }}>
          Submit Warrant
        </Link>
        <Link
          to="/story-creator"
          style={{
            ...styles.link,
            backgroundColor: 'rgba(255,255,255,0.15)',
            padding: '5px 12px',
            borderRadius: '4px',
            color: '#a7ffeb',
            borderBottom: isActive('/story-creator') ? '2px solid #a7ffeb' : 'none'
          }}
        >
          ⚙️ Case Manager
        </Link>
      </div>
    </nav>
  );
}

const styles = {
  navBar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    background: '#1e293b',
    color: 'white',
    padding: '12px 25px',
    boxShadow: '0 4px 10px rgba(0,0,0,0.4)',
    position: 'fixed' as const,
    top: 0,
    left: 0,
    width: '100%',
    boxSizing: 'border-box' as const,
    zIndex: 1000,
    flexWrap: 'wrap' as const,
    gap: '15px'
  },
  links: {
    display: 'flex',
    gap: '18px',
    alignItems: 'center',
    flexWrap: 'wrap' as const
  },
  link: {
    color: 'white',
    textDecoration: 'none',
    fontWeight: 'bold',
    fontFamily: 'monospace',
    fontSize: '0.92rem',
    paddingBottom: '2px',
    transition: 'color 0.2s'
  }
};