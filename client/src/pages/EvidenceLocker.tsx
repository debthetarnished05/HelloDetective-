import { useState } from 'react';
import { useGameStore } from '../store/gameStore';
import type { IEvidenceItem } from '../types/index';
import MobileCarousel from '../components/MobileCarousel';

export default function EvidenceLocker() {
  const { story, unlockedEvidence, setDraggedEvidence } = useGameStore();
  const [selectedEvidenceId, setSelectedEvidenceId] = useState<string | null>(null);

  const allEvidence = story?.evidence || [];
  const displayEvidence = allEvidence.filter(e => unlockedEvidence.includes(e.id));
  const selectedEvidence = allEvidence.find(e => e.id === selectedEvidenceId);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'Critical': return '#b71c1c';
      case 'High': return '#e65100';
      case 'Medium': return '#f57f17';
      case 'Low':
      default: return '#2e7d32';
    }
  };

  return (
    <div className="page-wrapper">
      <div className="taped-title handwritten">
        Evidence Locker
      </div>

      <p style={{ color: 'white', fontFamily: 'monospace', fontSize: '0.95rem', marginBottom: '20px', textAlign: 'center' }}>
        Tip: Drag any clue onto a suspect during interrogation, or click to examine forensic reports.
      </p>

      {displayEvidence.length === 0 ? (
        <div className="paper-note center-tape-note" style={{ textAlign: 'center', padding: '30px', maxWidth: '500px' }}>
          <p className="handwritten" style={{ fontSize: '1.6rem', color: '#8b3a3a' }}>
            No evidence logged yet.
          </p>
          <p style={{ fontFamily: 'monospace', fontSize: '0.9rem' }}>
            Consult with Officer Davis or check the primary crime scene.
          </p>
        </div>
      ) : (
        <MobileCarousel
          itemCount={displayEvidence.length}
          itemLabel="Clue"
          style={styles.grid}
        >
          {displayEvidence.map((ev, idx) => (
            <div
              key={ev.id}
              draggable
              onDragStart={(e) => {
                e.dataTransfer.setData('text/plain', ev.id);
                setDraggedEvidence(ev.id);
              }}
              onDragEnd={() => setDraggedEvidence(null)}
              className="paper-note center-tape-note"
              style={{
                transform: `rotate(${idx % 2 === 0 ? 2 : -2}deg)`,
                cursor: 'grab',
                width: 'min(270px, 84vw)',
                boxSizing: 'border-box',
                userSelect: 'none',
                ['--base-rot' as any]: `${idx % 2 === 0 ? 2 : -2}deg`
              }}
              onClick={() => setSelectedEvidenceId(ev.id)}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span
                  style={{
                    backgroundColor: getPriorityColor(ev.priority),
                    color: 'white',
                    fontFamily: 'monospace',
                    fontSize: '0.72rem',
                    padding: '2px 8px',
                    borderRadius: '8px',
                    textTransform: 'uppercase',
                    fontWeight: 'bold'
                  }}
                >
                  {ev.priority}
                </span>
                <span style={{ fontFamily: 'monospace', fontSize: '0.75rem', color: '#666' }}>
                  {ev.location || 'Forensic Exhibit'}
                </span>
              </div>

              <h3 className="handwritten" style={{ color: '#2c3e50', textAlign: 'center', fontSize: '1.8rem', margin: '4px 0' }}>
                {ev.title}
              </h3>

              <div style={styles.evidenceImagePlaceholder}>
                <span style={{ fontSize: '2rem' }}>📁</span>
                <span style={{ marginTop: '4px', fontStyle: 'italic', fontSize: '0.8rem', color: '#555' }}>
                  {ev.subtitle}
                </span>
              </div>

              <p style={{ fontFamily: 'monospace', fontSize: '0.85rem', color: '#444', marginTop: '10px', lineHeight: '1.4' }}>
                {ev.details.length > 85 ? `${ev.details.slice(0, 85)}...` : ev.details}
              </p>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px', borderTop: '1px solid rgba(0,0,0,0.1)', paddingTop: '8px' }}>
                <span style={{ fontFamily: 'monospace', fontSize: '0.75rem', color: '#777' }}>
                  {ev.date}
                </span>
                <span className="handwritten" style={{ fontSize: '1.2rem', color: '#8b3a3a', fontWeight: 'bold' }}>
                  Inspect ➔
                </span>
              </div>
            </div>
          ))}
        </MobileCarousel>
      )}

      {selectedEvidence && (
        <EvidenceDetailModal
          evidence={selectedEvidence}
          onClose={() => setSelectedEvidenceId(null)}
        />
      )}
    </div>
  );
}

function EvidenceDetailModal({ evidence, onClose }: { evidence: IEvidenceItem; onClose: () => void }) {
  return (
    <div style={styles.modalOverlay} onClick={onClose}>
      <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <button style={styles.closeButton} onClick={onClose}>✕</button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '5px' }}>
          <h2 className="handwritten" style={styles.modalTitle}>{evidence.title}</h2>
          <span
            style={{
              backgroundColor: '#8b3a3a',
              color: 'white',
              fontFamily: 'monospace',
              fontSize: '0.8rem',
              padding: '3px 10px',
              borderRadius: '10px'
            }}
          >
            {evidence.priority} Priority
          </span>
        </div>
        <p style={styles.modalSubtitle}>{evidence.subtitle}</p>

        <div style={styles.infoBox}>
          {/* Details Row */}
          <div style={styles.row}>
            <div style={styles.iconContainer}>📄</div>
            <div>
              <h4 style={styles.rowLabel}>Forensic Exhibit Details</h4>
              <p style={styles.rowText}>{evidence.details}</p>
            </div>
          </div>

          {/* Date Row */}
          <div style={styles.row}>
            <div style={styles.iconContainer}>📅</div>
            <div>
              <h4 style={styles.rowLabel}>Date Logged</h4>
              <p style={styles.rowText}>{evidence.date}</p>
            </div>
          </div>

          {/* Location Row */}
          <div style={styles.row}>
            <div style={styles.iconContainer}>📍</div>
            <div>
              <h4 style={styles.rowLabel}>Recovery Location</h4>
              <p style={styles.rowText}>{evidence.location}</p>
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
    maxWidth: '1200px',
    marginTop: '10px'
  },
  evidenceImagePlaceholder: {
    width: '100%',
    height: '110px',
    backgroundColor: 'rgba(0,0,0,0.06)',
    marginTop: '8px',
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    border: '1px solid rgba(0,0,0,0.15)',
    borderRadius: '3px'
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
    padding: '16px',
    boxSizing: 'border-box' as const,
    overflowY: 'auto' as const
  },
  modalContent: {
    width: '100%',
    maxWidth: '750px',
    maxHeight: '90vh',
    overflowY: 'auto' as const,
    margin: 'auto',
    padding: 'clamp(20px, 4vw, 35px)',
    backgroundColor: '#c9d6b8',
    boxShadow: '2px 4px 20px rgba(0, 0, 0, 0.5)',
    position: 'relative' as const,
    borderRadius: '4px',
    boxSizing: 'border-box' as const
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
    fontSize: 'clamp(1.8rem, 5vw, 2.8rem)',
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
    gap: '24px'
  },
  row: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '15px'
  },
  iconContainer: {
    fontSize: '1.5rem',
    marginTop: '2px'
  },
  rowLabel: {
    margin: '0 0 4px 0',
    fontFamily: 'monospace',
    fontSize: '1rem',
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
    lineHeight: '1.6'
  }
};