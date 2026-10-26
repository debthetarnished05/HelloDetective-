import React, { useState } from 'react';
import { useGameStore } from '../store/gameStore';

// Mock database to provide details for the evidence items
const EVIDENCE_DB: Record<string, { title: string; subtitle: string; details: string; date: string; location: string }> = {
  'security_footage': {
    title: 'Security Footage',
    subtitle: 'Parkade Camera #3',
    details: 'Footage shows an unidentified figure entering the building at 10:45 PM. The figure appears to be of similar build to Marcus Chen.',
    date: 'April 17, 2025',
    location: 'Riverside Corporate Center'
  },
  'autopsy_report': {
    title: 'Autopsy Report',
    subtitle: 'Medical Examiner Office',
    details: 'Report indicates time of death between 10:00 PM and 11:30 PM. Cause of death is blunt force trauma to the back of the head.',
    date: 'April 18, 2025',
    location: 'Riverside Morgue'
  },
  'crime_scene_photos': {
    title: 'Crime Scene Photos',
    subtitle: "Victim's Office",
    details: 'Photos show signs of a struggle. A shattered coffee mug is visible near the desk, and the secure file cabinet was left open.',
    date: 'April 17, 2025',
    location: 'Riverside Corporate Center'
  }
};

const getEvidenceData = (id: string) => {
  return EVIDENCE_DB[id] || {
    title: id.replace(/_/g, ' '),
    subtitle: 'Unknown Source',
    details: 'Details pending analysis.',
    date: 'Unknown',
    location: 'Evidence Locker'
  };
};

export default function EvidenceLocker() {
  const { unlockedEvidence } = useGameStore();
  const [selectedEvidence, setSelectedEvidence] = useState<string | null>(null);

  // For testing purposes, forcefully injecting evidence if the array is empty
  const displayEvidence = unlockedEvidence.length > 0 ? unlockedEvidence : ['security_footage', 'autopsy_report', 'crime_scene_photos'];

  return (
    <div className="page-wrapper">
      <div className="taped-title handwritten">
        Evidence Locker
      </div>

      <div style={styles.grid}>
        {displayEvidence.map((evidenceId, idx) => (
          <div 
            key={idx} 
            className="paper-note center-tape-note" 
            style={{ 
              transform: `rotate(${idx % 2 === 0 ? 2 : -2}deg)`,
              cursor: 'pointer',
              transition: 'transform 0.2s',
              width: '250px'
            }}
            onClick={() => setSelectedEvidence(evidenceId)}
            onMouseEnter={(e) => e.currentTarget.style.transform = `rotate(0deg) scale(1.05)`}
            onMouseLeave={(e) => e.currentTarget.style.transform = `rotate(${idx % 2 === 0 ? 2 : -2}deg) scale(1)`}
          >
            <h3 className="handwritten" style={{ textTransform: 'capitalize', color: '#2c3e50', textAlign: 'center' }}>
              {evidenceId.replace(/_/g, ' ')}
            </h3>
            <div style={styles.evidenceImagePlaceholder}>
              [Image of {evidenceId.replace(/_/g, ' ')}]
            </div>
            <p className="handwritten" style={{ fontSize: '1.2rem', marginTop: '10px', textAlign: 'center', color: '#8b3a3a' }}>
              View Details
            </p>
          </div>
        ))}
      </div>

      {selectedEvidence && (
        <EvidenceDetailModal 
          evidenceId={selectedEvidence} 
          onClose={() => setSelectedEvidence(null)} 
        />
      )}
    </div>
  );
}

// --- Detail Modal Component (Paper Aesthetic) ---
// --- Detail Modal Component (Flat Paper Aesthetic) ---
function EvidenceDetailModal({ evidenceId, onClose }: { evidenceId: string, onClose: () => void }) {
  const data = getEvidenceData(evidenceId);

  return (
    <div style={styles.modalOverlay} onClick={onClose}>
      {/* Classes removed to strip the tape, styling applied directly */}
      <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <button style={styles.closeButton} onClick={onClose}>X</button>
        
        <h2 className="handwritten" style={styles.modalTitle}>{data.title}</h2>
        <p style={styles.modalSubtitle}>{data.subtitle}</p>

        <div style={styles.infoBox}>
          
          {/* Details Row */}
          <div style={styles.row}>
            <div style={styles.iconContainer}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#8b3a3a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                <polyline points="14 2 14 8 20 8"></polyline>
                <line x1="16" y1="13" x2="8" y2="13"></line>
                <line x1="16" y1="17" x2="8" y2="17"></line>
                <polyline points="10 9 9 9 8 9"></polyline>
              </svg>
            </div>
            <div>
              <h4 style={styles.rowLabel}>Exhibit Details</h4>
              <p style={styles.rowText}>{data.details}</p>
            </div>
          </div>

          {/* Date Found Row */}
          <div style={styles.row}>
            <div style={styles.iconContainer}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#8b3a3a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                <line x1="16" y1="2" x2="16" y2="6"></line>
                <line x1="8" y1="2" x2="8" y2="6"></line>
                <line x1="3" y1="10" x2="21" y2="10"></line>
              </svg>
            </div>
            <div>
              <h4 style={styles.rowLabel}>Date Logged</h4>
              <p style={styles.rowText}>{data.date}</p>
            </div>
          </div>

          {/* Location Row */}
          <div style={styles.row}>
            <div style={styles.iconContainer}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#8b3a3a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                <circle cx="12" cy="10" r="3"></circle>
              </svg>
            </div>
            <div>
              <h4 style={styles.rowLabel}>Recovery Location</h4>
              <p style={styles.rowText}>{data.location}</p>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

const styles = {
  grid: {
    display: 'flex', gap: '40px', flexWrap: 'wrap' as const, justifyContent: 'center', maxWidth: '1000px', marginTop: '20px'
  },
  evidenceImagePlaceholder: {
    width: '100%', height: '140px', backgroundColor: 'rgba(0,0,0,0.05)', marginTop: '15px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontStyle: 'italic', color: '#555', fontSize: '0.9rem', border: '1px solid rgba(0,0,0,0.2)'
  },
  modalOverlay: {
    position: 'fixed' as const,
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.7)',
    zIndex: 3000,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    padding: '20px'
  },
modalContent: {
    width: '100%',
    maxWidth: '700px',
    padding: '40px',
    backgroundColor: '#c9d6b8', // Matches the faded green paper
    boxShadow: '2px 4px 15px rgba(0, 0, 0, 0.4)',
    transform: 'none', // Ensures 0 tilt
    position: 'relative' as const,
    cursor: 'default'
  },
  closeButton: {
    position: 'absolute' as const,
    top: '20px', right: '25px',
    background: 'none', border: 'none',
    color: '#8b3a3a', fontFamily: 'Caveat, cursive', fontSize: '1.8rem',
    cursor: 'pointer', fontWeight: 'bold'
  },alTitle: {
    fontSize: '3rem', margin: '0 0 5px 0', color: '#2c3e50'
  },
  modalSubtitle: {
    fontFamily: 'monospace', fontSize: '1.1rem', color: '#555', margin: '0 0 30px 0', paddingBottom: '15px', borderBottom: '2px solid rgba(0,0,0,0.1)'
  },
  infoBox: {
    display: 'flex', flexDirection: 'column' as const, gap: '30px'
  },
  row: {
    display: 'flex', alignItems: 'flex-start', gap: '20px'
  },
  iconContainer: {
    marginTop: '2px'
  },
  rowLabel: {
    margin: '0 0 5px 0', fontFamily: 'monospace', fontSize: '1.1rem', fontWeight: 600, color: '#333', textTransform: 'uppercase' as const, letterSpacing: '1px'
  },
  rowText: {
    margin: 0, fontFamily: 'monospace', fontSize: '1.1rem', color: '#444', lineHeight: '1.6'
  }
};