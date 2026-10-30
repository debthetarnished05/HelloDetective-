import { useEffect } from 'react';
import type { IStory } from '../types/index';
import { ARCHETYPE_OPTIONS, getCleanArchetypeTitle } from '../pages/StoryCreator';

interface OpenCaseFolderModalProps {
  story: IStory | null;
  onClose: () => void;
  onLaunch: (storyId: string) => void;
  isLoading?: boolean;
}

export default function OpenCaseFolderModal({
  story,
  onClose,
  onLaunch,
  isLoading = false
}: OpenCaseFolderModalProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!story) return null;

  const archetypeInfo = ARCHETYPE_OPTIONS.find(
    (a) => a.value === story.groundTruth?.archetype
  );

  return (
    <div style={styles.overlay} onClick={onClose}>
      {/* Outer wrapper containing CLOSE button and the open folder */}
      <div style={styles.modalWrapper} onClick={(e) => e.stopPropagation()}>
        {/* Sleek Dark CLOSE Button on Top Right (matching reference image) */}
        <div style={styles.topBar}>
          <button style={styles.closeBtn} onClick={onClose} title="Close case folder (Esc)">
            CLOSE
          </button>
        </div>

        {/* The Open Manila / Kraft Folder */}
        <div style={styles.folderContainer}>
          {/* Central Spine fold shadow */}
          <div style={styles.folderSpine}></div>

          {/* ================= LEFT PAGE (AUTOPSY & VICTIM PROFILE DOSSIER) ================= */}
          <div style={styles.folderPageLeft}>
            <div style={styles.paperSheet}>
              {/* Header: Red Stamped Box on left, Autopsy Tab on right */}
              <div style={styles.leftPageHeader}>
                <div style={styles.caseStampBox}>
                  CASE #{story.caseNumber || '0000'}
                </div>

                <div style={styles.sheetTabGroup}>
                  <button
                    type="button"
                    style={{
                      ...styles.sheetTabBtn,
                      borderBottom: '2px solid #8b3a3a',
                      fontWeight: 'bold',
                      color: '#8b3a3a',
                      fontSize: '0.86rem'
                    }}
                  >
                    Autopsy
                  </button>
                </div>
              </div>

              {/* Title of active sheet */}
              <h2 style={styles.pageTitle}>Autopsy</h2>

              {/* Autopsy & Victim Profile Dossier Content */}
              <div style={styles.cardListScroll}>
                {story.victimProfile && (
                  <div style={styles.autopsyReportBox}>
                    <div style={styles.autopsyHeader}>
                      📋 OFFICIAL AUTOPSY & VICTIM PROFILE
                    </div>

                    <div style={styles.autopsyGrid}>
                      <div style={styles.autopsyField}>
                        <span style={styles.autopsyLabel}>DECEASED:</span>
                        <span style={styles.autopsyVal}>{story.victimProfile.name}</span>
                      </div>
                      <div style={styles.autopsyField}>
                        <span style={styles.autopsyLabel}>AGE / SEX:</span>
                        <span style={styles.autopsyVal}>{story.victimProfile.age} y/o</span>
                      </div>
                      <div style={styles.autopsyField}>
                        <span style={styles.autopsyLabel}>OCCUPATION:</span>
                        <span style={styles.autopsyVal}>{story.victimProfile.occupation}</span>
                      </div>
                      <div style={styles.autopsyField}>
                        <span style={styles.autopsyLabel}>DISCOVERED:</span>
                        <span style={styles.autopsyVal}>{story.victimProfile.discovered}</span>
                      </div>
                      <div style={{ ...styles.autopsyField, gridColumn: 'span 2' }}>
                        <span style={styles.autopsyLabel}>CAUSE OF DEATH:</span>
                        <span style={{ ...styles.autopsyVal, color: '#8b3a3a', fontWeight: 'bold' }}>
                          {story.victimProfile.causeOfDeath}
                        </span>
                      </div>
                      <div style={{ ...styles.autopsyField, gridColumn: 'span 2' }}>
                        <span style={styles.autopsyLabel}>EST. TIME OF DEATH:</span>
                        <span style={styles.autopsyVal}>{story.victimProfile.timeOfDeath}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ================= RIGHT PAGE (FILE INDEX & ARCHIVE REMARK) ================= */}
          <div style={styles.folderPageRight}>
            <div style={styles.paperSheetRight}>
              {/* Top Heading */}
              <h2 style={styles.pageTitle}>File Index</h2>

              {/* Dotted Leader Line Index Table (without counts) */}
              <div style={styles.indexTable}>
                <div style={styles.indexRow}>
                  <span style={styles.indexLabel}>TITLE</span>
                  <span style={styles.indexDots}></span>
                  <span style={styles.indexValue}>{story.title}</span>
                </div>

                <div style={styles.indexRow}>
                  <span style={styles.indexLabel}>CRIME</span>
                  <span style={styles.indexDots}></span>
                  <span style={styles.indexValue}>murder / homicide</span>
                </div>

                <div style={styles.indexRow}>
                  <span style={styles.indexLabel}>VICTIM</span>
                  <span style={styles.indexDots}></span>
                  <span style={styles.indexValue}>{story.victimProfile?.name || 'Unknown'}</span>
                </div>

                <div style={styles.indexRow}>
                  <span style={styles.indexLabel}>LEAD DETECTIVE</span>
                  <span style={styles.indexDots}></span>
                  <span style={{ ...styles.indexValue, color: '#8b3a3a', fontWeight: 'bold' }}>
                    {story.leadDetective}
                  </span>
                </div>

                <div style={styles.indexRow}>
                  <span style={styles.indexLabel}>STATUS</span>
                  <span style={styles.indexDots}></span>
                  <span style={styles.indexValue}>{story.status}</span>
                </div>

                {archetypeInfo && (
                  <div style={styles.indexRow}>
                    <span style={styles.indexLabel}>ARCHETYPE</span>
                    <span style={styles.indexDots}></span>
                    <span style={styles.indexValue}>{getCleanArchetypeTitle(story.groundTruth?.archetype)}</span>
                  </div>
                )}
              </div>

              {/* Archive Remark Sticky Note (matches reference image 2) */}
              <div style={styles.archiveRemarkNote}>
                {/* Paper Tape Strip on Note */}
                <div style={styles.stickyTape}></div>

                <div style={styles.archiveRemarkTitle}>Archive Remark</div>
                <div style={styles.archiveRemarkText}>
                  {story.briefing?.initialBriefing
                    ? `"${story.briefing.initialBriefing}"`
                    : 'Most reports survive longer than the people inside them.'}
                </div>
              </div>

              {/* Bottom Actions & Page Indicator */}
              <div style={styles.rightPageFooter}>
                <button
                  type="button"
                  onClick={() => {
                    if (story._id) onLaunch(story._id);
                  }}
                  disabled={isLoading}
                  style={styles.launchBtn}
                >
                  {isLoading ? '🚨 Dispatching Units...' : '🚨 OPEN CASE & BEGIN INVESTIGATION →'}
                </button>

                <div style={styles.pageNumber}>
                  PAGE 1 / 1
                </div>
              </div>
            </div>
          </div>
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
    backgroundColor: 'rgba(10, 8, 6, 0.88)',
    backdropFilter: 'blur(5px)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
    padding: '16px',
    boxSizing: 'border-box' as const
  },
  modalWrapper: {
    position: 'relative' as const,
    width: '100%',
    maxWidth: '1160px',
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'flex-end',
    gap: '8px'
  },
  topBar: {
    display: 'flex',
    justifyContent: 'flex-end',
    width: '100%'
  },
  closeBtn: {
    backgroundColor: '#1b1b1b',
    color: '#e0e0e0',
    fontFamily: 'monospace',
    fontWeight: 'bold',
    fontSize: '0.85rem',
    letterSpacing: '1.5px',
    padding: '6px 18px',
    border: '1px solid #444',
    borderRadius: '2px',
    cursor: 'pointer',
    boxShadow: '0 4px 10px rgba(0,0,0,0.6)',
    transition: 'background-color 0.15s ease'
  },
  folderContainer: {
    position: 'relative' as const,
    width: '100%',
    height: '760px',
    maxHeight: '86vh',
    display: 'flex',
    backgroundColor: '#bfa77e',
    backgroundImage: `
      radial-gradient(circle at 50% 50%, rgba(205, 180, 140, 0.45) 0%, rgba(168, 140, 98, 0.9) 100%),
      url('https://www.transparenttextures.com/patterns/aged-paper.png')
    `,
    borderRadius: '10px',
    border: '2px solid #8e6c42',
    boxShadow: '0 25px 65px rgba(0,0,0,0.85), inset 0 0 50px rgba(0,0,0,0.25)',
    padding: '24px 28px',
    boxSizing: 'border-box' as const,
    gap: '24px',
    overflow: 'hidden' as const
  },
  folderSpine: {
    position: 'absolute' as const,
    top: 0,
    bottom: 0,
    left: 'calc(50% - 10px)',
    width: '20px',
    background: 'linear-gradient(to right, rgba(0,0,0,0.02) 0%, rgba(0,0,0,0.25) 40%, rgba(0,0,0,0.45) 50%, rgba(0,0,0,0.25) 60%, rgba(0,0,0,0.02) 100%)',
    pointerEvents: 'none' as const,
    zIndex: 10
  },
  folderPageLeft: {
    flex: 1,
    height: '100%',
    display: 'flex',
    flexDirection: 'column' as const,
    minWidth: 0
  },
  folderPageRight: {
    flex: 1,
    height: '100%',
    display: 'flex',
    flexDirection: 'column' as const,
    minWidth: 0
  },
  paperSheet: {
    backgroundColor: '#faf6ee',
    backgroundImage: `
      linear-gradient(to bottom, #fdfbf7 0%, #f6f0e2 100%),
      url('https://www.transparenttextures.com/patterns/paper-fibers.png')
    `,
    width: '100%',
    height: '100%',
    borderRadius: '3px',
    padding: '22px 24px',
    boxSizing: 'border-box' as const,
    boxShadow: '2px 4px 15px rgba(0,0,0,0.22), 0 0 0 1px rgba(0,0,0,0.06)',
    display: 'flex',
    flexDirection: 'column' as const,
    color: '#2b231d',
    fontFamily: "'Courier New', Courier, monospace",
    overflow: 'hidden' as const
  },
  paperSheetRight: {
    backgroundColor: '#faf6ee',
    backgroundImage: `
      linear-gradient(to bottom, #fdfbf7 0%, #f6f0e2 100%),
      url('https://www.transparenttextures.com/patterns/paper-fibers.png')
    `,
    width: '100%',
    height: '100%',
    borderRadius: '3px',
    padding: '22px 24px',
    boxSizing: 'border-box' as const,
    boxShadow: '-2px 4px 15px rgba(0,0,0,0.22), 0 0 0 1px rgba(0,0,0,0.06)',
    display: 'flex',
    flexDirection: 'column' as const,
    justifyContent: 'space-between' as const,
    color: '#2b231d',
    fontFamily: "'Courier New', Courier, monospace",
    overflow: 'hidden' as const
  },
  leftPageHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '8px',
    flexWrap: 'wrap' as const,
    gap: '8px'
  },
  caseStampBox: {
    fontFamily: "'Special Elite', monospace",
    fontSize: '0.92rem',
    color: '#b71c1c',
    border: '2px solid #b71c1c',
    borderRadius: '2px',
    padding: '2px 10px',
    letterSpacing: '1px',
    textTransform: 'uppercase' as const,
    transform: 'rotate(-1deg)'
  },
  sheetTabGroup: {
    display: 'flex',
    gap: '12px'
  },
  sheetTabBtn: {
    background: 'none',
    border: 'none',
    fontFamily: 'monospace',
    fontSize: '0.85rem',
    cursor: 'pointer',
    padding: '2px 4px',
    transition: 'all 0.15s ease'
  },
  pageTitle: {
    fontFamily: "'Georgia', serif",
    fontSize: '2.1rem',
    fontWeight: 'bold',
    color: '#2c2520',
    margin: '4px 0 14px 0',
    letterSpacing: '0.5px'
  },
  cardListScroll: {
    flex: 1,
    overflowY: 'auto' as const,
    paddingRight: '6px'
  },
  autopsyReportBox: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '12px'
  },
  autopsyHeader: {
    fontFamily: "'Special Elite', monospace",
    fontSize: '0.88rem',
    color: '#8b3a3a',
    borderBottom: '1px dashed #a89f91',
    paddingBottom: '4px',
    letterSpacing: '1px',
    fontWeight: 'bold'
  },
  autopsyGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '10px',
    backgroundColor: 'rgba(255, 255, 255, 0.72)',
    padding: '12px 14px',
    borderRadius: '4px',
    border: '1px solid #dcd4c6'
  },
  autopsyField: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '2px'
  },
  autopsyLabel: {
    fontSize: '0.72rem',
    color: '#75685c',
    fontWeight: 'bold'
  },
  autopsyVal: {
    fontSize: '0.88rem',
    color: '#2b231d'
  },
  insightsCallout: {
    backgroundColor: '#fffdf7',
    borderLeft: '4px solid #8b3a3a',
    padding: '10px 14px',
    borderRadius: '2px',
    fontSize: '0.84rem',
    color: '#4e342e'
  },
  indexTable: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '6px',
    margin: '10px 0 16px 0'
  },
  indexRow: {
    display: 'flex',
    alignItems: 'baseline' as const,
    fontFamily: 'monospace',
    fontSize: '0.84rem'
  },
  indexLabel: {
    fontWeight: 'bold',
    color: '#3a3028',
    letterSpacing: '0.5px',
    whiteSpace: 'nowrap' as const
  },
  indexDots: {
    flex: 1,
    borderBottom: '1px dotted #8d7e6e',
    margin: '0 8px'
  },
  indexValue: {
    color: '#4a3f35',
    textAlign: 'right' as const,
    maxWidth: '300px',
    overflow: 'hidden' as const,
    textOverflow: 'ellipsis' as const,
    whiteSpace: 'nowrap' as const
  },
  archiveRemarkNote: {
    position: 'relative' as const,
    backgroundColor: '#eee1b6',
    backgroundImage: `
      radial-gradient(circle at 50% 50%, rgba(246, 235, 196, 0.5) 0%, rgba(230, 215, 168, 0.95) 100%),
      url('https://www.transparenttextures.com/patterns/cardboard-flat.png')
    `,
    border: '1px solid #c9b987',
    borderRadius: '3px',
    padding: '16px 18px',
    boxShadow: '2px 4px 12px rgba(0,0,0,0.14)',
    margin: '12px 0 18px 0'
  },
  stickyTape: {
    position: 'absolute' as const,
    top: '-8px',
    left: '50%',
    transform: 'translateX(-50%) rotate(-1deg)',
    width: '70px',
    height: '16px',
    backgroundColor: 'rgba(255, 255, 255, 0.65)',
    boxShadow: '0 1px 3px rgba(0,0,0,0.12)'
  },
  archiveRemarkTitle: {
    fontFamily: "'Georgia', serif",
    fontWeight: 'bold',
    fontSize: '0.96rem',
    color: '#342920',
    marginBottom: '6px'
  },
  archiveRemarkText: {
    fontFamily: "'Courier New', Courier, monospace",
    fontSize: '0.84rem',
    lineHeight: 1.5,
    color: '#42362b'
  },
  rightPageFooter: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTop: '1px solid #dcd4c6',
    paddingTop: '12px',
    marginTop: 'auto'
  },
  launchBtn: {
    backgroundColor: '#8b3a3a',
    color: '#ffd54f',
    border: '2px solid #5c1818',
    padding: '10px 18px',
    borderRadius: '4px',
    fontFamily: "'Special Elite', monospace",
    fontSize: '0.88rem',
    fontWeight: 'bold',
    cursor: 'pointer',
    letterSpacing: '0.8px',
    boxShadow: '0 3px 8px rgba(0,0,0,0.25)',
    transition: 'all 0.15s ease'
  },
  pageNumber: {
    fontFamily: 'monospace',
    fontSize: '0.78rem',
    color: '#75685c',
    letterSpacing: '1px'
  }
};
