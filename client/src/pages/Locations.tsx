import { useState } from 'react';
import { useGameStore } from '../store/gameStore';
import type { ILocationItem } from '../types/index';

export default function Locations() {
  const { story, unlockedLocations } = useGameStore();
  const [selectedLocationId, setSelectedLocationId] = useState<string | null>(null);

  const allLocations = story?.locations || [];
  const displayLocations = allLocations.filter(loc => unlockedLocations.includes(loc.id));
  const selectedLocation = allLocations.find(l => l.id === selectedLocationId);

  return (
    <div className="page-wrapper">
      <div className="taped-title handwritten">
        Locations of Interest ({displayLocations.length} Discovered)
      </div>

      <div style={styles.grid}>
        {displayLocations.map((loc, idx) => (
          <div
            key={loc.id}
            className="polaroid"
            style={{
              transform: `rotate(${idx % 2 === 0 ? -2 : 2}deg)`,
              cursor: 'pointer',
              transition: 'transform 0.2s',
              width: '220px'
            }}
            onClick={() => setSelectedLocationId(loc.id)}
            onMouseEnter={(e) => e.currentTarget.style.transform = 'rotate(0deg) scale(1.05)'}
            onMouseLeave={(e) => e.currentTarget.style.transform = `rotate(${idx % 2 === 0 ? -2 : 2}deg) scale(1)`}
          >
            <div style={styles.photoPlaceholder}>
              <span style={{ fontSize: '2.5rem' }}>🏢</span>
              <span style={{ marginTop: '5px', fontSize: '0.75rem', color: '#fff', fontStyle: 'normal' }}>
                Stage {loc.unlockStage}
              </span>
            </div>
            <div className="polaroid-caption">
              <strong style={{ fontSize: '1rem', color: '#2c3e50' }}>{loc.title}</strong>
              <div className="polaroid-trait" style={{ marginTop: '3px' }}>{loc.status}</div>
              <div className="polaroid-trait" style={{ color: '#8b3a3a', marginTop: '6px', fontWeight: 'bold' }}>
                Examine Site ➔
              </div>
            </div>
          </div>
        ))}
      </div>

      {selectedLocation && (
        <LocationDetailModal
          location={selectedLocation}
          onClose={() => setSelectedLocationId(null)}
        />
      )}
    </div>
  );
}

function LocationDetailModal({ location, onClose }: { location: ILocationItem; onClose: () => void }) {
  return (
    <div style={styles.modalOverlay} onClick={onClose}>
      <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <button style={styles.closeButton} onClick={onClose}>✕</button>

        <h2 className="handwritten" style={styles.modalTitle}>{location.title}</h2>
        <p style={styles.modalSubtitle}>{location.subtitle}</p>

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