import { useState } from 'react';
import { useGameStore } from '../store/gameStore';
import { gameApi } from '../api/client';
import type { IEvidenceItem } from '../types/index';

interface ChatModalProps {
  suspectId: string;
  sessionId: string;
  onClose: () => void;
}

export default function ChatModal({ suspectId, sessionId, onClose }: ChatModalProps) {
  const {
    story,
    unlockedEvidence,
    suspectStates,
    updateSuspectState,
    addSuspectChatMessage,
    addRecordedClue,
    draggedEvidenceId,
    setDraggedEvidence,
    caseClosingTriggered,
    remainingClosingQuestions,
    interrogationLocked,
    setClosingState,
    setUnlockedEntities
  } = useGameStore();

  const suspectProfile = story?.suspects.find(s => s.id === suspectId);
  const suspectRuntime = suspectStates[suspectId] || {
    suspectId,
    trustScore: suspectProfile?.initialTrust ?? 50,
    stressLevel: suspectProfile?.initialStress ?? 20,
    mood: 'composed' as const,
    revealedFacts: [],
    chatHistory: []
  };

  const [input, setInput] = useState('');
  const [selectedEvidenceId, setSelectedEvidenceId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [copiedClueId, setCopiedClueId] = useState<number | null>(null);
  const [unlockAlerts, setUnlockAlerts] = useState<{ type: string; name: string }[]>([]);
  const [dramaAlert, setDramaAlert] = useState<{ type: 'slip' | 'blame'; text: string } | null>(null);

  // Unlocked evidence objects
  const availableEvidence: IEvidenceItem[] = (story?.evidence || []).filter(e =>
    unlockedEvidence.includes(e.id)
  );

  const selectedEvidenceObj = availableEvidence.find(e => e.id === selectedEvidenceId);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading || interrogationLocked) return;

    const userMsg = input.trim();
    const evId = selectedEvidenceId;

    // Optimistically add user message
    addSuspectChatMessage(suspectId, {
      role: 'user',
      content: evId
        ? `[Presents Evidence: ${selectedEvidenceObj?.title || evId}] ${userMsg}`
        : userMsg,
      timestamp: new Date(),
      attachedEvidence: evId
    });

    setInput('');
    setSelectedEvidenceId(null);
    setLoading(true);

    try {
      const response = await gameApi.chatWithSuspect(sessionId, suspectId, userMsg, evId);

      updateSuspectState(suspectId, {
        trustScore: response.trustScore,
        stressLevel: response.stressLevel,
        mood: response.mood,
        revealedFacts: response.revealedFacts
      });

      addSuspectChatMessage(suspectId, {
        role: 'assistant',
        content: response.dialogue,
        timestamp: new Date()
      });

      // Handle psychological slip of the tongue or blame shifting
      if (response.slippedUp) {
        setDramaAlert({
          type: 'slip',
          text: `⚡ FREUDIAN SLIP! ${suspectProfile?.name || 'Suspect'} fumbled their words and blurted out secret knowledge!`
        });
      } else if (response.threwUnderTheBus) {
        setDramaAlert({
          type: 'blame',
          text: `👉 BLAME SHIFT! Suspect attempted to divert guilt by pointing fingers at ${response.threwUnderTheBus}!`
        });
      } else {
        setDramaAlert(null);
      }

      // Handle newly discovered leads
      if (response.newlyUnlocked && response.newlyUnlocked.length > 0) {
        setUnlockAlerts(response.newlyUnlocked);
        setUnlockedEntities({
          suspects: response.unlockedSuspects,
          locations: response.unlockedLocations,
          evidence: response.unlockedEvidence
        });
      }

      // Update closing state
      if (response.caseClosingTriggered !== undefined) {
        setClosingState({
          caseClosingTriggered: response.caseClosingTriggered,
          remainingClosingQuestions: response.remainingClosingQuestions,
          interrogationLocked: response.interrogationLocked
        });
      }
    } catch (error) {
      console.error(error);
      addSuspectChatMessage(suspectId, {
        role: 'assistant',
        content: '*The suspect stays silent. (Connection error with precinct mainframe)*',
        timestamp: new Date()
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRecordClue = async (statement: string, index: number) => {
    if (!suspectProfile) return;
    try {
      const result = await gameApi.recordClue(sessionId, {
        suspectId,
        suspectName: suspectProfile.name,
        statement
      });
      if (result.clues && result.clues.length > 0) {
        addRecordedClue(result.clues[result.clues.length - 1]);
      }
      setCopiedClueId(index);
      setTimeout(() => setCopiedClueId(null), 2500);
    } catch (err) {
      console.error('Failed to record clue:', err);
    }
  };

  // Drag-and-drop handlers
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const evId = e.dataTransfer.getData('text/plain') || draggedEvidenceId;
    if (evId && unlockedEvidence.includes(evId)) {
      setSelectedEvidenceId(evId);
      setDraggedEvidence(null);
    }
  };

  const getMoodColor = (mood: string) => {
    switch (mood) {
      case 'broken_down':
        return '#b71c1c';
      case 'nervous':
        return '#e65100';
      case 'defensive':
        return '#c2185b';
      case 'composed':
      default:
        return '#2e7d32';
    }
  };

  const getPersonalityBadge = (personality?: string) => {
    switch (personality) {
      case 'confident': return { text: '💼 Confident', bg: '#1e3a8a' };
      case 'nervous': return { text: '😰 Nervous', bg: '#b45309' };
      case 'cunning': return { text: '🦊 Cunning', bg: '#701a75' };
      case 'aggressive': return { text: '⚡ Aggressive', bg: '#991b1b' };
      case 'defensive': return { text: '🛡️ Defensive', bg: '#374151' };
      default: return { text: '🎭 Composed', bg: '#475569' };
    }
  };

  const personalityInfo = getPersonalityBadge(suspectProfile?.personality);

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div
        className="paper-note center-tape-note interrogation-modal"
        style={styles.modal}
        onClick={(e) => e.stopPropagation()}
      >
        <button className="interrogation-close-btn" style={styles.closeBtn} onClick={onClose}>✕</button>

        {/* CLOSING SQUEEZE / LOCKOUT ALERT */}
        {interrogationLocked ? (
          <div className="interrogation-alert-banner" style={{
            backgroundColor: '#7f1d1d',
            border: '2px solid #ef4444',
            borderRadius: '6px',
            padding: '8px 14px',
            marginBottom: '12px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}>
            <span style={{ fontSize: '1.2rem' }}>🚫</span>
            <div style={{ fontFamily: 'monospace', fontSize: '0.85rem', color: '#fff' }}>
              <strong>DA LOCKOUT:</strong> All 12 closing questions exhausted. Interrogations are sealed. Submit your Arrest Warrant at Court.
            </div>
          </div>
        ) : caseClosingTriggered ? (
          <div className="interrogation-alert-banner" style={{
            backgroundColor: '#92400e',
            border: '2px solid #f59e0b',
            borderRadius: '6px',
            padding: '8px 14px',
            marginBottom: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: '0 2px 8px rgba(245,158,11,0.3)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontFamily: 'monospace', fontSize: '0.85rem', color: '#fff' }}>
              <span style={{ fontSize: '1.2rem' }}>⏳</span>
              <span><strong>DA CLOSING PHASE ACTIVE:</strong> Asking this question consumes 1 of your remaining questions.</span>
            </div>
            <span style={{
              backgroundColor: '#f59e0b',
              color: '#1e293b',
              fontFamily: 'monospace',
              fontWeight: 'bold',
              fontSize: '0.82rem',
              padding: '3px 8px',
              borderRadius: '4px'
            }}>
              {remainingClosingQuestions} QUESTIONS LEFT
            </span>
          </div>
        ) : null}

        {/* NEWLY UNLOCKED LEADS BANNER */}
        {unlockAlerts.length > 0 && (
          <div className="interrogation-alert-banner" style={{
            backgroundColor: '#064e3b',
            border: '2px solid #10b981',
            borderRadius: '6px',
            padding: '10px 14px',
            marginBottom: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            animation: 'fadeIn 0.3s'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#ecfdf5', fontFamily: 'monospace', fontSize: '0.88rem' }}>
              <span style={{ fontSize: '1.3rem' }}>🌟</span>
              <div>
                <strong>NEW INVESTIGATION LEAD UNCOVERED:</strong>
                <div style={{ marginTop: '2px' }}>
                  {unlockAlerts.map((lead, idx) => (
                    <span key={idx} style={{
                      display: 'inline-block',
                      backgroundColor: 'rgba(255,255,255,0.2)',
                      padding: '2px 8px',
                      borderRadius: '4px',
                      marginRight: '6px',
                      fontWeight: 'bold'
                    }}>
                      [{lead.type.toUpperCase()}] {lead.name}
                    </span>
                  ))}
                </div>
              </div>
            </div>
            <button
              onClick={() => setUnlockAlerts([])}
              style={{
                background: 'none',
                border: 'none',
                color: '#a7f3d0',
                cursor: 'pointer',
                fontFamily: 'monospace',
                fontSize: '0.8rem',
                textDecoration: 'underline'
              }}
            >
              Dismiss
            </button>
          </div>
        )}

        {/* PSYCHOLOGICAL DRAMA ALERT (Freudian Slip / Blame Shift) */}
        {dramaAlert && (
          <div className="interrogation-alert-banner" style={{
            backgroundColor: dramaAlert.type === 'slip' ? '#78350f' : '#451a03',
            border: dramaAlert.type === 'slip' ? '2px solid #f59e0b' : '2px solid #ea580c',
            borderRadius: '6px',
            padding: '10px 14px',
            marginBottom: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            animation: 'fadeIn 0.3s'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#fef3c7', fontFamily: 'monospace', fontSize: '0.86rem' }}>
              <span style={{ fontSize: '1.25rem' }}>{dramaAlert.type === 'slip' ? '⚡' : '👉'}</span>
              <span><strong>{dramaAlert.text}</strong></span>
            </div>
            <button
              onClick={() => setDramaAlert(null)}
              style={{
                background: 'none',
                border: 'none',
                color: '#fde68a',
                cursor: 'pointer',
                fontFamily: 'monospace',
                fontSize: '0.8rem',
                textDecoration: 'underline'
              }}
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Suspect Header & Meters */}
        <div className="interrogation-header" style={styles.header}>
          <div className="interrogation-suspect-info">
            <div className="interrogation-title-row" style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
              <h2 className="handwritten interrogation-title" style={{ fontSize: '2.4rem', margin: 0, color: '#2c3e50' }}>
                Interrogation: {suspectProfile?.name || suspectId}
              </h2>
              <span
                className="interrogation-badge"
                style={{
                  backgroundColor: personalityInfo.bg,
                  color: 'white',
                  fontFamily: 'monospace',
                  fontSize: '0.78rem',
                  padding: '3px 8px',
                  borderRadius: '6px',
                  fontWeight: 'bold',
                  letterSpacing: '0.5px'
                }}
              >
                {personalityInfo.text}
              </span>
              <span
                className="interrogation-badge"
                style={{
                  backgroundColor: getMoodColor(suspectRuntime.mood),
                  color: 'white',
                  fontFamily: 'monospace',
                  fontSize: '0.78rem',
                  padding: '3px 8px',
                  borderRadius: '12px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  fontWeight: 'bold'
                }}
              >
                {suspectRuntime.mood.replace('_', ' ')}
              </span>
            </div>
            <p className="interrogation-alibi" style={{ margin: '4px 0 0 0', fontFamily: 'monospace', fontSize: '0.92rem', color: '#555' }}>
              {suspectProfile?.role} · <em>"{suspectProfile?.alibi}"</em>
            </p>
          </div>

          {/* Dual Live Meters */}
          <div className="interrogation-meters" style={styles.metersContainer}>
            {/* Trust Meter */}
            <div className="interrogation-meter-block" style={styles.meterBlock}>
              <div className="interrogation-meter-label" style={styles.meterLabel}>
                <span>TRUST</span>
                <span style={{ fontWeight: 'bold' }}>{suspectRuntime.trustScore}%</span>
              </div>
              <div style={styles.progressBarBg}>
                <div
                  style={{
                    ...styles.progressBarFill,
                    width: `${suspectRuntime.trustScore}%`,
                    backgroundColor:
                      suspectRuntime.trustScore > 70
                        ? '#2e7d32'
                        : suspectRuntime.trustScore > 35
                        ? '#f57c00'
                        : '#d32f2f'
                  }}
                />
              </div>
            </div>

            {/* Stress / Pressure Meter */}
            <div className="interrogation-meter-block" style={styles.meterBlock}>
              <div className="interrogation-meter-label" style={styles.meterLabel}>
                <span>PRESSURE / STRESS</span>
                <span style={{ fontWeight: 'bold', color: suspectRuntime.stressLevel >= 80 ? '#b71c1c' : '#333' }}>
                  {suspectRuntime.stressLevel}%
                </span>
              </div>
              <div style={styles.progressBarBg}>
                <div
                  style={{
                    ...styles.progressBarFill,
                    width: `${suspectRuntime.stressLevel}%`,
                    backgroundColor:
                      suspectRuntime.stressLevel >= 80
                        ? '#b71c1c'
                        : suspectRuntime.stressLevel >= 50
                        ? '#e65100'
                        : '#0288d1'
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Revealed Facts Ledger (Dual-Memory System in action) */}
        {suspectRuntime.revealedFacts && suspectRuntime.revealedFacts.length > 0 && (
          <div className="interrogation-ledger" style={styles.ledgerBar}>
            <span style={{ fontWeight: 'bold', marginRight: '8px', color: '#8b3a3a', fontFamily: 'monospace', fontSize: '0.85rem' }}>
              REVEALED ADMISSIONS:
            </span>
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', flex: 1 }}>
              {suspectRuntime.revealedFacts.map((fact, idx) => (
                <span key={idx} style={styles.factChip}>
                  ✓ {fact}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Chat History */}
        <div className="interrogation-chat-history" style={styles.chatHistory}>
          {suspectRuntime.chatHistory.length === 0 ? (
            <div className="interrogation-empty-state" style={{ textAlign: 'center', color: '#777', padding: '40px 20px' }}>
              <p className="handwritten interrogation-empty-title" style={{ fontSize: '1.8rem', color: '#8b3a3a' }}>
                Begin questioning {suspectProfile?.name}...
              </p>
              <p className="interrogation-empty-tip" style={{ fontFamily: 'monospace', fontSize: '0.95rem' }}>
                Tip: Attach evidence from below or drag clues from your Evidence Locker to break their composure.
              </p>
            </div>
          ) : (
            suspectRuntime.chatHistory.map((msg, i) => (
              <div
                key={i}
                style={{
                  marginBottom: '18px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start'
                }}
              >
                <div
                  className="interrogation-bubble"
                  style={{
                    maxWidth: '82%',
                    backgroundColor: msg.role === 'user' ? '#f0f4f8' : '#ffffff',
                    border: msg.role === 'user' ? '1px solid #c5d4e8' : '1px solid #eed8d8',
                    borderLeft: msg.role === 'assistant' ? '4px solid #8b3a3a' : '1px solid #c5d4e8',
                    padding: '12px 18px',
                    borderRadius: '6px',
                    boxShadow: '0 1px 4px rgba(0,0,0,0.06)'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', gap: '20px' }}>
                    <strong
                      style={{
                        fontFamily: 'monospace',
                        fontSize: '0.9rem',
                        color: msg.role === 'user' ? '#1a365d' : '#8b3a3a'
                      }}
                    >
                      {msg.role === 'user' ? 'Lead Detective' : suspectProfile?.name}
                    </strong>
                    <span style={{ fontFamily: 'monospace', fontSize: '0.75rem', color: '#999' }}>
                      {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  <p
                    className="interrogation-msg-content"
                    style={{
                      margin: 0,
                      fontFamily: msg.role === 'user' ? 'Caveat, cursive' : 'monospace',
                      fontSize: msg.role === 'user' ? '1.45rem' : '1.05rem',
                      lineHeight: '1.5',
                      color: msg.role === 'user' ? '#1a365d' : '#222',
                      whiteSpace: 'pre-wrap'
                    }}
                  >
                    {msg.content}
                  </p>

                  {/* Button to Record Clue to Detective Notebook */}
                  {msg.role === 'assistant' && (
                    <div style={{ marginTop: '8px', textAlign: 'right' }}>
                      <button
                        type="button"
                        onClick={() => handleRecordClue(msg.content, i)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: copiedClueId === i ? '#2e7d32' : '#8b3a3a',
                          fontFamily: 'monospace',
                          fontSize: '0.8rem',
                          cursor: 'pointer',
                          textDecoration: 'underline'
                        }}
                      >
                        {copiedClueId === i ? '✓ Saved to Notebook' : '+ Record Clue in Notebook'}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
          {loading && (
            <div style={{ fontStyle: 'italic', color: '#8b3a3a', fontFamily: 'monospace', padding: '10px' }}>
              {suspectProfile?.name} is sweating... formulating response...
            </div>
          )}
        </div>

        {/* Evidence Attachment Tray & Drag-and-Drop Dropzone */}
        <div
          className="interrogation-dropzone"
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragOver(true);
          }}
          onDragLeave={() => setIsDragOver(false)}
          onDrop={handleDrop}
          style={{
            ...styles.dropzone,
            backgroundColor: isDragOver ? '#e8f5e9' : '#fffdf9',
            borderColor: isDragOver ? '#2e7d32' : selectedEvidenceId ? '#8b3a3a' : '#ddd'
          }}
        >
          {selectedEvidenceObj ? (
            <div className="interrogation-selected-ev" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '1.3rem' }}>🔍</span>
                <div>
                  <strong style={{ fontFamily: 'monospace', color: '#8b3a3a', fontSize: '0.95rem' }}>
                    CONFRONTING WITH: {selectedEvidenceObj.title}
                  </strong>
                  <div className="interrogation-ev-snippet" style={{ fontFamily: 'monospace', fontSize: '0.8rem', color: '#666' }}>
                    {selectedEvidenceObj.details.slice(0, 80)}...
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedEvidenceId(null)}
                style={{
                  background: '#f8d7da',
                  border: '1px solid #f5c6cb',
                  color: '#721c24',
                  borderRadius: '4px',
                  padding: '4px 10px',
                  cursor: 'pointer',
                  fontFamily: 'monospace',
                  fontSize: '0.8rem'
                }}
              >
                Detach Clue ✕
              </button>
            </div>
          ) : (
            <div className="interrogation-dropzone-inner" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', flexWrap: 'wrap', gap: '8px' }}>
              <span className="interrogation-dropzone-prompt" style={{ fontFamily: 'monospace', fontSize: '0.85rem', color: '#666' }}>
                📎 Attach physical evidence or drop clue here:
              </span>
              <div className="interrogation-evidence-tray" style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {availableEvidence.map(ev => (
                  <button
                    key={ev.id}
                    type="button"
                    onClick={() => setSelectedEvidenceId(ev.id)}
                    style={styles.evidencePill}
                  >
                    + {ev.title}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Input Form */}
        <form onSubmit={handleSend} className="interrogation-input-area" style={styles.inputArea}>
          <input
            type="text"
            className="interrogation-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            style={{
              ...styles.input,
              backgroundColor: interrogationLocked ? '#f5f5f5' : 'white',
              cursor: interrogationLocked ? 'not-allowed' : 'text'
            }}
            placeholder={
              interrogationLocked
                ? '🚫 Interrogations locked by DA mandate. Submit your Arrest Warrant at Court.'
                : selectedEvidenceId
                ? `Confront ${suspectProfile?.name} with ${selectedEvidenceObj?.title}...`
                : `Interrogate ${suspectProfile?.name} or present a contradiction...`
            }
            disabled={loading || interrogationLocked}
            autoFocus={!interrogationLocked}
          />
          <button
            type="submit"
            className="action-button interrogation-send-btn"
            style={{
              ...styles.sendBtn,
              backgroundColor: interrogationLocked ? '#7f1d1d' : undefined,
              cursor: interrogationLocked ? 'not-allowed' : undefined
            }}
            disabled={loading || !input.trim() || interrogationLocked}
          >
            {interrogationLocked ? 'Locked' : loading ? 'Thinking...' : 'Interrogate'}
          </button>
        </form>
      </div>
    </div>
  );
}

const styles = {
  overlay: {
    position: 'fixed' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.85)',
    zIndex: 2000,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 'clamp(8px, 2vw, 20px)'
  },
  modal: {
    width: '100%',
    maxWidth: '1200px',
    height: '92vh',
    display: 'flex',
    flexDirection: 'column' as const,
    position: 'relative' as const,
    padding: 'clamp(14px, 2.5vw, 25px)',
    boxSizing: 'border-box' as const
  },
  closeBtn: {
    position: 'absolute' as const,
    top: '15px',
    right: '20px',
    background: 'none',
    border: 'none',
    fontSize: '1.5rem',
    cursor: 'pointer',
    fontWeight: 'bold',
    color: '#8b3a3a'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottom: '2px solid rgba(0,0,0,0.1)',
    paddingBottom: '15px',
    flexWrap: 'wrap' as const,
    gap: '15px'
  },
  metersContainer: {
    display: 'flex',
    gap: '15px',
    minWidth: 'auto',
    width: '100%',
    maxWidth: '450px',
    flexWrap: 'wrap' as const
  },
  meterBlock: {
    flex: 1
  },
  meterLabel: {
    display: 'flex',
    justifyContent: 'space-between',
    fontFamily: 'monospace',
    fontSize: '0.8rem',
    color: '#444',
    marginBottom: '4px'
  },
  progressBarBg: {
    height: '10px',
    backgroundColor: 'rgba(0,0,0,0.15)',
    borderRadius: '5px',
    overflow: 'hidden'
  },
  progressBarFill: {
    height: '100%',
    transition: 'width 0.4s ease, background-color 0.4s ease'
  },
  ledgerBar: {
    display: 'flex',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.7)',
    border: '1px solid #d4cbb8',
    borderRadius: '4px',
    padding: '6px 12px',
    marginTop: '10px',
    boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.05)'
  },
  factChip: {
    backgroundColor: '#fff3cd',
    border: '1px solid #ffeeba',
    color: '#856404',
    fontFamily: 'monospace',
    fontSize: '0.78rem',
    padding: '2px 8px',
    borderRadius: '10px'
  },
  chatHistory: {
    flex: 1,
    overflowY: 'auto' as const,
    padding: '15px',
    border: '1px solid #ccc',
    marginTop: '12px',
    marginBottom: '10px',
    backgroundColor: '#fffdf9',
    boxShadow: 'inset 0 2px 5px rgba(0,0,0,0.04)',
    borderRadius: '4px'
  },
  dropzone: {
    border: '2px dashed #ccc',
    borderRadius: '4px',
    padding: '10px 15px',
    marginBottom: '10px',
    display: 'flex',
    alignItems: 'center',
    transition: 'background-color 0.2s, border-color 0.2s'
  },
  evidencePill: {
    backgroundColor: '#fff',
    border: '1px solid #8b3a3a',
    color: '#8b3a3a',
    fontFamily: 'monospace',
    fontSize: '0.78rem',
    padding: '3px 8px',
    borderRadius: '4px',
    cursor: 'pointer'
  },
  inputArea: {
    display: 'flex',
    gap: '10px',
    flexWrap: 'wrap' as const
  },
  input: {
    flex: '1 1 200px',
    padding: '12px 14px',
    fontFamily: 'monospace',
    fontSize: '0.95rem',
    border: '2px solid #ccc',
    borderRadius: '4px',
    outline: 'none'
  },
  sendBtn: {
    marginTop: 0,
    width: 'auto',
    minWidth: '120px',
    fontSize: '0.95rem',
    padding: '12px 18px',
    flexShrink: 0
  }
};