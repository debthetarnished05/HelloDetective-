import { Link, useLocation } from 'react-router-dom';
import { useGameStore } from '../store/gameStore';
import { useAuthStore } from '../store/authStore';

export default function Navigation() {
  const { caseClosingTriggered, remainingClosingQuestions, interrogationLocked } = useGameStore();
  const { user, isGuest, openAuthModal, openProfileModal } = useAuthStore();
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  const getRankIcon = (rank?: string) => {
    switch (rank) {
      case 'Chief Commissioner': return '⭐';
      case 'Senior Special Agent': return '🥇';
      case 'Special Agent': return '🥈';
      case 'Junior Agent': return '🥉';
      default: return '🔰';
    }
  };

  return (
    <nav style={styles.navBar}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '15px', flexWrap: 'wrap' }}>
        <h2
          style={{
            fontFamily: "'Special Elite', monospace",
            margin: 0,
            fontSize: '1.95rem',
            color: '#ffd54f',
            letterSpacing: '2px',
            textShadow: '0 0 12px rgba(255, 213, 79, 0.35), 2px 2px 4px rgba(0, 0, 0, 0.85)'
          }}
        >
          HelloDetective!
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
        ) : null}
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

        {/* Detective Profile / Auth Pill */}
        {!isGuest && user ? (
          <button
            type="button"
            onClick={openProfileModal}
            style={styles.authBadgeBtn}
            title="Inspect Detective Dossier, Badges & Rank"
          >
            <span style={{ fontSize: '1rem' }}>{getRankIcon(user.rank)}</span>
            <span style={styles.agentCallsign}>Det. {user.username}</span>
            <span style={styles.rankBadge}>{user.rank}</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={() => openAuthModal('login')}
            style={styles.guestPillBtn}
            title="Authenticate or Issue Detective Badge for Cloud Save & Creator Clearance"
          >
            <span style={{ fontSize: '1rem' }}>🕵️</span>
            <span style={styles.guestText}>Guest Agent</span>
            <span style={styles.signInTag}>SIGN IN</span>
          </button>
        )}
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
  },
  authBadgeBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    backgroundColor: '#3e2723',
    border: '1.5px solid #ffd54f',
    padding: '4px 10px',
    borderRadius: '16px',
    cursor: 'pointer',
    color: '#fff',
    boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
    transition: 'all 0.15s ease'
  },
  agentCallsign: {
    fontFamily: "'Special Elite', monospace",
    fontSize: '0.9rem',
    color: '#ffd54f',
    fontWeight: 'bold',
    letterSpacing: '0.5px'
  },
  rankBadge: {
    backgroundColor: '#8b3a3a',
    color: '#fff',
    fontSize: '0.68rem',
    fontFamily: 'monospace',
    padding: '2px 7px',
    borderRadius: '8px',
    fontWeight: 'bold'
  },
  guestPillBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    border: '1px solid #78909c',
    padding: '4px 10px',
    borderRadius: '16px',
    cursor: 'pointer',
    color: '#cfd8dc',
    transition: 'all 0.15s ease'
  },
  guestText: {
    fontFamily: 'monospace',
    fontSize: '0.85rem'
  },
  signInTag: {
    backgroundColor: '#8b3a3a',
    color: '#ffd54f',
    fontFamily: "'Special Elite', monospace",
    fontSize: '0.72rem',
    padding: '2px 6px',
    borderRadius: '4px',
    fontWeight: 'bold',
    letterSpacing: '0.5px'
  }
};