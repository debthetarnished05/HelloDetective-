import React, { useState } from 'react';

export default function Warrant() {
  const [suspect, setSuspect] = useState('');
  const [motive, setMotive] = useState('');
  const [weapon, setWeapon] = useState('');
  const [epilogue, setEpilogue] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!suspect || !motive || !weapon) return;
    
    setEpilogue("The District Attorney has received your warrant request. Based on your written deductions, a tactical team is being dispatched. The investigation is now closed.");
  };

  if (epilogue) {
    return (
      <div className="page-wrapper">
        <div style={{...styles.clipboard, transform: 'rotate(-1deg)'}}>
          <div style={styles.clip}>
            <div style={styles.clipHinge}></div>
          </div>
          <div style={styles.paper}>
            <h2 className="handwritten" style={{ fontSize: '2.5rem', marginBottom: '20px' }}>Case Closed</h2>
            <p className="handwritten" style={{ fontSize: '1.5rem', lineHeight: '2rem' }}>{epilogue}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-wrapper" style={{ paddingBottom: '100px' }}>
      
      {/* The Clipboard Container */}
      <div style={styles.clipboard}>
        
        {/* The Metal Clip at the top */}
        <div style={styles.clip}>
          <div style={styles.clipHinge}></div>
        </div>

        {/* The Lined Paper */}
        <div style={styles.paper}>
          <h2 className="handwritten" style={{ fontSize: '2.8rem', color: '#2c3e50', textAlign: 'center', marginBottom: '10px' }}>
            Official Arrest Warrant
          </h2>
          <p style={{ fontFamily: 'monospace', textAlign: 'center', color: '#555', marginBottom: '30px' }}>
            Submit your final deductions. This action ends the investigation.
          </p>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            
            <div style={styles.inputGroup}>
              <label style={styles.label}>Primary Suspect:</label>
              <textarea 
                value={suspect} 
                onChange={(e) => setSuspect(e.target.value)} 
                style={styles.textArea}
                
                rows={1}
              />
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}>Motive & Supporting Evidence:</label>
              <textarea 
                value={motive} 
                onChange={(e) => setMotive(e.target.value)} 
                style={{...styles.textArea, height: '6rem'}}
                
              />
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}>Murder Weapon & Execution:</label>
              <textarea 
                value={weapon} 
                onChange={(e) => setWeapon(e.target.value)} 
                style={{...styles.textArea, height: '4rem'}}
                
              />
            </div>

            <button type="submit" className="action-button" style={styles.submitBtn}>
              Submit to District Attorney
            </button>
          </form>

          {/* The Pen resting on the bottom corner */}
{/* The Pen resting on the wooden margin */}
          <div style={styles.penContainer}>
            {/* Increased width and height to make the pen 50% larger */}
            <svg width="300" height="45" viewBox="0 0 200 30" fill="none" xmlns="http://www.w3.org/2000/svg">
              {/* Pen Tip (Silver) */}
              <path d="M0 15 L25 8 L25 22 Z" fill="#d1d5db" stroke="#9ca3af" strokeWidth="1"/>
              {/* Pen Grip (Black) */}
              <path d="M25 8 L60 8 L60 22 L25 22 Z" fill="#1f2937"/>
              {/* Pen Body (Dark Blue/Grey) */}
              <rect x="60" y="6" width="120" height="18" rx="2" fill="#374151" stroke="#1f2937" strokeWidth="1"/>
              {/* Pen Clip (Silver) */}
              <rect x="130" y="3" width="40" height="4" rx="2" fill="#e5e7eb" stroke="#9ca3af" strokeWidth="0.5"/>
              {/* Pen Cap End */}
              <path d="M180 6 L195 10 L195 20 L180 24 Z" fill="#1f2937"/>
            </svg>
          </div>

        </div>
      </div>
    </div>
  );
}

const styles = {
  clipboard: {
    backgroundColor: '#3e2723', // Dark brown clipboard board
    padding: '30px 20px 20px 20px',
    borderRadius: '12px',
    boxShadow: '4px 10px 25px rgba(0,0,0,0.6)',
    width: '100%',
    maxWidth: '750px',
    position: 'relative' as const,
    transform: 'rotate(2deg)', // Tilted board
    marginTop: '40px'
  },
  clip: {
    position: 'absolute' as const,
    top: '-15px',
    left: '50%',
    transform: 'translateX(-50%)',
    width: '120px',
    height: '45px',
    backgroundColor: '#cbd5e1', // Silver metal clip
    borderRadius: '8px',
    boxShadow: '0 4px 6px rgba(0,0,0,0.5), inset 0 2px 4px rgba(255,255,255,0.7)',
    zIndex: 10,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center'
  },
  clipHinge: {
    width: '80%',
    height: '8px',
    backgroundColor: '#94a3b8',
    borderRadius: '4px',
    boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.5)'
  },
  paper: {
    backgroundColor: '#fdfbf7', // Warm paper color
    padding: '50px 40px',
    borderRadius: '4px',
    minHeight: '600px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
    // Lined paper effect matching image_5f44b7.png
    backgroundImage: 'linear-gradient(rgba(0,0,0,0.1) 1px, transparent 1px)',
    backgroundSize: '100% 2rem',
    backgroundPosition: '0 40px',
    position: 'relative' as const,
  },
  inputGroup: {
    display: 'flex',
    flexDirection: 'column' as const,
  },
  label: {
    fontFamily: 'monospace',
    fontWeight: 'bold',
    fontSize: '1.2rem',
    color: '#333',
    marginBottom: '5px'
  },
  textArea: {
    width: '100%',
    backgroundColor: 'transparent',
    border: 'none',
    outline: 'none',
    resize: 'none' as const,
    fontFamily: 'Caveat, cursive',
    fontSize: '1.8rem',
    color: '#1a365d', // Dark blue ink
    lineHeight: '2rem', // MUST match backgroundSize of paper for lines to align
    padding: '0',
    overflow: 'hidden'
  },
  submitBtn: {
    marginTop: '30px',
    backgroundColor: '#2c3e50',
    padding: '15px',
    fontSize: '1.2rem',
    fontFamily: 'monospace',
    letterSpacing: '1px'
  },
  penContainer: {
    position: 'absolute' as const,
    top: '45%',           /* Moves the pen down to the middle of the page */
    right: '-160px',       /* Pushes it outside the paper onto the brown clipboard margin */
    transform: 'rotate(-70deg)', /* Rotates it to sit vertically along that right edge */
    filter: 'drop-shadow(3px 5px 6px rgba(0,0,0,0.5))',
    zIndex: 20
  }
};