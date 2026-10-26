import { useState } from 'react';
import { useGameStore } from '../store/gameStore';

export default function NotepadSidebar() {
  const [isOpen, setIsOpen] = useState(false);
  const { notes, setNotes } = useGameStore();

  return (
    <>
      {/* The Tab that sticks out on the right edge */}
      <div 
        onClick={() => setIsOpen(!isOpen)}
        style={{
          position: 'fixed',
          top: '50%',
          right: isOpen ? '350px' : '0',
          transform: 'translateY(-50%)',
          backgroundColor: '#8b3a3a',
          color: 'white',
          padding: '20px 10px',
          cursor: 'pointer',
          writingMode: 'vertical-rl',
          textOrientation: 'mixed',
          fontFamily: 'Caveat, cursive',
          fontSize: '1.5rem',
          borderTopLeftRadius: '8px',
          borderBottomLeftRadius: '8px',
          boxShadow: '-2px 0 5px rgba(0,0,0,0.2)',
          zIndex: 1001,
          transition: 'right 0.3s ease',
          userSelect: 'none'
        }}
      >
        {isOpen ? 'Close Notes' : 'Detective Notes'}
      </div>

      {/* The Sliding Notepad Panel */}
      <div 
        className="notebook"
        style={{
          position: 'fixed',
          top: '64px', // Sits just below the top navbar
          right: isOpen ? '0' : '-350px',
          width: '350px',
          height: 'calc(100vh - 64px)',
          zIndex: 1000,
          transition: 'right 0.3s ease',
          boxShadow: '-4px 0 10px rgba(0,0,0,0.3)',
          display: 'flex',
          flexDirection: 'column',
          padding: '20px 20px 20px 40px',
          margin: 0
        }}
      >
        <h2 className="handwritten" style={{ borderBottom: '2px solid #ccc', paddingBottom: '10px' }}>
          My Notes
        </h2>
        <textarea 
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Jot down your theories, alibis, and contradictions here..."
          style={{
            flex: 1,
            background: 'transparent',
            border: 'none',
            outline: 'none',
            resize: 'none',
            fontFamily: 'Caveat, cursive',
            fontSize: '1.4rem',
            lineHeight: '1.6em', // Aligns the text with the notebook CSS lines
            marginTop: '10px'
          }}
        />
      </div>
    </>
  );
}