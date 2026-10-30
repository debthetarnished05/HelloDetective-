import { useAuthStore } from '../store/authStore';
import type { DetectiveRank, IUserBadge } from '../types/auth';

const ALL_POSSIBLE_BADGES: {
  id: string;
  title: string;
  icon: string;
  description: string;
  requirement: string;
}[] = [
  {
    id: 'smoking_gun',
    title: 'Smoking Gun',
    icon: '🔫',
    description: 'Cracked the case with conclusive physical evidence.',
    requirement: 'Solve an investigation with at least 3 pieces of evidence unlocked.'
  },
  {
    id: 'forensic_eagle',
    title: 'Forensic Eagle',
    icon: '🦅',
    description: 'Scoured every single crime scene location without missing a clue.',
    requirement: 'Canvass 100% of the crime scene locations before indicting.'
  },
  {
    id: 'flawless_juror',
    title: 'Flawless Juror',
    icon: '⚖️',
    description: 'Secured an indictment score of 90 or above before the Grand Jury.',
    requirement: 'Score 90+ on your warrant submission with perfect motive & weapon alignment.'
  },
  {
    id: 'beat_the_clock',
    title: 'Beat the Clock',
    icon: '⏳',
    description: 'Secured the indictment before the 12-hour interrogation limit expired.',
    requirement: 'Submit a winning warrant while closing questions remain in play.'
  },
  {
    id: 'patsy_shield',
    title: 'Patsy Shield',
    icon: '🛡️',
    description: 'Saw through the red herrings and indicted the real culprit on first attempt.',
    requirement: 'Never file a faulty warrant accusing an innocent fall guy.'
  },
  {
    id: 'mastermind_catcher',
    title: 'Mastermind Catcher',
    icon: '🎖️',
    description: 'Brought 3 or more criminal masterminds to justice.',
    requirement: 'Successfully solve 3 distinct homicide cases across the bureau.'
  }
];

const RANK_THRESHOLDS: { rank: DetectiveRank; cases: number; icon: string }[] = [
  { rank: 'Rookie Agent', cases: 0, icon: '🔰' },
  { rank: 'Junior Agent', cases: 1, icon: '🥉' },
  { rank: 'Special Agent', cases: 2, icon: '🥈' },
  { rank: 'Senior Special Agent', cases: 4, icon: '🥇' },
  { rank: 'Chief Commissioner', cases: 6, icon: '⭐' }
];

export default function DetectiveProfileModal() {
  const { user, profileModalOpen, closeProfileModal, logout } = useAuthStore();

  if (!profileModalOpen || !user) return null;

  const userBadgesMap = new Map<string, IUserBadge>();
  (user.badges || []).forEach((b) => userBadgesMap.set(b.id, b));

  const solvedCount = (user.casesSolved || []).length;

  return (
    <div style={styles.overlay} onClick={closeProfileModal}>
      <div style={styles.modalBox} onClick={(e) => e.stopPropagation()}>
        {/* Header Bar */}
        <div style={styles.topBar}>
          <div style={styles.stampHeader}>
            <span style={styles.rubberStamp}>HOMICIDE DIVISION • SERVICE DOSSIER</span>
          </div>
          <button style={styles.closeBtn} onClick={closeProfileModal} title="Close dossier">
            ✕
          </button>
        </div>

        {/* Bureau Identification Card */}
        <div style={styles.idCard}>
          <div style={styles.badgeShield}>
            <div style={{ fontSize: '3rem', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.4))' }}>⭐</div>
            <div style={styles.badgeIdText}>HB-{user.id.slice(-6).toUpperCase()}</div>
          </div>
          <div style={styles.idInfo}>
            <div style={styles.idSubTitle}>HOMICIDE BUREAU INVESTIGATOR</div>
            <h2 style={styles.detectiveName}>Detective {user.username}</h2>
            <div style={styles.rankPill}>
              <span>{user.rank}</span>
            </div>
            <div style={styles.emailText}>Precinct Record: {user.email}</div>
          </div>
        </div>

        {/* Rank Progression Track */}
        <div style={styles.section}>
          <div style={styles.sectionTitle}>
            <span>🏆 RANK PROGRESSION</span>
            <span style={{ fontSize: '0.8rem', color: '#6d4c41' }}>
              {solvedCount} {solvedCount === 1 ? 'Case' : 'Cases'} Solved
            </span>
          </div>
          <div style={styles.rankTrack}>
            {RANK_THRESHOLDS.map((tier) => {
              const isAchieved = solvedCount >= tier.cases;
              const isCurrent = user.rank === tier.rank;
              return (
                <div
                  key={tier.rank}
                  style={{
                    ...styles.rankStep,
                    opacity: isAchieved ? 1 : 0.45,
                    border: isCurrent ? '2px solid #ffd54f' : '1px solid #8d6e63',
                    backgroundColor: isCurrent ? 'rgba(255, 213, 79, 0.2)' : isAchieved ? '#efebe9' : '#e0e0e0'
                  }}
                >
                  <div style={{ fontSize: '1.2rem' }}>{tier.icon}</div>
                  <div style={styles.rankStepTitle}>{tier.rank}</div>
                  <div style={styles.rankStepCases}>{tier.cases}+ solved</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Career Stats Grid */}
        <div style={styles.section}>
          <div style={styles.sectionTitle}>📊 CAREER PERFORMANCE DOSSIER</div>
          <div style={styles.statsGrid}>
            <div style={styles.statBox}>
              <div style={styles.statVal}>{solvedCount}</div>
              <div style={styles.statLbl}>CASES CRACKED</div>
            </div>
            <div style={styles.statBox}>
              <div style={styles.statVal}>{user.stats?.totalWarrantsFiled || 0}</div>
              <div style={styles.statLbl}>WARRANTS FILED</div>
            </div>
            <div style={styles.statBox}>
              <div style={styles.statVal}>{user.stats?.totalConvictions || 0}</div>
              <div style={styles.statLbl}>CONVICTIONS</div>
            </div>
            <div style={styles.statBox}>
              <div style={styles.statVal}>{user.badges?.length || 0} / 6</div>
              <div style={styles.statLbl}>BADGES EARNED</div>
            </div>
          </div>
        </div>

        {/* Badge Ribbon Rack */}
        <div style={styles.section}>
          <div style={styles.sectionTitle}>🎖️ DEPARTMENT COMMENDATION BADGES</div>
          <div style={styles.badgesGrid}>
            {ALL_POSSIBLE_BADGES.map((badgeDef) => {
              const earned = userBadgesMap.get(badgeDef.id);
              return (
                <div
                  key={badgeDef.id}
                  style={{
                    ...styles.badgeItem,
                    backgroundColor: earned ? '#fffde7' : '#eceff1',
                    border: earned ? '2px solid #fbc02d' : '1px dashed #b0bec5',
                    boxShadow: earned ? '0 2px 6px rgba(251, 192, 45, 0.35)' : 'none'
                  }}
                >
                  <div style={styles.badgeTop}>
                    <span style={{ fontSize: '1.6rem', filter: earned ? 'none' : 'grayscale(100%) opacity(40%)' }}>
                      {badgeDef.icon}
                    </span>
                    <span
                      style={{
                        ...styles.statusTag,
                        backgroundColor: earned ? '#2e7d32' : '#78909c'
                      }}
                    >
                      {earned ? 'EARNED' : 'LOCKED'}
                    </span>
                  </div>
                  <div style={styles.badgeTitle}>{badgeDef.title}</div>
                  <div style={styles.badgeDesc}>{badgeDef.description}</div>
                  {!earned && <div style={styles.reqHint}>🔒 Req: {badgeDef.requirement}</div>}
                  {earned && (
                    <div style={styles.earnedDate}>
                      ✓ Unlocked {new Date(earned.unlockedAt).toLocaleDateString()}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Action Buttons */}
        <div style={styles.footerBtns}>
          <button
            type="button"
            onClick={logout}
            style={styles.logoutBtn}
            title="Sign out of Detective account"
          >
            🚪 Return Badge & Clock Out
          </button>
          <button
            type="button"
            onClick={closeProfileModal}
            style={styles.resumeBtn}
          >
            Return to Active Investigation
          </button>
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
    backgroundColor: 'rgba(15, 10, 5, 0.82)',
    backdropFilter: 'blur(4px)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
    padding: '20px'
  },
  modalBox: {
    backgroundColor: '#f6f1e3',
    backgroundImage: `
      radial-gradient(circle at 50% 0%, rgba(255, 235, 180, 0.25) 0%, rgba(240, 225, 195, 0.95) 100%),
      url('https://www.transparenttextures.com/patterns/aged-paper.png')
    `,
    width: '100%',
    maxWidth: '680px',
    maxHeight: '90vh',
    overflowY: 'auto' as const,
    borderRadius: '6px',
    boxShadow: '0 20px 50px rgba(0,0,0,0.7), 0 0 0 2px #5d4037, 0 0 0 6px #d7ccc8',
    padding: '26px 28px',
    boxSizing: 'border-box' as const,
    color: '#2d241e',
    fontFamily: "'Courier New', Courier, monospace"
  },
  topBar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottom: '2px solid #5d4037',
    paddingBottom: '10px',
    marginBottom: '16px'
  },
  stampHeader: {
    display: 'flex',
    alignItems: 'center'
  },
  rubberStamp: {
    fontFamily: "'Special Elite', monospace",
    fontSize: '0.9rem',
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
    fontSize: '1.4rem',
    color: '#5d4037',
    cursor: 'pointer',
    fontWeight: 'bold',
    lineHeight: 1
  },
  idCard: {
    display: 'flex',
    alignItems: 'center',
    gap: '20px',
    backgroundColor: '#3e2723',
    color: '#f5f5f5',
    padding: '16px 20px',
    borderRadius: '6px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
    border: '2px solid #ffd54f',
    marginBottom: '20px',
    flexWrap: 'wrap' as const
  },
  badgeShield: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#261b17',
    padding: '12px 16px',
    borderRadius: '6px',
    border: '1px solid #ffd54f'
  },
  badgeIdText: {
    fontFamily: 'monospace',
    fontSize: '0.75rem',
    color: '#ffd54f',
    fontWeight: 'bold',
    marginTop: '4px',
    letterSpacing: '1px'
  },
  idInfo: {
    flex: 1,
    minWidth: '220px'
  },
  idSubTitle: {
    fontFamily: 'monospace',
    fontSize: '0.72rem',
    color: '#bcaaa4',
    letterSpacing: '1.5px'
  },
  detectiveName: {
    fontFamily: "'Special Elite', monospace",
    fontSize: '1.6rem',
    color: '#ffd54f',
    margin: '4px 0 6px 0',
    letterSpacing: '1px'
  },
  rankPill: {
    display: 'inline-block',
    backgroundColor: '#8b3a3a',
    color: '#fff',
    fontFamily: "'Special Elite', monospace",
    fontSize: '0.85rem',
    padding: '3px 12px',
    borderRadius: '12px',
    fontWeight: 'bold',
    letterSpacing: '0.8px',
    marginBottom: '6px'
  },
  emailText: {
    fontSize: '0.75rem',
    color: '#d7ccc8'
  },
  section: {
    marginBottom: '20px'
  },
  sectionTitle: {
    fontFamily: "'Special Elite', monospace",
    fontSize: '0.92rem',
    fontWeight: 'bold',
    color: '#4e342e',
    letterSpacing: '1px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottom: '1px dashed #8d6e63',
    paddingBottom: '4px',
    marginBottom: '10px'
  },
  rankTrack: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))',
    gap: '8px'
  },
  rankStep: {
    padding: '10px 8px',
    borderRadius: '5px',
    textAlign: 'center' as const,
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    gap: '3px'
  },
  rankStepTitle: {
    fontFamily: "'Special Elite', monospace",
    fontSize: '0.75rem',
    fontWeight: 'bold',
    color: '#3e2723'
  },
  rankStepCases: {
    fontSize: '0.68rem',
    color: '#6d4c41'
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: '10px'
  },
  statBox: {
    backgroundColor: '#fffdf7',
    border: '1px solid #bcaaa4',
    padding: '10px 6px',
    borderRadius: '4px',
    textAlign: 'center' as const
  },
  statVal: {
    fontFamily: "'Special Elite', monospace",
    fontSize: '1.45rem',
    color: '#8b3a3a',
    fontWeight: 'bold'
  },
  statLbl: {
    fontSize: '0.66rem',
    color: '#5d4037',
    fontWeight: 'bold',
    letterSpacing: '0.5px',
    marginTop: '2px'
  },
  badgesGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
    gap: '10px'
  },
  badgeItem: {
    padding: '10px',
    borderRadius: '5px',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '4px'
  },
  badgeTop: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  statusTag: {
    color: 'white',
    fontSize: '0.62rem',
    fontWeight: 'bold',
    padding: '2px 6px',
    borderRadius: '3px',
    letterSpacing: '0.5px'
  },
  badgeTitle: {
    fontFamily: "'Special Elite', monospace",
    fontSize: '0.85rem',
    fontWeight: 'bold',
    color: '#3e2723'
  },
  badgeDesc: {
    fontSize: '0.72rem',
    color: '#5d4037',
    lineHeight: 1.3
  },
  reqHint: {
    fontSize: '0.66rem',
    color: '#78909c',
    fontStyle: 'italic',
    marginTop: '4px'
  },
  earnedDate: {
    fontSize: '0.66rem',
    color: '#2e7d32',
    fontWeight: 'bold',
    marginTop: '4px'
  },
  footerBtns: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '12px',
    borderTop: '2px solid #8d6e63',
    paddingTop: '16px',
    marginTop: '10px',
    flexWrap: 'wrap' as const
  },
  logoutBtn: {
    backgroundColor: '#5d4037',
    color: '#ffcdd2',
    border: '1px solid #3e2723',
    padding: '9px 14px',
    borderRadius: '4px',
    fontFamily: "'Special Elite', monospace",
    fontSize: '0.82rem',
    cursor: 'pointer'
  },
  resumeBtn: {
    backgroundColor: '#8b3a3a',
    color: '#ffd54f',
    border: '2px solid #5c1818',
    padding: '9px 18px',
    borderRadius: '4px',
    fontFamily: "'Special Elite', monospace",
    fontSize: '0.88rem',
    fontWeight: 'bold',
    cursor: 'pointer'
  }
};
