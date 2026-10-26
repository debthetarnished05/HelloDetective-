import React, { useState } from 'react';
import { useGameStore } from '../store/gameStore';

// Mock database to provide details for the locations
const LOCATION_DB: Record<string, { title: string; subtitle: string; status: string; lastVisited: string; witnesses: string; notes: string }> = {
  'riverside_corporate_center': {
    title: 'Riverside Corporate Center',
    subtitle: '221B River Lane',
    status: 'Active Crime Scene',
    lastVisited: 'April 18, 2025',
    witnesses: 'Security Guard John Smith, Janitor Maria Garcia',
    notes: 'Primary crime scene. Security cameras show suspicious activity around 10:45 PM.'
  },
  'riverside_brews': {
    title: 'Riverside Brews',
    subtitle: '104 5th Street',
    status: 'Location of Interest',
    lastVisited: 'April 19, 2025',
    witnesses: 'Barista Alex Rivera',
    notes: 'Marcus Chen is a regular here. Alleged argument witnessed.'
  }
};

const getLocationData = (id: string) => {
  return LOCATION_DB[id] || {
    title: id.replace(/_/g, ' '),
    subtitle: 'Unknown Address',
    status: 'Unsecured',
    lastVisited: 'Never',
    witnesses: 'None identified',
    notes: 'Pending initial sweep by PD.'
  };
};

export default function Locations() {
  const { unlockedLocations } = useGameStore();
  const [selectedLocation, setSelectedLocation] = useState<string | null>(null);

  // Forcefully injecting a location for testing if the array is empty
  const displayLocations = unlockedLocations.length > 0 ? unlockedLocations : ['riverside_corporate_center'];

  return (
    <div className="page-wrapper">
      <div className="taped-title handwritten">
        Locations of Interest
      </div>

      <div style={styles.grid}>
        {displayLocations.map((locId, idx) => (
          <div 
            key={idx} 
            className="polaroid" 
            style={{ 
              transform: `rotate(${idx % 2 === 0 ? -2 : 2}deg)`,
              cursor: 'pointer',
              transition: 'transform 0.2s',
              width: '200px'
            }}
            onClick={() => setSelectedLocation(locId)}
            onMouseEnter={(e) => e.currentTarget.style.transform = `rotate(0deg) scale(1.05)`}
            onMouseLeave={(e) => e.currentTarget.style.transform = `rotate(${idx % 2 === 0 ? -2 : 2}deg) scale(1)`}
          >
            <div style={styles.photoPlaceholder}>
              [Photo of {locId.replace(/_/g, ' ')}]
            </div>
            <div className="polaroid-caption" style={{ textTransform: 'capitalize' }}>
              {locId.replace(/_/g, ' ')}
              <div className="polaroid-trait">Secured by PD</div>
              <div className="polaroid-trait" style={{ color: '#8b3a3a', marginTop: '5px', fontWeight: 'bold' }}>
                View Report
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Flat Paper Detail Modal */}
      {selectedLocation && (
        <LocationDetailModal 
          locationId={selectedLocation} 
          onClose={() => setSelectedLocation(null)} 
        />
      )}
    </div>
  );
}

// --- Detail Modal Component (Flat Paper Aesthetic) ---
function LocationDetailModal({ locationId, onClose }: { locationId: string, onClose: () => void }) {
  const data = getLocationData(locationId);

  return (
    <div style={styles.modalOverlay} onClick={onClose}>
      <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <button style={styles.closeButton} onClick={onClose}>X</button>
        
        <h2 className="handwritten" style={styles.modalTitle}>{data.title}</h2>
        <p style={styles.modalSubtitle}>{data.subtitle}</p>

        <div style={styles.infoBox}>
          
          {/* Status Row */}
          <div style={styles.row}>
            <div style={styles.iconContainer}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#8b3a3a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
              </svg>
            </div>
            <div>
              <h4 style={styles.rowLabel}>Status</h4>
              <p style={styles.rowText}>{data.status}</p>
            </div>
          </div>

          {/* Last Visited Row */}
          <div style={styles.row}>
            <div style={styles.iconContainer}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#8b3a3a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <polyline points="12 6 12 12 16 14"></polyline>
              </svg>
            </div>
            <div>
              <h4 style={styles.rowLabel}>Last Visited</h4>
              <p style={styles.rowText}>{data.lastVisited}</p>
            </div>
          </div>

          {/* Key Witnesses Row */}
          <div style={styles.row}>
            <div style={styles.iconContainer}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#8b3a3a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                <circle cx="9" cy="7" r="4"></circle>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
              </svg>
            </div>
            <div>
              <h4 style={styles.rowLabel}>Key Witnesses</h4>
              <p style={styles.rowText}>{data.witnesses}</p>
            </div>
          </div>

          {/* Notes Row */}
          <div style={styles.row}>
            <div style={styles.iconContainer}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#8b3a3a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                <circle cx="12" cy="10" r="3"></circle>
              </svg>
            </div>
            <div>
              <h4 style={styles.rowLabel}>Notes</h4>
              <p style={styles.rowText}>{data.notes}</p>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

const styles = {
  grid: {
    display: 'flex', gap: '30px', flexWrap: 'wrap' as const, justifyContent: 'center', maxWidth: '1000px', marginTop: '20px'
  },
  photoPlaceholder: {
    width: '100%', height: '160px', backgroundColor: '#5c7080', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontStyle: 'italic', fontSize: '0.8rem', textAlign: 'center' as const
  },
  /* Modal Styles */
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
    backgroundColor: '#c9d6b8', // Matches the faded green flat paper style
    boxShadow: '2px 4px 15px rgba(0, 0, 0, 0.4)',
    transform: 'none', // Flat, no tilt
    position: 'relative' as const,
    cursor: 'default'
  },
  closeButton: {
    position: 'absolute' as const,
    top: '15px', right: '20px',
    background: 'none', border: 'none',
    color: '#8b3a3a', fontFamily: 'Caveat, cursive', fontSize: '1.8rem',
    cursor: 'pointer', fontWeight: 'bold'
  },
  modalTitle: {
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