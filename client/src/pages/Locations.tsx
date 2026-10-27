import { useState } from 'react';
import { useGameStore } from '../store/gameStore';
import { gameApi } from '../api/client';
import type { ILocationItem, IEvidenceItem } from '../types/index';

export default function Locations() {
  const { story, unlockedLocations, canvassedLocations, sessionId, markLocationCanvassed, setClosingState } = useGameStore();
  const [selectedLocationId, setSelectedLocationId] = useState<string | null>(null);

  const allLocations = story?.locations || [];
  const displayLocations = allLocations.filter(loc => unlockedLocations.includes(loc.id));
  const selectedLocation = allLocations.find(l => l.id === selectedLocationId);

  return (
    <div className="page-wrapper">
      <div className="taped-title handwritten">
        Investigation Locations
      </div>

      <p style={{ color: 'white', fontFamily: 'monospace', fontSize: '0.95rem', marginBottom: '20px', textAlign: 'center', maxWidth: '750px' }}>
        Dispatch forensic sweeps across unlocked crime scenes and establishments. Canvassing undiscovered angles reveals critical physical evidence and timeline traces.
      </p>

      <div style={styles.grid}>
        {displayLocations.map((loc, idx) => {
          const isCanvassed = canvassedLocations.includes(loc.id);

          return (
            <div
              key={loc.id}
              className="polaroid"
              style={{
                transform: `rotate(${idx % 2 === 0 ? -2 : 2}deg)`,
                cursor: 'pointer',
                transition: 'transform 0.2s',
                width: '240px',
                backgroundColor: isCanvassed ? '#fffdfa' : '#fefcf8'
              }}
              onClick={() => setSelectedLocationId(loc.id)}
              onMouseEnter={(e) => e.currentTarget.style.transform = 'rotate(0deg) scale(1.05)'}
              onMouseLeave={(e) => e.currentTarget.style.transform = `rotate(${idx % 2 === 0 ? -2 : 2}deg) scale(1)`}
            >
              <div style={styles.photoPlaceholder}>
                <span style={{ fontSize: '2.5rem' }}>🏢</span>
                <span
                  style={{
                    marginTop: '6px',
                    fontSize: '0.72rem',
                    fontFamily: 'monospace',
                    fontWeight: 'bold',
                    padding: '2px 8px',
                    borderRadius: '4px',
                    backgroundColor: isCanvassed ? '#2e7d32' : '#d97706',
                    color: 'white'
                  }}
                >
                  {isCanvassed ? '✓ CANVASSED' : '🔍 UNCANVASSED'}
                </span>
              </div>
              <div className="polaroid-caption" style={{ marginTop: '10px' }}>
                <strong style={{ fontSize: '1.05rem', color: '#2c3e50', display: 'block' }}>{loc.title}</strong>
                <div className="polaroid-trait" style={{ marginTop: '3px', color: '#555' }}>{loc.subtitle}</div>
                <div style={{
                  color: isCanvassed ? '#2e7d32' : '#8b3a3a',
                  fontFamily: 'monospace',
                  fontSize: '0.82rem',
                  marginTop: '8px',
                  fontWeight: 'bold'
                }}>
                  {isCanvassed ? 'Review Forensic Findings ➔' : 'Inspect & Canvass Site ➔'}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {selectedLocation && sessionId && (
        <LocationDetailModal
          location={selectedLocation}
          sessionId={sessionId}
          isCanvassed={canvassedLocations.includes(selectedLocation.id)}
          onCanvassed={(locationId, newlyFoundEvidence, caseClosingTriggered, remainingClosingQuestions) => {
            markLocationCanvassed(locationId, newlyFoundEvidence.map(e => e.id));
            if (caseClosingTriggered !== undefined) {
              setClosingState({ caseClosingTriggered, remainingClosingQuestions });
            }
          }}
          onClose={() => setSelectedLocationId(null)}
        />
      )}
    </div>
  );
}

function LocationDetailModal({
  location,
  sessionId,
  isCanvassed,
  onCanvassed,
  onClose
}: {
  location: ILocationItem;
  sessionId: string;
  isCanvassed: boolean;
  onCanvassed: (locationId: string, newlyFoundEvidence: IEvidenceItem[], caseClosingTriggered?: boolean, remainingClosingQuestions?: number) => void;
  onClose: () => void;
}) {
  const [canvassing, setCanvassing] = useState(false);
  const [canvassResult, setCanvassResult] = useState<{ report: string; newEvidence: IEvidenceItem[] } | null>(null);

  const handleCanvass = async () => {
    if (canvassing || !sessionId) return;
    setCanvassing(true);
    try {
      const response = await gameApi.canvassLocation(sessionId, location.id);
      setCanvassResult({
        report: response.canvassReport,
        newEvidence: response.newlyFoundEvidence || []
      });
      onCanvassed(
        location.id,
        response.newlyFoundEvidence || [],
        response.caseClosingTriggered,
        response.remainingClosingQuestions
      );
    } catch (err) {
      console.error('Failed to canvass location:', err);
      alert('Forensic field kit unavailable. Please retry.');
    } finally {
      setCanvassing(false);
    }
  };

  return (
    <div style={styles.modalOverlay} onClick={onClose}>
      <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <button style={styles.closeButton} onClick={onClose}>✕</button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '15px', flexWrap: 'wrap', marginBottom: '6px' }}>
          <h2 className="handwritten" style={styles.modalTitle}>{location.title}</h2>
          <span
            style={{
              backgroundColor: isCanvassed ? '#2e7d32' : '#d97706',
              color: 'white',
              fontFamily: 'monospace',
              fontSize: '0.78rem',
              padding: '3px 10px',
              borderRadius: '12px',
              fontWeight: 'bold'
            }}
          >
            {isCanvassed ? '✓ CANVASSED & CLEARED' : 'PENDING FORENSIC CANVASS'}
          </span>
        </div>
        <p style={styles.modalSubtitle}>{location.subtitle}</p>

        {/* CANVASS ACTION OR CSI REPORT */}
        {!isCanvassed && !canvassResult ? (
          <div style={{
            backgroundColor: 'rgba(255,255,255,0.75)',
            border: '2px dashed #8b3a3a',
            borderRadius: '6px',
            padding: '16px 20px',
            marginBottom: '20px',
            textAlign: 'center'
          }}>
            <p style={{ fontFamily: 'monospace', fontSize: '0.92rem', color: '#333', margin: '0 0 12px 0' }}>
              Forensic sweeps have not been conducted at this site yet. Sweep the scene for latent fingerprints, surveillance tape, and discarded physical evidence.
            </p>
            <button
              onClick={handleCanvass}
              disabled={canvassing}
              className="action-button"
              style={{
                backgroundColor: '#8b3a3a',
                padding: '10px 24px',
                fontSize: '1rem',
                cursor: canvassing ? 'wait' : 'pointer'
              }}
            >
              {canvassing ? 'Conducting CSI Forensic Sweep...' : '🔍 Conduct Forensic Canvass'}
            </button>
          </div>
        ) : (
          <div style={{
            backgroundColor: '#f0fdf4',
            border: '2px solid #22c55e',
            borderRadius: '6px',
            padding: '16px 20px',
            marginBottom: '20px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <span style={{ fontSize: '1.2rem' }}>🔬</span>
              <strong style={{ fontFamily: 'monospace', fontSize: '0.95rem', color: '#166534' }}>
                CSI FORENSIC FIELD CANVASS REPORT:
              </strong>
            </div>
            <p style={{ margin: 0, fontFamily: 'monospace', fontSize: '0.95rem', color: '#1e3a2b', lineHeight: '1.5' }}>
              {canvassResult?.report || location.canvassReport || `CSI completed a comprehensive grid search of ${location.title}. Physical environment secured.`}
            </p>

            {canvassResult?.newEvidence && canvassResult.newEvidence.length > 0 && (
              <div style={{
                marginTop: '12px',
                paddingTop: '10px',
                borderTop: '1px solid #bbf7d0',
                fontFamily: 'monospace',
                fontSize: '0.88rem'
              }}>
                <strong style={{ color: '#15803d' }}>
                  🎉 {canvassResult.newEvidence.length} NEW PIECE(S) OF PHYSICAL EVIDENCE RECOVERED:
                </strong>
                <ul style={{ margin: '6px 0 0 16px', padding: 0 }}>
                  {canvassResult.newEvidence.map((ev, i) => (
                    <li key={i} style={{ color: '#166534' }}>
                      <strong>{ev.title}</strong> — Transferred to Evidence Locker.
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        <div style={styles.infoBox}>
          {/* Status Row */}
          <div style={styles.row}>
            <div style={styles.iconContainer}>🚨</div>
            <div>
              <h4 style={styles.rowLabel}>Police Status</h4>
              <p style={styles.rowText}>{location.status}</p>
            </div>
          </div>

          {/* Last Visited Row */}
          <div style={styles.row}>
            <div style={styles.iconContainer}>🕒</div>
            <div>
              <h4 style={styles.rowLabel}>Last Visited / Investigated</h4>
              <p style={styles.rowText}>{location.lastVisited}</p>
            </div>
          </div>

          {/* Key Witnesses Row */}
          <div style={styles.row}>
            <div style={styles.iconContainer}>👥</div>
            <div>
              <h4 style={styles.rowLabel}>Key Witnesses Present</h4>
              <p style={styles.rowText}>{location.witnesses}</p>
            </div>
          </div>

          {/* Notes Row */}
          <div style={styles.row}>
            <div style={styles.iconContainer}>📝</div>
            <div>
              <h4 style={styles.rowLabel}>Field Notes</h4>
              <p style={styles.rowText}>{location.notes}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  grid: {
    display: 'flex',
    gap: '30px',
    flexWrap: 'wrap' as const,
    justifyContent: 'center',
    maxWidth: '1100px',
    marginTop: '15px'
  },
  photoPlaceholder: {
    width: '100%',
    height: '140px',
    backgroundColor: '#394b59',
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '2px'
  },
  modalOverlay: {
    position: 'fixed' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.8)',
    zIndex: 3000,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '20px'
  },
  modalContent: {
    width: '100%',
    maxWidth: '750px',
    padding: '35px',
    backgroundColor: '#c9d6b8',
    boxShadow: '2px 4px 20px rgba(0, 0, 0, 0.5)',
    position: 'relative' as const,
    borderRadius: '4px'
  },
  closeButton: {
    position: 'absolute' as const,
    top: '15px',
    right: '20px',
    background: 'none',
    border: 'none',
    color: '#8b3a3a',
    fontSize: '1.6rem',
    cursor: 'pointer',
    fontWeight: 'bold'
  },
  modalTitle: {
    fontSize: '2.8rem',
    margin: 0,
    color: '#2c3e50'
  },
  modalSubtitle: {
    fontFamily: 'monospace',
    fontSize: '1.05rem',
    color: '#555',
    margin: '0 0 25px 0',
    paddingBottom: '12px',
    borderBottom: '2px solid rgba(0,0,0,0.1)'
  },
  infoBox: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '22px'
  },
  row: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '15px'
  },
  iconContainer: {
    fontSize: '1.4rem',
    marginTop: '2px'
  },
  rowLabel: {
    margin: '0 0 4px 0',
    fontFamily: 'monospace',
    fontSize: '0.95rem',
    fontWeight: 600,
    color: '#333',
    textTransform: 'uppercase' as const,
    letterSpacing: '1px'
  },
  rowText: {
    margin: 0,
    fontFamily: 'monospace',
    fontSize: '1rem',
    color: '#444',
    lineHeight: '1.5'
  }
};