import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useGameStore } from '../store/gameStore';
import { useAuthStore } from '../store/authStore';

export default function Navigation() {
  const { caseClosingTriggered, remainingClosingQuestions, interrogationLocked } = useGameStore();
  const { user, isGuest, openAuthModal, openProfileModal } = useAuthStore();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Close mobile menu whenever user navigates
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

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
    <>
      <nav style={styles.navBar}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <h2
            style={{
              fontFamily: "'Special Elite', monospace",
              margin: 0,
              fontSize: 'clamp(1.35rem, 3.5vw, 1.95rem)',
              color: '#ffd54f',
              letterSpacing: '1.5px',
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
                fontSize: '0.72rem',
                padding: '3px 8px',
                borderRadius: '8px',
                fontWeight: 'bold',
                letterSpacing: '0.5px'
              }}
            >
              🔒 LOCKED
            </span>
          ) : caseClosingTriggered ? (
            <span
              style={{
                backgroundColor: '#d97706',
                color: 'white',
                fontFamily: 'monospace',
                fontSize: '0.72rem',
                padding: '3px 8px',
                borderRadius: '8px',
                fontWeight: 'bold',
                letterSpacing: '0.5px',
                boxShadow: '0 0 10px rgba(217,119,6,0.6)'
              }}
            >
              ⏳ {remainingClosingQuestions} Qs LEFT
            </span>
          ) : null}
        </div>

        {/* Desktop Links (Hidden on screens <= 1024px) */}
        <div className="desktop-nav-links" style={styles.links}>
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
            Officer Davis
          </Link>
          <Link to="/warrant" style={{ ...styles.link, color: '#ff8a80', borderBottom: isActive('/warrant') ? '2px solid #ff8a80' : 'none' }}>
            Submit Warrant
          </Link>
          <Link to="/lead-board" style={{ ...styles.link, color: '#f6df9d', borderBottom: isActive('/lead-board') ? '2px solid #f6df9d' : 'none' }}>
            Lead Board
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
            Case Manager
          </Link>
        </div>

        {/* Desktop Detective Profile / Auth Pill — always at the far right, hidden on mobile */}
        <div className="desktop-nav-links" style={{ flexShrink: 0 }}>
          {!isGuest && user ? (
            <button
              type="button"
              onClick={openProfileModal}
              style={styles.authBadgeBtn}
              title="Inspect Detective Dossier, Badges & Rank"
            >
              <span style={{ fontSize: '0.95rem' }}>{getRankIcon(user.rank)}</span>
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
              
              <span style={styles.signInTag}>SIGN IN</span>
            </button>
          )}
        </div>

        {/* Mobile Hamburger Button (Visible only on screens <= 1024px) */}
        <button
          type="button"
          className="mobile-nav-toggle"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle navigation menu"
        >
          {mobileMenuOpen ? '✕' : '☰'}
        </button>
      </nav>

      {/* Mobile Navigation Dropdown Drawer */}
      {mobileMenuOpen && (
        <div style={styles.mobileDropdown}>
          <Link
            to="/"
            style={{
              ...styles.mobileLink,
              backgroundColor: isActive('/') ? 'rgba(255,213,79,0.18)' : 'transparent',
              color: isActive('/') ? '#ffd54f' : '#fff'
            }}
          >
            📁 Case Hub
          </Link>
          <Link
            to="/evidence"
            style={{
              ...styles.mobileLink,
              backgroundColor: isActive('/evidence') ? 'rgba(255,213,79,0.18)' : 'transparent',
              color: isActive('/evidence') ? '#ffd54f' : '#fff'
            }}
          >
            🔍 Evidence Locker
          </Link>
          <Link
            to="/locations"
            style={{
              ...styles.mobileLink,
              backgroundColor: isActive('/locations') ? 'rgba(255,213,79,0.18)' : 'transparent',
              color: isActive('/locations') ? '#ffd54f' : '#fff'
            }}
          >
            🏢 Locations
          </Link>
          <Link
            to="/suspects"
            style={{
              ...styles.mobileLink,
              backgroundColor: isActive('/suspects') ? 'rgba(255,213,79,0.18)' : 'transparent',
              color: isActive('/suspects') ? '#ffd54f' : '#fff'
            }}
          >
            👥 Suspects
          </Link>
          <Link
            to="/officer"
            style={{
              ...styles.mobileLink,
              backgroundColor: isActive('/officer') ? 'rgba(255,213,79,0.18)' : 'transparent',
              color: isActive('/officer') ? '#ffd54f' : '#fff'
            }}
          >
            🛡️ Officer Davis (Advisor)
          </Link>
          <Link
            to="/warrant"
            style={{
              ...styles.mobileLink,
              backgroundColor: isActive('/warrant') ? 'rgba(255,138,128,0.2)' : 'transparent',
              color: '#ff8a80'
            }}
          >
            ⚖️ Submit Warrant
          </Link>
          <Link
            to="/lead-board"
            style={{
              ...styles.mobileLink,
              backgroundColor: isActive('/lead-board') ? 'rgba(246,223,157,0.2)' : 'transparent',
              color: '#f6df9d'
            }}
          >
            🧷 Visual Lead Board
          </Link>
          <Link
            to="/story-creator"
            style={{
              ...styles.mobileLink,
              backgroundColor: isActive('/story-creator') ? 'rgba(167,255,235,0.2)' : 'transparent',
              color: '#a7ffeb'
            }}
          >
            ⚙️ Case Manager
          </Link>

          {/* Mobile Auth Button (Below Case Manager!) */}
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.15)', paddingTop: '10px', marginTop: '4px' }}>
            {!isGuest && user ? (
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  openProfileModal();
                }}
                style={{
                  ...styles.authBadgeBtn,
                  width: '100%',
                  justifyContent: 'center',
                  padding: '10px 14px',
                  borderRadius: '6px'
                }}
                title="Inspect Detective Dossier, Badges & Rank"
              >
                <span style={{ fontSize: '1.1rem' }}>{getRankIcon(user.rank)}</span>
                <span style={{ ...styles.agentCallsign, fontSize: '0.95rem' }}>Det. {user.username}</span>
                <span style={styles.rankBadge}>{user.rank}</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  openAuthModal('login');
                }}
                style={{
                  ...styles.guestPillBtn,
                  width: '100%',
                  justifyContent: 'center',
                  padding: '10px 14px',
                  borderRadius: '6px'
                }}
                title="Authenticate or Issue Detective Badge for Cloud Save & Creator Clearance"
              >
                <span style={{ fontSize: '1.1rem' }}>🕵️</span>
                <span style={{ ...styles.guestText, fontSize: '0.92rem' }}>Guest Agent</span>
                <span style={styles.signInTag}>SIGN IN</span>
              </button>
            )}
          </div>
        </div>
      )}
    </>
  );
}

const styles = {
  navBar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    background: '#1e293b',
    color: 'white',
    padding: '10px 20px',
    boxShadow: '0 4px 10px rgba(0,0,0,0.4)',
    position: 'fixed' as const,
    top: 0,
    left: 0,
    width: '100%',
    boxSizing: 'border-box' as const,
    zIndex: 1000,
    gap: '10px'
  },
  links: {
    display: 'flex',
    gap: '18px',
    alignItems: 'center'
  },
  link: {
    color: 'white',
    textDecoration: 'none',
    fontWeight: 'bold',
    fontFamily: 'monospace',
    fontSize: '0.92rem',
    paddingBottom: '2px',
    transition: 'color 0.2s',
    whiteSpace: 'nowrap' as const
  },
  mobileDropdown: {
    position: 'fixed' as const,
    top: '55px',
    left: 0,
    right: 0,
    backgroundColor: '#0f172a',
    borderBottom: '2px solid #ffd54f',
    boxShadow: '0 10px 25px rgba(0,0,0,0.7)',
    zIndex: 999,
    display: 'flex',
    flexDirection: 'column' as const,
    padding: '12px 16px',
    gap: '6px'
  },
  mobileLink: {
    padding: '10px 14px',
    borderRadius: '4px',
    textDecoration: 'none',
    fontFamily: 'monospace',
    fontSize: '0.95rem',
    fontWeight: 'bold',
    transition: 'background-color 0.15s ease',
    display: 'block'
  },
  authBadgeBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    backgroundColor: '#3e2723',
    border: '1.5px solid #ffd54f',
    padding: '4px 10px',
    borderRadius: '16px',
    cursor: 'pointer',
    color: '#fff',
    boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
    transition: 'all 0.15s ease',
    whiteSpace: 'nowrap' as const
  },
  agentCallsign: {
    fontFamily: "'Special Elite', monospace",
    fontSize: '0.85rem',
    color: '#ffd54f',
    fontWeight: 'bold',
    letterSpacing: '0.5px'
  },
  rankBadge: {
    backgroundColor: '#8b3a3a',
    color: '#fff',
    fontSize: '0.64rem',
    fontFamily: 'monospace',
    padding: '2px 6px',
    borderRadius: '8px',
    fontWeight: 'bold'
  },
  guestPillBtn: {
    display: 'flex',
    alignItems: 'center',


    gap: '6px',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    border: '1px solid #78909c',
    padding: '4px 10px',
    borderRadius: '16px',
    cursor: 'pointer',
    color: '#cfd8dc',
    transition: 'all 0.15s ease',
    whiteSpace: 'nowrap' as const
  },
  guestText: {
    fontFamily: 'monospace',
    fontSize: '0.8rem'
  },
  signInTag: {
    backgroundColor: 'transparent',
    color: 'white',
    fontFamily: "'Special Elite', monospace",
    fontSize: '0.85rem',
    padding: '4px 4px 2px 4px',
    borderRadius: '4px',
    fontWeight: 'bold',
    letterSpacing: '0.5px',
  },
};
