import React, { useState } from 'react';
import ChatModal from '../components/ChatModal';
import { useGameStore } from '../store/gameStore';

interface Suspect {
  id: string;
  name: string;
  role: string;
  trait: string;
}

const SUSPECTS: Suspect[] = [
  { id: 'marcus_chen', name: 'Marcus', role: 'Business Partner', trait: 'defensive' },
  { id: 'sarah_reynolds', name: 'Sarah', role: 'Victim\'s Sister', trait: 'nervous' },
  { id: 'diana_wilkins', name: 'Diana', role: 'Neighbor', trait: 'chatty' }
];

export default function SuspectsDirectory() {
  const [selectedSuspect, setSelectedSuspect] = useState<string | null>(null);
  const { sessionId } = useGameStore();

  return (
    <div className="page-wrapper">
      <div className="taped-title handwritten">
        Persons of Interest
      </div>
      
      <div className="suspect-board" style={{ maxWidth: '800px', marginTop: '20px' }}>
        {SUSPECTS.map((suspect, index) => (
          <div 
            key={suspect.id} 
            className="polaroid"
            style={{ transform: `rotate(${index % 2 === 0 ? 3 : -3}deg)` }}
            onClick={() => setSelectedSuspect(suspect.id)}
          >
            <div style={{ width: '100%', height: '140px', background: '#ccc' }}></div>
            <div className="polaroid-caption">
              {suspect.name}
              <div className="polaroid-trait">{suspect.role} · {suspect.trait}</div>
            </div>
          </div>
        ))}
      </div>
      <p className="handwritten" style={{ marginTop: '30px', fontSize: '1.5rem', color: 'white' }}>
        Click a photo to question that suspect.
      </p>

      {selectedSuspect && (
        <ChatModal 
          suspectId={selectedSuspect} 
          sessionId={sessionId!}
          onClose={() => setSelectedSuspect(null)} 
        />
      )}
    </div>
  );
}