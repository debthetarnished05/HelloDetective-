import { useState, useEffect } from 'react';
import { useGameStore } from '../store/gameStore';
import { gameApi } from '../api/client';

export default function NotepadSidebar() {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'notes' | 'clues'>('notes');
  const [saveStatus, setSaveStatus] = useState<string>('');
  const { sessionId, notes, setNotes, recordedClues } = useGameStore();

  useEffect(() => {
    if (!sessionId || !notes) return;
    const timeout = setTimeout(async () => {
      try {
        setSaveStatus('Saving...');
        await gameApi.saveNotes(sessionId, notes);
        setSaveStatus('Saved');
        setTimeout(() => setSaveStatus(''), 2000);
      } catch (err) {
        setSaveStatus('Save error');
      }
    }, 1500);

    return () => clearTimeout(timeout);
  }, [notes, sessionId]);

  return (
    <>
      {/* Tab on right edge */}
      <div
        className="detective-notepad-tab"
        onClick={() => setIsOpen(!isOpen)}
        style={{
          position: 'fixed',
          top: '50%',
          right: isOpen ? 'min(380px, 92vw)' : '0',
          transform: 'translateY(-50%)',
          backgroundColor: '#8b3a3a',
          color: 'white',
          padding: '14px 8px',
          cursor: 'pointer',
          writingMode: 'vertical-rl',
          textOrientation: 'mixed',
          fontFamily: 'Caveat, cursive',
          fontSize: '1.25rem',
          borderTopLeftRadius: '8px',
          borderBottomLeftRadius: '8px',
          boxShadow: '-3px 0 8px rgba(0,0,0,0.3)',
          zIndex: 1001,
          transition: 'right 0.3s ease',
          userSelect: 'none'
        }}
      >
        {isOpen ? 'Close Notebook' : 'Detective Notepad'}
      </div>

      {/* Sliding Panel */}
      <div
        className="notebook detective-notepad-panel"
        style={{
          position: 'fixed',
          top: '55px',
          right: isOpen ? '0' : '-400px',
          width: 'min(380px, 92vw)',
          height: 'calc(100vh - 55px)',
          zIndex: 1000,
          transition: 'right 0.3s ease',
          boxShadow: '-4px 0 15px rgba(0,0,0,0.35)',
          display: 'flex',
          flexDirection: 'column',
          padding: '20px 20px',
          margin: 0,
          boxSizing: 'border-box'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #ccc', paddingBottom: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h2 className="handwritten" style={{ margin: 0, fontSize: '1.85rem' }}>Case Notebook</h2>
            {saveStatus && <span style={{ fontFamily: 'monospace', fontSize: '0.8rem', color: '#666' }}>{saveStatus}</span>}
          </div>
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '1.3rem',
              cursor: 'pointer',
              color: '#8b3a3a',
              fontWeight: 'bold',
              padding: '2px 6px'
            }}
            title="Close Notebook"
          >
            ✕
          </button>
        </div>

        {/* Tab switch */}
        <div style={{ display: 'flex', gap: '10px', marginTop: '12px', marginBottom: '12px' }}>
          <button
            onClick={() => setActiveTab('notes')}
            style={{
              flex: 1,
              padding: '6px',
              fontFamily: 'monospace',
              fontSize: '0.9rem',
              fontWeight: activeTab === 'notes' ? 'bold' : 'normal',
              backgroundColor: activeTab === 'notes' ? '#8b3a3a' : 'transparent',
              color: activeTab === 'notes' ? 'white' : '#333',
              border: '1px solid #8b3a3a',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            My Theories
          </button>
          <button
            onClick={() => setActiveTab('clues')}
            style={{
              flex: 1,
              padding: '6px',
              fontFamily: 'monospace',
              fontSize: '0.9rem',
              fontWeight: activeTab === 'clues' ? 'bold' : 'normal',
              backgroundColor: activeTab === 'clues' ? '#8b3a3a' : 'transparent',
              color: activeTab === 'clues' ? 'white' : '#333',
              border: '1px solid #8b3a3a',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Recorded Clues ({recordedClues.length})
          </button>
        </div>

        {activeTab === 'notes' ? (
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Jot down suspect contradictions, suspicious timestamps, and financial motives..."
            style={{
              flex: 1,
              background: 'transparent',
              border: 'none',
              outline: 'none',
              resize: 'none',
              fontFamily: 'Caveat, cursive',
              fontSize: '1.4rem',
              lineHeight: '1.6em',
              padding: '5px'
            }}
          />
        ) : (
          <div style={{ flex: 1, overflowY: 'auto', paddingRight: '5px' }}>
            {recordedClues.length === 0 ? (
              <p style={{ fontStyle: 'italic', color: '#666', fontFamily: 'monospace', fontSize: '0.9rem', marginTop: '20px', textAlign: 'center' }}>
                No admissions recorded yet. Click "Record Clue" in suspect interrogations to save contradictory statements here!
              </p>
            ) : (
              recordedClues.map((clue) => (
                <div
                  key={clue.id}
                  style={{
                    backgroundColor: 'rgba(255,255,255,0.7)',
                    borderLeft: '3px solid #8b3a3a',
                    padding: '8px 12px',
                    marginBottom: '10px',
                    borderRadius: '2px',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <strong style={{ fontFamily: 'monospace', fontSize: '0.85rem', color: '#8b3a3a' }}>{clue.suspectName}</strong>
                    <span style={{ fontSize: '0.75rem', color: '#888', fontFamily: 'monospace' }}>
                      {new Date(clue.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p style={{ fontFamily: 'Caveat, cursive', fontSize: '1.25rem', margin: 0, color: '#1a365d' }}>
                    "{clue.statement}"
                  </p>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </>
  );
}
