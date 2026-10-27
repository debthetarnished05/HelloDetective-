import { useState, useEffect } from 'react';
import { gameApi } from '../api/client';
import { useGameStore } from '../store/gameStore';
import type { IStory } from '../types/index';
import { useNavigate } from 'react-router-dom';

export default function StoryCreator() {
  const [stories, setStories] = useState<IStory[]>([]);
  const [loading, setLoading] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiGenerating, setAiGenerating] = useState(false);
  const [jsonInput, setJsonInput] = useState('');
  const [activeTab, setActiveTab] = useState<'manage' | 'ai' | 'json'>('manage');
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const { story: currentStory, setSessionData } = useGameStore();
  const navigate = useNavigate();

  const loadStories = async () => {
    try {
      setLoading(true);
      const list = await gameApi.listStories();
      setStories(list);
    } catch (err) {
      console.error('Failed to load stories:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStories();
  }, []);

  const handleStartGameWithStory = async (storyId: string) => {
    try {
      setLoading(true);
      const result = await gameApi.startGame(storyId);
      setSessionData(result);
      navigate('/');
    } catch (err) {
      console.error('Failed to start game with story:', err);
      alert('Failed to launch game with selected case.');
    } finally {
      setLoading(false);
    }
  };

  const handleAiGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setAiGenerating(true);
    setMessage(null);

    try {
      const generated = await gameApi.generateAiStory(aiPrompt);
      setMessage({ text: `Successfully generated "${generated.title}" with 4 stages!`, type: 'success' });
      await loadStories();
      setActiveTab('manage');
    } catch (err: any) {
      console.error(err);
      setMessage({ text: err.response?.data?.error || 'Failed to generate story with AI.', type: 'error' });
    } finally {
      setAiGenerating(false);
    }
  };

  const handleJsonImport = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const parsed = JSON.parse(jsonInput);
      await gameApi.createStory(parsed);
      setMessage({ text: 'Custom case imported successfully into MongoDB!', type: 'success' });
      setJsonInput('');
      await loadStories();
      setActiveTab('manage');
    } catch (err: any) {
      setMessage({ text: `JSON Import Error: ${err.message}`, type: 'error' });
    }
  };

  return (
    <div className="page-wrapper" style={{ paddingBottom: '100px' }}>
      <div className="taped-title handwritten">
        Case Manager & Mystery Creator
      </div>

      <div style={styles.tabBar}>
        <button
          onClick={() => setActiveTab('manage')}
          style={{ ...styles.tabBtn, backgroundColor: activeTab === 'manage' ? '#8b3a3a' : '#2c3e50' }}
        >
          📂 All Saved Cases ({stories.length})
        </button>
        <button
          onClick={() => setActiveTab('ai')}
          style={{ ...styles.tabBtn, backgroundColor: activeTab === 'ai' ? '#8b3a3a' : '#2c3e50' }}
        >
          ✨ AI Mystery Generator
        </button>
        <button
          onClick={() => setActiveTab('json')}
          style={{ ...styles.tabBtn, backgroundColor: activeTab === 'json' ? '#8b3a3a' : '#2c3e50' }}
        >
          📋 Import JSON Case
        </button>
      </div>

      {message && (
        <div
          style={{
            maxWidth: '900px',
            width: '100%',
            padding: '12px 20px',
            marginBottom: '20px',
            borderRadius: '4px',
            backgroundColor: message.type === 'success' ? '#d4edda' : '#f8d7da',
            color: message.type === 'success' ? '#155724' : '#721c24',
            fontFamily: 'monospace',
            textAlign: 'center'
          }}
        >
          {message.text}
        </div>
      )}

      {/* TAB 1: ALL SAVED CASES */}
      {activeTab === 'manage' && (
        <div style={styles.container}>
          <h2 className="handwritten" style={{ fontSize: '2.5rem', color: '#2c3e50', marginBottom: '15px' }}>
            Available Case Files in Database
          </h2>
          <p style={{ fontFamily: 'monospace', color: '#555', marginBottom: '25px' }}>
            Select any case file to immediately launch an active investigation without changing any application code.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {stories.map((s) => {
              const isCurrent = currentStory?._id === s._id;
              const victim = s.victimProfile;
              const briefingSnippet = s.briefing?.initialBriefing;
              const suspectCount = s.suspects?.length || 0;
              const evidenceCount = s.evidence?.length || 0;
              const locationCount = s.locations?.length || 0;

              return (
                <div
                  key={s._id}
                  style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.85)',
                    borderLeft: `6px solid ${isCurrent ? '#2e7d32' : '#8b3a3a'}`,
                    padding: '24px',
                    borderRadius: '6px',
                    boxShadow: '0 3px 8px rgba(0,0,0,0.12)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '14px'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '15px' }}>
                    <div style={{ flex: '1 1 500px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                        <strong style={{ fontSize: '1.45rem', color: '#2c3e50', fontFamily: 'Georgia, serif' }}>{s.title}</strong>
                        {isCurrent && (
                          <span style={styles.activeBadge}>ACTIVE PLAYTHROUGH</span>
                        )}
                      </div>
                      <p style={{ margin: '6px 0 0 0', fontFamily: 'monospace', fontSize: '0.85rem', color: '#666' }}>
                        Case #: <strong>{s.caseNumber}</strong> · Lead: <strong>{s.leadDetective}</strong> · Status: <span style={{ color: '#8b3a3a' }}>{s.status}</span>
                      </p>
                    </div>

                    <button
                      onClick={() => s._id && handleStartGameWithStory(s._id)}
                      className="action-button"
                      style={{ width: 'auto', padding: '10px 24px', margin: 0, alignSelf: 'center' }}
                      disabled={loading}
                    >
                      {isCurrent ? 'Restart Case ➔' : 'Play This Case ➔'}
                    </button>
                  </div>

                  {victim && (
                    <div style={{ backgroundColor: 'rgba(240, 235, 220, 0.6)', padding: '10px 14px', borderRadius: '4px', border: '1px solid #ddd', fontSize: '0.88rem', fontFamily: 'monospace' }}>
                      <strong>Victim:</strong> {victim.name} ({victim.age ? `${victim.age} y/o, ` : ''}{victim.occupation})
                      {victim.causeOfDeath && (
                        <span> · <strong>Cause:</strong> {victim.causeOfDeath}</span>
                      )}
                    </div>
                  )}

                  {briefingSnippet && (
                    <p style={{ margin: 0, fontSize: '0.92rem', color: '#333', lineHeight: '1.5', fontStyle: 'italic', fontFamily: 'Georgia, serif' }}>
                      "{briefingSnippet.length > 220 ? `${briefingSnippet.slice(0, 220)}...` : briefingSnippet}"
                    </p>
                  )}

                  <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap', paddingTop: '6px', borderTop: '1px dashed #ccc' }}>
                    <span style={{ fontSize: '0.8rem', fontFamily: 'monospace', color: '#444' }}>
                      👥 <strong>{suspectCount}</strong> Suspects & Witnesses
                    </span>
                    <span style={{ fontSize: '0.8rem', fontFamily: 'monospace', color: '#444' }}>
                      🔍 <strong>{evidenceCount}</strong> Forensic Clues
                    </span>
                    <span style={{ fontSize: '0.8rem', fontFamily: 'monospace', color: '#444' }}>
                      📍 <strong>{locationCount}</strong> Investigation Locations
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 2: AI MYSTERY GENERATOR */}
      {activeTab === 'ai' && (
        <div style={styles.container}>
          <h2 className="handwritten" style={{ fontSize: '2.5rem', color: '#2c3e50', marginBottom: '10px' }}>
            AI 4-Stage Mystery Generator
          </h2>
          <p style={{ fontFamily: 'monospace', color: '#555', marginBottom: '25px', lineHeight: '1.6' }}>
            Harness Groq to invent a completely new, coherent 4-stage murder mystery with suspects, alibis, secrets, forensic evidence, locations, deduction gate rules, and ground truth.
          </p>

          <form onSubmit={handleAiGenerate} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div>
              <label style={styles.formLabel}>Case Theme or Custom Premise (Optional):</label>
              <textarea
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                placeholder="e.g., 'A vintage 1920s jazz singer poisoned in a speakeasy backroom' or 'A quantum computing researcher killed inside an electromagnetic shielded chamber' (or leave blank for a surprise)..."
                rows={4}
                style={styles.textArea}
                disabled={aiGenerating}
              />
            </div>

            <button
              type="submit"
              className="action-button"
              style={{ padding: '16px', fontSize: '1.2rem', marginTop: '10px' }}
              disabled={aiGenerating}
            >
              {aiGenerating ? 'Writing Story & Seeding Database (approx 10-15s)...' : '✨ Generate & Save Case to Database'}
            </button>
          </form>
        </div>
      )}

      {/* TAB 3: JSON IMPORT */}
      {activeTab === 'json' && (
        <div style={styles.container}>
          <h2 className="handwritten" style={{ fontSize: '2.5rem', color: '#2c3e50', marginBottom: '10px' }}>
            Direct JSON Case Importer
          </h2>
          <p style={{ fontFamily: 'monospace', color: '#555', marginBottom: '20px' }}>
            Paste a complete JSON case file matching the <code>IStory</code> schema to seed it into MongoDB.
          </p>

          <form onSubmit={handleJsonImport} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <textarea
              value={jsonInput}
              onChange={(e) => setJsonInput(e.target.value)}
              placeholder="Paste valid JSON story structure here..."
              rows={14}
              style={{ ...styles.textArea, fontFamily: 'monospace', fontSize: '0.85rem' }}
              required
            />
            <button type="submit" className="action-button" style={{ padding: '14px', fontSize: '1.1rem' }}>
              Import Case into Database
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

const styles = {
  tabBar: {
    display: 'flex',
    gap: '15px',
    marginBottom: '25px',
    flexWrap: 'wrap' as const,
    justifyContent: 'center'
  },
  tabBtn: {
    padding: '12px 24px',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    fontFamily: 'monospace',
    fontSize: '1rem',
    cursor: 'pointer',
    boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
  },
  container: {
    width: '100%',
    maxWidth: '950px',
    backgroundColor: '#c9d6b8',
    padding: '35px 40px',
    boxShadow: '2px 4px 15px rgba(0, 0, 0, 0.4)',
    borderRadius: '4px',
    boxSizing: 'border-box' as const
  },
  activeBadge: {
    backgroundColor: '#2e7d32',
    color: 'white',
    fontFamily: 'monospace',
    fontSize: '0.75rem',
    padding: '3px 10px',
    borderRadius: '10px',
    fontWeight: 'bold'
  },
  formLabel: {
    display: 'block',
    fontFamily: 'monospace',
    fontWeight: 'bold',
    fontSize: '1rem',
    marginBottom: '8px',
    color: '#333'
  },
  textArea: {
    width: '100%',
    padding: '14px',
    fontFamily: 'monospace',
    fontSize: '1rem',
    border: '2px solid #ccc',
    borderRadius: '4px',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    boxSizing: 'border-box' as const
  }
};
