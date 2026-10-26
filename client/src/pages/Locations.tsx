import { useGameStore } from '../store/gameStore';

export default function Locations() {
  const { unlockedLocations } = useGameStore();

  return (
    <div className="page-wrapper">
      <div className="taped-title handwritten">
        Locations of Interest
      </div>

      <div style={{ display: 'flex', gap: '30px', flexWrap: 'wrap', justifyContent: 'center', maxWidth: '1000px', marginTop: '20px' }}>
        {unlockedLocations.length === 0 ? (
          <p className="handwritten" style={{ fontSize: '1.5rem', color: 'white' }}>No locations discovered yet.</p>
        ) : (
          unlockedLocations.map((loc, idx) => (
            <div key={idx} className="polaroid" style={{ transform: `rotate(${idx % 2 === 0 ? -2 : 2}deg)` }}>
              <div style={{ width: '100%', height: '140px', backgroundColor: '#5c7080', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontStyle: 'italic', fontSize: '0.8rem' }}>
                [Photo of {loc.replace(/_/g, ' ')}]
              </div>
              <div className="polaroid-caption" style={{ textTransform: 'capitalize' }}>
                {loc.replace(/_/g, ' ')}
                <div className="polaroid-trait">Secured by PD</div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}