import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { useGameStore } from '../store/gameStore';

export default function AuthModal() {
  const { authModalOpen, authModalInitialTab, authModalMessage, closeAuthModal, login, register, isLoading } = useAuthStore();
  const { sessionId } = useGameStore();

  const [tab, setTab] = useState<'login' | 'register'>('login');
  const [identifier, setIdentifier] = useState(''); // username or email for login
  const [regUsername, setRegUsername] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (authModalOpen) {
      setTab(authModalInitialTab);
      setErrorMsg(null);
    }
  }, [authModalOpen, authModalInitialTab]);

  if (!authModalOpen) return null;

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    if (!identifier.trim() || !loginPassword) {
      setErrorMsg('Please enter both your Detective Callsign/Email and Security Key.');
      return;
    }
    try {
      await login(identifier.trim(), loginPassword, sessionId || undefined);
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error || err.message || 'Authentication failed. Check your credentials.');
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    if (!regUsername.trim() || !regEmail.trim() || !regPassword) {
      setErrorMsg('All fields are mandatory for Department badge issuance.');
      return;
    }
    if (regPassword.length < 12 || new TextEncoder().encode(regPassword).length > 72) {
      setErrorMsg('Security key must contain at least 12 characters and no more than 72 UTF-8 bytes.');
      return;
    }
    try {
      await register(regUsername.trim(), regEmail.trim(), regPassword, sessionId || undefined);
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error || err.message || 'Badge registration rejected.');
    }
  };

  return (
    <div style={styles.overlay} onClick={closeAuthModal}>
      <div 
        className="custom-detective-scroll"
        style={styles.modalBox} 
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Manila Clip / Stamp */}
        <div style={styles.stampHeader}>
          <span style={styles.rubberStamp}>CONFIDENTIAL</span>
          <button style={styles.closeBtn} onClick={closeAuthModal} title="Close dossier">
            ✕
          </button>
        </div>

        {/* Bureau Header */}
        <div style={styles.headerArea}>
          <div style={{ fontSize: '1.75rem', marginBottom: '2px' }}>🛡️</div>
          <h2 style={styles.title}>BUREAU PERSONNEL REGISTRY</h2>
          <p style={styles.subtitle}>
            Authenticate with official credentials or issue a new Detective Badge.
          </p>
        </div>

        {/* Message Banner (if triggered by locked features) */}
        {authModalMessage && (
          <div style={styles.lockNotice}>
            🔒 <strong>RESTRICTED ACCESS:</strong> {authModalMessage}
          </div>
        )}

        {/* Tabs: Sign In / Issue Badge */}
        <div style={styles.tabContainer}>
          <button
            type="button"
            onClick={() => { setTab('login'); setErrorMsg(null); }}
            style={{
              ...styles.tabButton,
              backgroundColor: tab === 'login' ? '#8b3a3a' : '#d7ccc8',
              color: tab === 'login' ? '#fff' : '#3e2723',
              boxShadow: tab === 'login' ? 'inset 0 -2px 0 #ffd54f' : 'none'
            }}
          >
            📂 DETECTIVE SIGN IN
          </button>
          <button
            type="button"
            onClick={() => { setTab('register'); setErrorMsg(null); }}
            style={{
              ...styles.tabButton,
              backgroundColor: tab === 'register' ? '#8b3a3a' : '#d7ccc8',
              color: tab === 'register' ? '#fff' : '#3e2723',
              boxShadow: tab === 'register' ? 'inset 0 -2px 0 #ffd54f' : 'none'
            }}
          >
            🎖️ ISSUE NEW BADGE
          </button>
        </div>

        {/* Error Bulletin */}
        {errorMsg && (
          <div style={styles.errorBulletin}>
            ⚠️ <strong>ALERT:</strong> {errorMsg}
          </div>
        )}

        {/* Form Content */}
        {tab === 'login' ? (
          <form onSubmit={handleLoginSubmit} style={styles.form}>
            <div style={styles.inputGroup}>
              <label style={styles.label}>USERNAME/EMAIL</label>
              <input
                type="text"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="e.g. Callahan or detective@precinct.org"
                style={styles.input}
                autoFocus
                required
              />
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}>SECURITY CLEARANCE KEY (PASSWORD)</label>
              <input
                type="password"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                placeholder="••••••••"
                style={styles.input}
                required
              />
            </div>

            <div style={styles.infoBox}>
              💡 <em>Guest progress in active cases will automatically be linked and saved permanently to your profile upon login.</em>
            </div>

            <button type="submit" disabled={isLoading} style={styles.submitBtn}>
              {isLoading ? 'VERIFYING CREDENTIALS...' : 'ACCESS CLASSIFIED DOSSIERS →'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleRegisterSubmit} style={styles.form}>
            <div style={styles.inputGroup}>
              <label style={styles.label}>USERNAME</label>
              <input
                type="text"
                value={regUsername}
                onChange={(e) => setRegUsername(e.target.value)}
                placeholder="e.g. Jack Callahan, Veronica Vance"
                style={styles.input}
                autoFocus
                required
              />
              
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}>EMAIL</label>
              <input
                type="email"
                value={regEmail}
                onChange={(e) => setRegEmail(e.target.value)}
                placeholder="detective@precinct.city"
                style={styles.input}
                required
              />
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}>CREATE SECURITY KEY (PASSWORD)</label>
              <input
                type="password"
                value={regPassword}
                onChange={(e) => setRegPassword(e.target.value)}
                minLength={12}
                maxLength={72}
                placeholder="Minimum 12 characters"
                style={styles.input}
                required
              />
            </div>

            <div style={styles.privilegesBox}>
              <div style={{ fontWeight: 'bold', color: '#5d4037', marginBottom: '4px' }}>
                ⭐ REGISTERED DETECTIVE PERKS:
              </div>
              <ul style={styles.perksList}>
                <li>Permanent cloud save & cross-device case synchronisation</li>
                <li>Full access to <strong>AI Mystery Generator</strong> & <strong>Case Builder</strong></li>
                <li>Unlock <strong>Classified Case Solutions & True Stories</strong></li>
                <li>Earn Detective Ranks (Rookie → Chief Commissioner) & Achievement Badges</li>
              </ul>
            </div>

            <button type="submit" disabled={isLoading} style={styles.submitBtn}>
              {isLoading ? 'ISSUING BADGE...' : 'ISSUE OFFICIAL BADGE →'}
            </button>
          </form>
        )}

        {/* Footer Note */}
        <div style={styles.footerNote}>
          Playing as a guest? You can still investigate all unlocked crimes freely!
        </div>
      </div>
    </div>
  );
}

const styles = {
  overlay: {
    position: 'fixed' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(15, 10, 5, 0.78)',
    backdropFilter: 'blur(4px)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'flex-start',
    zIndex: 9999,
    padding: '20px 16px',
    boxSizing: 'border-box' as const,
    overflowY: 'auto' as const
  },
  modalBox: {
    backgroundColor: '#f6f1e3',
    backgroundImage: `
      radial-gradient(circle at 50% 0%, rgba(255, 235, 180, 0.3) 0%, rgba(240, 225, 195, 0.95) 100%),
      url('https://www.transparenttextures.com/patterns/aged-paper.png')
    `,
    width: '100%',
    maxWidth: '520px',
    overflowY: 'visible' as const,
    margin: '0 auto',
    borderRadius: '6px',
    boxShadow: '0 20px 45px rgba(0,0,0,0.65), 0 0 0 2px #5d4037, 0 0 0 6px #d7ccc8',
    padding: '20px 24px',
    boxSizing: 'border-box' as const,
    color: '#2d241e',
    position: 'relative' as const,
    fontFamily: "'Courier New', Courier, monospace"
  },
  stampHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottom: '2px solid #5d4037',
    paddingBottom: '8px',
    marginBottom: '10px'
  },
  rubberStamp: {
    fontFamily: "'Special Elite', monospace",
    fontSize: '0.82rem',
    color: '#b71c1c',
    letterSpacing: '1.5px',
    textTransform: 'uppercase' as const,
    border: '2px solid #b71c1c',
    padding: '2px 8px',
    borderRadius: '3px',
    transform: 'rotate(-1deg)'
  },
  closeBtn: {
    background: 'none',
    border: 'none',
    fontSize: '1.3rem',
    color: '#5d4037',
    cursor: 'pointer',
    fontWeight: 'bold',
    lineHeight: 1
  },
  headerArea: {
    textAlign: 'center' as const,
    marginBottom: '10px'
  },
  title: {
    fontFamily: "'Special Elite', monospace",
    fontSize: '1.4rem',
    color: '#3e2723',
    letterSpacing: '1px',
    margin: '2px 0'
  },
  subtitle: {
    fontSize: '0.8rem',
    color: '#6d4c41',
    lineHeight: 1.3
  },
  lockNotice: {
    backgroundColor: '#fff3e0',
    borderLeft: '4px solid #ef6c00',
    color: '#c44d00',
    padding: '6px 10px',
    fontSize: '0.78rem',
    lineHeight: 1.35,
    marginBottom: '10px',
    borderRadius: '2px'
  },
  tabContainer: {
    display: 'flex',
    gap: '8px',
    marginBottom: '12px'
  },
  tabButton: {
    flex: 1,
    padding: '8px 6px',
    border: '1px solid #8d6e63',
    borderRadius: '4px',
    cursor: 'pointer',
    fontFamily: "'Special Elite', monospace",
    fontSize: '0.82rem',
    fontWeight: 'bold',
    letterSpacing: '0.5px',
    transition: 'all 0.15s ease'
  },
  errorBulletin: {
    backgroundColor: '#ffebee',
    border: '1px solid #ef5350',
    color: '#c62828',
    padding: '8px 12px',
    fontSize: '0.8rem',
    borderRadius: '4px',
    marginBottom: '10px'
  },
  form: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '10px'
  },
  inputGroup: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '3px'
  },
  label: {
    fontSize: '0.74rem',
    fontWeight: 'bold',
    color: '#4e342e',
    letterSpacing: '0.5px'
  },
  hint: {
    fontSize: '0.7rem',
    color: '#795548',
    fontStyle: 'italic'
  },
  input: {
    padding: '8px 10px',
    fontSize: '0.9rem',
    backgroundColor: '#fffdf7',
    border: '1px solid #a1887f',
    borderRadius: '3px',
    color: '#212121',
    fontFamily: 'monospace',
    outline: 'none',
    boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.1)'
  },
  infoBox: {
    fontSize: '0.78rem',
    color: '#5d4037',
    backgroundColor: 'rgba(215, 204, 200, 0.45)',
    padding: '7px 10px',
    borderRadius: '3px',
    borderLeft: '3px solid #8d6e63',
    lineHeight: 1.35
  },
  privilegesBox: {
    fontSize: '0.75rem',
    backgroundColor: '#efebe9',
    border: '1px solid #d7ccc8',
    borderRadius: '4px',
    padding: '8px 10px'
  },
  perksList: {
    margin: '3px 0 0 16px',
    padding: 0,
    color: '#4e342e',
    lineHeight: 1.35
  },
  submitBtn: {
    backgroundColor: '#8b3a3a',
    color: '#ffd54f',
    border: '2px solid #5c1818',
    padding: '10px 16px',
    borderRadius: '4px',
    fontFamily: "'Special Elite', monospace",
    fontSize: '0.92rem',
    fontWeight: 'bold',
    letterSpacing: '0.8px',
    cursor: 'pointer',
    marginTop: '4px',
    boxShadow: '0 3px 8px rgba(0,0,0,0.3)',
    transition: 'all 0.15s ease'
  },
  footerNote: {
    textAlign: 'center' as const,
    fontSize: '0.74rem',
    color: '#8d6e63',
    marginTop: '10px',
    fontStyle: 'italic'
  }
};
