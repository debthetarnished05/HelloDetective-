import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useGameStore } from '../store/gameStore';
import { gameApi } from '../api/client';
import type { IRecordedClue } from '../types/index';

export default function OfficerDesk() {
  const {
    sessionId,
    story,
    unlockedEvidence,
    unlockedLocations,
    recordedClues,
    officerChatHistory,
    setOfficerChatHistory,
    setUnlockedEntities,
    caseClosingTriggered,
    remainingClosingQuestions,
    interrogationLocked
  } = useGameStore();

  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  // Attachments State
  const [attachedClue, setAttachedClue] = useState<IRecordedClue | null>(null);
  const [referencedEvidenceId, setReferencedEvidenceId] = useState<string | null>(null);
  const [referencedLocationId, setReferencedLocationId] = useState<string | null>(null);

  // Dropdown UI Toggles
  const [showClueDrawer, setShowClueDrawer] = useState(false);
  const [showEvidenceDrawer, setShowEvidenceDrawer] = useState(false);
  const [showLocationDrawer, setShowLocationDrawer] = useState(false);

  const QUICK_QUESTIONS = [
    "Davis, what's our current case status & tally?",
    "Who should I press or interrogate next?",
    "Review our physical forensic evidence with me",
    "Do we have enough to file an arrest warrant?"
  ];

  const handleSend = async (userText: string) => {
    if (!userText.trim() || !sessionId || loading) return;

    setLoading(true);
    const query = userText.trim();
    const isQuickQuestion = QUICK_QUESTIONS.includes(query);
    const clueToAttach = isQuickQuestion ? null : attachedClue;
    const evidenceToCite = isQuickQuestion ? null : referencedEvidenceId;
    const locationToCite = isQuickQuestion ? null : referencedLocationId;

    setMessage('');
    setAttachedClue(null);
    setReferencedEvidenceId(null);
    setReferencedLocationId(null);
    setShowClueDrawer(false);
    setShowEvidenceDrawer(false);
    setShowLocationDrawer(false);

    // Optimistically add user message
    const updatedHistory = [
      ...officerChatHistory,
      {
        role: 'user' as const,
        content: query,
        timestamp: new Date(),
        attachedClue: clueToAttach ? {
          id: clueToAttach.id,
          suspectId: clueToAttach.suspectId,
          suspectName: clueToAttach.suspectName,
          statement: clueToAttach.statement,
          timestamp: clueToAttach.timestamp || new Date()
        } : null,
        referencedEvidenceId: evidenceToCite || null,
        referencedLocationId: locationToCite || null
      }
    ];
    setOfficerChatHistory(updatedHistory);

    try {
      const result = await gameApi.chatOfficer(sessionId, query, {
        attachedClue: clueToAttach,
        referencedEvidenceId: evidenceToCite,
        referencedLocationId: locationToCite
      });

      if (result.unlockedLocations || result.unlockedSuspects || result.unlockedEvidence) {
        setUnlockedEntities({
          locations: result.unlockedLocations,
          suspects: result.unlockedSuspects,
          evidence: result.unlockedEvidence
        });
      }

      if (result.officerChatHistory) {
        setOfficerChatHistory(result.officerChatHistory);
      } else if (result.dialogue) {
        setOfficerChatHistory([
          ...updatedHistory,
          {
            role: 'assistant' as const,
            content: result.dialogue,
            timestamp: new Date(),
            unlockedEntity: result.newlyUnlocked || null
          }
        ]);
      }
    } catch (error) {
      console.error('Failed to chat with Officer Davis:', error);
      setOfficerChatHistory([
        ...updatedHistory,
        {
          role: 'assistant' as const,
          content: "Precinct radio crackles with static... 'Detective, couldn't read your transmission. Try me again in a second.'",
          timestamp: new Date()
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const selectedEvidenceObj = referencedEvidenceId
    ? (story?.evidence || []).find(e => e.id === referencedEvidenceId)
    : null;

  const selectedLocationObj = referencedLocationId
    ? (story?.locations || []).find(l => l.id === referencedLocationId)
    : null;

  return (
    <div className="page-wrapper" style={{ paddingBottom: '90px' }}>
      <div
        className="notebook"
        style={{
          width: '100%',
          maxWidth: '1100px',
          minHeight: '82vh',
          display: 'flex',
          flexDirection: 'column',
          padding: 'clamp(16px, 3.5vw, 35px)',
          boxSizing: 'border-box'
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid rgba(0,0,0,0.15)', paddingBottom: '12px', marginBottom: '15px', flexWrap: 'wrap', gap: '15px' }}>
          <div>
            <h2 className="handwritten" style={{ fontSize: 'clamp(1.8rem, 5vw, 2.8rem)', margin: 0, color: '#2c3e50' }}>
              Officer Davis's Desk
            </h2>
            <p style={{ margin: '4px 0 0 0', fontFamily: 'monospace', fontSize: '0.95rem', color: '#555' }}>
              Lead Precinct Partner & Silent Investigation Advisor · Homicide Division
            </p>
          </div>
          <div
            style={{
              backgroundColor: '#1e3a8a',
              color: 'white',
              padding: '6px 14px',
              borderRadius: '20px',
              fontFamily: 'monospace',
              fontSize: '0.85rem',
              fontWeight: 'bold',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <span>🛡️</span>
            <span>PRECINCT PARTNER</span>
          </div>
        </div>

        {/* DA CLOSING BANNER */}
        {interrogationLocked ? (
          <div style={{
            backgroundColor: '#7f1d1d',
            border: '2px solid #ef4444',
            borderRadius: '6px',
            padding: '12px 18px',
            marginBottom: '18px',
            color: 'white',
            fontFamily: 'monospace'
          }}>
            <strong style={{ fontSize: '1rem', display: 'block', color: '#fca5a5' }}>
              🚫 DA MANDATE: 12 CLOSING QUESTIONS EXHAUSTED
            </strong>
            <p style={{ margin: '4px 0 0 0', fontSize: '0.88rem' }}>
              "Detective, court orders require us to close the file. Suspect rooms are sealed. Head over to the Warrant desk, review the physical evidence and alibis, and submit the formal indictment."
            </p>
          </div>
        ) : caseClosingTriggered ? (
          <div style={{
            backgroundColor: '#92400e',
            border: '2px solid #f59e0b',
            borderRadius: '6px',
            padding: '12px 18px',
            marginBottom: '18px',
            color: 'white',
            fontFamily: 'monospace',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px',
            boxShadow: '0 4px 15px rgba(245,158,11,0.25)'
          }}>
            <div>
              <strong style={{ fontSize: '1rem', display: 'block', color: '#fef08a' }}>
                🚨 PRECINCT DISPATCH: ALL LEADS & FORENSICS SECURED
              </strong>
              <p style={{ margin: '4px 0 0 0', fontSize: '0.88rem' }}>
                Every crime scene has been canvassed and all forensic evidence collected. The DA wants this wrapped up!
              </p>
            </div>
            <div style={{
              backgroundColor: '#f59e0b',
              color: '#1e293b',
              fontWeight: 'bold',
              padding: '6px 14px',
              borderRadius: '6px',
              fontSize: '0.92rem'
            }}>
              ⏳ {remainingClosingQuestions} QUESTIONS REMAINING
            </div>
          </div>
        ) : (
          <div style={{
            backgroundColor: 'rgba(255, 255, 255, 0.75)',
            borderLeft: '4px solid #2563eb',
            padding: '12px 18px',
            marginBottom: '18px',
            borderRadius: '4px'
          }}>
            <p style={{ margin: 0, fontFamily: 'monospace', fontSize: '0.9rem', color: '#333' }}>
              ℹ️ <strong>Officer Davis's Directive:</strong> "To unlock new locations or bring in new persons of interest, you must present <strong>Probable Cause</strong>: attach a recorded suspect admission from your Notebook or cite physical forensic evidence. I cannot send patrol units on blind hunches."
            </p>
          </div>
        )}



        {/* Quick Consultation Prompt Chips */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '16px' }}>
          {QUICK_QUESTIONS.map((q, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleSend(q)}
              disabled={loading}
              style={{
                backgroundColor: 'rgba(255,255,255,0.85)',
                border: '1px solid #c5d4e8',
                borderRadius: '16px',
                padding: '6px 14px',
                fontFamily: 'monospace',
                fontSize: '0.82rem',
                color: '#1e3a8a',
                cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'background 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#e0f2fe'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.85)'}
            >
              💬 {q}
            </button>
          ))}
        </div>

        {/* Officer Chat History */}
        <div
          style={{
            flex: 1,
            maxHeight: '440px',
            overflowY: 'auto',
            padding: '18px',
            backgroundColor: 'rgba(255, 255, 255, 0.7)',
            border: '1px solid #ccc',
            borderRadius: '6px',
            marginBottom: '16px',
            boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.06)'
          }}
        >
          {officerChatHistory.length === 0 ? (
            <div style={{ textAlign: 'center', color: '#666', fontFamily: 'monospace', padding: '40px 20px' }}>
              <p className="handwritten" style={{ fontSize: '2rem', color: '#2c3e50', margin: '0 0 8px 0' }}>
                "What's on your mind, Detective?"
              </p>
              <p style={{ fontSize: '0.92rem', margin: 0 }}>
                Ask Davis about suspect alibis, forensic contradictions, or request patrol dispatches by attaching clues.
              </p>
            </div>
          ) : (
            officerChatHistory.map((msg, i) => (
              <div
                key={i}
                style={{
                  marginBottom: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start'
                }}
              >
                <div
                  style={{
                    maxWidth: '88%',
                    backgroundColor: msg.role === 'user' ? '#e3f2fd' : '#ffffff',
                    border: msg.role === 'user' ? '1px solid #bbdefb' : '1px solid #ddd',
                    borderLeft: msg.role === 'assistant' ? '4px solid #1e3a8a' : '1px solid #bbdefb',
                    padding: '12px 18px',
                    borderRadius: '6px',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', gap: '20px' }}>
                    <strong style={{ fontFamily: 'monospace', fontSize: '0.85rem', color: msg.role === 'user' ? '#1565c0' : '#1e3a8a' }}>
                      {msg.role === 'user' ? 'Lead Detective' : 'Officer Davis'}
                    </strong>
                    <span style={{ fontFamily: 'monospace', fontSize: '0.75rem', color: '#888' }}>
                      {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  {/* Supporting Probable Cause Badges on User Message */}
                  {msg.role === 'user' && (msg.attachedClue || msg.referencedEvidenceId || msg.referencedLocationId) && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '8px' }}>
                      {msg.attachedClue && (
                        <div style={{
                          backgroundColor: '#fef3c7',
                          border: '1px solid #f59e0b',
                          borderRadius: '4px',
                          padding: '3px 8px',
                          fontSize: '0.76rem',
                          fontFamily: 'monospace',
                          color: '#92400e'
                        }}>
                          📎 <strong>Clue:</strong> "{msg.attachedClue.statement.slice(0, 50)}..." ({msg.attachedClue.suspectName})
                        </div>
                      )}
                      {msg.referencedEvidenceId && (
                        <div style={{
                          backgroundColor: '#e0f2fe',
                          border: '1px solid #38bdf8',
                          borderRadius: '4px',
                          padding: '3px 8px',
                          fontSize: '0.76rem',
                          fontFamily: 'monospace',
                          color: '#0369a1'
                        }}>
                          📁 <strong>Evidence Cited:</strong> {(story?.evidence || []).find(e => e.id === msg.referencedEvidenceId)?.title || msg.referencedEvidenceId}
                        </div>
                      )}
                      {msg.referencedLocationId && (
                        <div style={{
                          backgroundColor: '#f3e8ff',
                          border: '1px solid #c084fc',
                          borderRadius: '4px',
                          padding: '3px 8px',
                          fontSize: '0.76rem',
                          fontFamily: 'monospace',
                          color: '#6b21a8'
                        }}>
                          📍 <strong>Scene Cited:</strong> {(story?.locations || []).find(l => l.id === msg.referencedLocationId)?.title || msg.referencedLocationId}
                        </div>
                      )}
                    </div>
                  )}

                  <p
                    style={{
                      margin: 0,
                      fontFamily: msg.role === 'user' ? 'Caveat, cursive' : 'monospace',
                      fontSize: msg.role === 'user' ? '1.45rem' : '1rem',
                      lineHeight: '1.5',
                      color: '#222',
                      whiteSpace: 'pre-wrap'
                    }}
                  >
                    {msg.content}
                  </p>

                  {/* UNLOCK ALERT CARD */}
                  {msg.unlockedEntity && (
                    <div style={{
                      backgroundColor: '#064e3b',
                      border: '2px solid #10b981',
                      color: 'white',
                      borderRadius: '6px',
                      padding: '12px 14px',
                      marginTop: '12px',
                      fontFamily: 'monospace'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                        <div>
                          <strong style={{ fontSize: '0.92rem', color: '#6ee7b7', display: 'block' }}>
                            🚨 PROBABLE CAUSE APPROVED: {msg.unlockedEntity.name.toUpperCase()}
                          </strong>
                          <span style={{ fontSize: '0.8rem', color: '#d1fae5' }}>
                            {msg.unlockedEntity.type === 'location' && 'Precinct patrol has secured the scene. It is now open for CSI canvassing.'}
                            {msg.unlockedEntity.type === 'character' && 'Patrol has served the official summons. The suspect is seated in the Interrogation room.'}
                            {msg.unlockedEntity.type === 'evidence' && 'The subpoena has been served and court records are deposited in your Evidence Locker.'}
                          </span>
                        </div>
                        <Link
                          to={msg.unlockedEntity.type === 'location' ? '/locations' : msg.unlockedEntity.type === 'character' ? '/suspects' : '/evidence'}
                          style={{
                            backgroundColor: '#10b981',
                            color: '#064e3b',
                            textDecoration: 'none',
                            fontWeight: 'bold',
                            padding: '6px 12px',
                            borderRadius: '4px',
                            fontSize: '0.82rem',
                            display: 'inline-block'
                          }}
                        >
                          👉 View {msg.unlockedEntity.type === 'location' ? 'Location' : msg.unlockedEntity.type === 'character' ? 'Suspect' : 'Locker'}
                        </Link>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
          {loading && (
            <div style={{ fontStyle: 'italic', color: '#1e3a8a', fontFamily: 'monospace', padding: '10px' }}>
              Officer Davis is reviewing the precinct files and checking probable cause...
            </div>
          )}
        </div>

        {/* Selected Attachments Badge Bar */}
        {(attachedClue || selectedEvidenceObj || selectedLocationObj) && (
          <div style={{
            display: 'flex',
            gap: '8px',
            flexWrap: 'wrap',
            alignItems: 'center',
            marginBottom: '10px',
            padding: '8px 12px',
            backgroundColor: '#f8fafc',
            border: '1px dashed #94a3b8',
            borderRadius: '6px'
          }}>
            <span style={{ fontFamily: 'monospace', fontSize: '0.8rem', fontWeight: 'bold', color: '#475569' }}>
              PROBABLE CAUSE ATTACHED:
            </span>

            {attachedClue && (
              <div style={{
                backgroundColor: '#fef3c7',
                border: '1px solid #f59e0b',
                borderRadius: '4px',
                padding: '4px 10px',
                fontSize: '0.82rem',
                fontFamily: 'monospace',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                color: '#92400e'
              }}>
                <span>📎 <strong>Clue:</strong> "{attachedClue.statement.slice(0, 45)}..." ({attachedClue.suspectName})</span>
                <button
                  type="button"
                  onClick={() => setAttachedClue(null)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', fontWeight: 'bold', color: '#92400e' }}
                >
                  ✕
                </button>
              </div>
            )}

            {selectedEvidenceObj && (
              <div style={{
                backgroundColor: '#e0f2fe',
                border: '1px solid #38bdf8',
                borderRadius: '4px',
                padding: '4px 10px',
                fontSize: '0.82rem',
                fontFamily: 'monospace',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                color: '#0369a1'
              }}>
                <span>📁 <strong>Evidence:</strong> {selectedEvidenceObj.title}</span>
                <button
                  type="button"
                  onClick={() => setReferencedEvidenceId(null)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', fontWeight: 'bold', color: '#0369a1' }}
                >
                  ✕
                </button>
              </div>
            )}

            {selectedLocationObj && (
              <div style={{
                backgroundColor: '#f3e8ff',
                border: '1px solid #c084fc',
                borderRadius: '4px',
                padding: '4px 10px',
                fontSize: '0.82rem',
                fontFamily: 'monospace',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                color: '#6b21a8'
              }}>
                <span>📍 <strong>Location:</strong> {selectedLocationObj.title}</span>
                <button
                  type="button"
                  onClick={() => setReferencedLocationId(null)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', fontWeight: 'bold', color: '#6b21a8' }}
                >
                  ✕
                </button>
              </div>
            )}
          </div>
        )}

        {/* Attachment Selector Buttons */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '10px' }}>
          <button
            type="button"
            onClick={() => {
              setShowClueDrawer(!showClueDrawer);
              setShowEvidenceDrawer(false);
              setShowLocationDrawer(false);
            }}
            style={{
              backgroundColor: showClueDrawer ? '#fef3c7' : '#ffffff',
              border: '1px solid #d97706',
              borderRadius: '4px',
              padding: '6px 12px',
              fontFamily: 'monospace',
              fontSize: '0.82rem',
              color: '#92400e',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <span>📎</span>
            <span>Attach Clue ({recordedClues.length})</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setShowEvidenceDrawer(!showEvidenceDrawer);
              setShowClueDrawer(false);
              setShowLocationDrawer(false);
            }}
            style={{
              backgroundColor: showEvidenceDrawer ? '#e0f2fe' : '#ffffff',
              border: '1px solid #0284c7',
              borderRadius: '4px',
              padding: '6px 12px',
              fontFamily: 'monospace',
              fontSize: '0.82rem',
              color: '#0369a1',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <span>📁</span>
            <span>Cite Evidence ({unlockedEvidence.length})</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setShowLocationDrawer(!showLocationDrawer);
              setShowClueDrawer(false);
              setShowEvidenceDrawer(false);
            }}
            style={{
              backgroundColor: showLocationDrawer ? '#f3e8ff' : '#ffffff',
              border: '1px solid #9333ea',
              borderRadius: '4px',
              padding: '6px 12px',
              fontFamily: 'monospace',
              fontSize: '0.82rem',
              color: '#6b21a8',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <span>📍</span>
            <span>Cite Scene ({unlockedLocations.length})</span>
          </button>
        </div>

        {/* Drawer for Clue Selection */}
        {showClueDrawer && (
          <div style={{
            backgroundColor: '#fffbeb',
            border: '1px solid #f59e0b',
            borderRadius: '6px',
            padding: '12px',
            marginBottom: '12px',
            maxHeight: '180px',
            overflowY: 'auto'
          }}>
            <strong style={{ fontFamily: 'monospace', fontSize: '0.85rem', color: '#92400e', display: 'block', marginBottom: '8px' }}>
              Select a Clue Recorded in your Notebook to Attach:
            </strong>
            {recordedClues.length === 0 ? (
              <p style={{ fontFamily: 'monospace', fontSize: '0.82rem', color: '#666', margin: 0 }}>
                No clues recorded yet. Interrogate suspects and click "+ Record Clue in Notebook".
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {recordedClues.map((clue, idx) => (
                  <div
                    key={idx}
                    onClick={() => {
                      setAttachedClue(clue);
                      setShowClueDrawer(false);
                    }}
                    style={{
                      padding: '8px 10px',
                      backgroundColor: 'white',
                      border: '1px solid #fde68a',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontFamily: 'monospace',
                      fontSize: '0.82rem'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#fef3c7'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'white'}
                  >
                    <strong>{clue.suspectName}:</strong> "{clue.statement}"
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Drawer for Evidence Selection */}
        {showEvidenceDrawer && (
          <div style={{
            backgroundColor: '#f0f9ff',
            border: '1px solid #38bdf8',
            borderRadius: '6px',
            padding: '12px',
            marginBottom: '12px',
            maxHeight: '180px',
            overflowY: 'auto'
          }}>
            <strong style={{ fontFamily: 'monospace', fontSize: '0.85rem', color: '#0369a1', display: 'block', marginBottom: '8px' }}>
              Select Forensic Evidence to Cite:
            </strong>
            {unlockedEvidence.length === 0 ? (
              <p style={{ fontFamily: 'monospace', fontSize: '0.82rem', color: '#666', margin: 0 }}>
                No evidence discovered yet.
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {unlockedEvidence.map((evId) => {
                  const ev = (story?.evidence || []).find(e => e.id === evId);
                  if (!ev) return null;
                  return (
                    <div
                      key={ev.id}
                      onClick={() => {
                        setReferencedEvidenceId(ev.id);
                        setShowEvidenceDrawer(false);
                      }}
                      style={{
                        padding: '8px 10px',
                        backgroundColor: 'white',
                        border: '1px solid #bae6fd',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontFamily: 'monospace',
                        fontSize: '0.82rem'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#e0f2fe'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'white'}
                    >
                      <strong>{ev.title}</strong> — {ev.details.slice(0, 90)}...
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Drawer for Location Selection */}
        {showLocationDrawer && (
          <div style={{
            backgroundColor: '#faf5ff',
            border: '1px solid #c084fc',
            borderRadius: '6px',
            padding: '12px',
            marginBottom: '12px',
            maxHeight: '180px',
            overflowY: 'auto'
          }}>
            <strong style={{ fontFamily: 'monospace', fontSize: '0.85rem', color: '#6b21a8', display: 'block', marginBottom: '8px' }}>
              Select a Visited Crime Scene to Cite:
            </strong>
            {unlockedLocations.length === 0 ? (
              <p style={{ fontFamily: 'monospace', fontSize: '0.82rem', color: '#666', margin: 0 }}>
                No locations visited yet.
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {unlockedLocations.map((locId) => {
                  const loc = (story?.locations || []).find(l => l.id === locId);
                  if (!loc) return null;
                  return (
                    <div
                      key={loc.id}
                      onClick={() => {
                        setReferencedLocationId(loc.id);
                        setShowLocationDrawer(false);
                      }}
                      style={{
                        padding: '8px 10px',
                        backgroundColor: 'white',
                        border: '1px solid #e9d5ff',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontFamily: 'monospace',
                        fontSize: '0.82rem'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f3e8ff'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'white'}
                    >
                      <strong>{loc.title}</strong> ({loc.subtitle})
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Input Form */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend(message);
          }}
          style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}
        >
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="E.g. 'Davis, Marcus claims he was at Riverside Brews. Dispatch a unit there.'..."
            style={{
              flex: '1 1 240px',
              padding: '12px 14px',
              fontFamily: 'monospace',
              fontSize: '0.95rem',
              border: '2px solid #ccc',
              borderRadius: '4px',
              outline: 'none',
              backgroundColor: 'white'
            }}
            disabled={loading}
          />
          <button
            type="submit"
            className="action-button"
            style={{
              padding: '12px 22px',
              fontSize: '0.95rem',
              marginTop: 0,
              width: 'auto',
              flexShrink: 0
            }}
            disabled={loading || !message.trim()}
          >
            {loading ? 'Consulting...' : 'Ask Davis'}
          </button>
        </form>
      </div>
    </div>
  );
}
