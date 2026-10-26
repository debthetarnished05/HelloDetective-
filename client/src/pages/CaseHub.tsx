import React from 'react';
import '../index.css';
import { useGameStore } from '../store/gameStore';

export default function CaseHub() {
  const { currentStage, unlockedEvidence } = useGameStore();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '40px' }}>

      <div className="page-wrapper">
      
      {/* Updated Title Card */}
      <div className="taped-title handwritten">
        The TechVision Murder (Stage {currentStage})
      </div>

      {/* Changed to center the two remaining columns */}
      <div className="board-container" style={{ justifyContent: 'center', gap: '80px' }}>
        
        {/* Left Column: Case File */}
        <div className="paper-note" style={{ transform: 'rotate(-2deg)' }}>
          <h2 className="handwritten">Case File</h2>
          <p style={{ fontSize: '0.9rem', marginTop: '10px' }}>
            <strong>Where:</strong> Riverside Corporate Center<br />
            <strong>What happened:</strong> Michael Reynolds found dead in his office. 
            Security footage shows suspicious activity.<br /><br />
            <strong>Your job:</strong> Find the murder weapon, the motive, and who did it.
          </p>
        </div>

        {/* Right Column: Notebook / Clues */}
        <div className="paper-note notebook" style={{ transform: 'rotate(1deg)' }}>
          <h2 className="handwritten">Notebook</h2>
          
          <h3 style={{ fontSize: '1rem', marginTop: '15px' }}>Clues Found</h3>
          <ul style={{ fontSize: '0.85rem', paddingLeft: '20px' }}>
            {unlockedEvidence.map((evidence, idx) => (
              <li key={idx}>{evidence.replace(/_/g, ' ')}</li>
            ))}
          </ul>

          <h3 style={{ fontSize: '1rem', marginTop: '15px' }}>Officer Davis</h3>
          <p style={{ fontSize: '0.85rem', fontStyle: 'italic', color: '#555' }}>
            "Check the security logs for gaps around the incident's timing."
          </p>
        </div>
      </div>
      </div>
    </div>
  );
}