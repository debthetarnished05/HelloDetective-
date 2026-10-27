import { useState } from 'react';
import type { IStory } from '../types/index';
import { ARCHETYPE_OPTIONS } from '../pages/StoryCreator';

interface CaseSolutionsTabProps {
  stories: IStory[];
}

export default function CaseSolutionsTab({ stories }: CaseSolutionsTabProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedArchetype, setSelectedArchetype] = useState<string>('all');
  const [revealedCases, setRevealedCases] = useState<Record<string, boolean>>({});

  const toggleReveal = (caseId: string) => {
    setRevealedCases(prev => ({
      ...prev,
      [caseId]: !prev[caseId]
    }));
  };

  const revealAll = () => {
    const allRevealed: Record<string, boolean> = {};
    stories.forEach(s => {
      const id = s._id || s.caseNumber;
      allRevealed[id] = true;
    });
    setRevealedCases(allRevealed);
  };

  const hideAll = () => {
    setRevealedCases({});
  };

  const filteredStories = stories.filter(story => {
    const matchesSearch =
      story.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      story.caseNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      story.victimProfile?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      story.leadDetective.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesArchetype =
      selectedArchetype === 'all' ||
      story.groundTruth?.archetype === selectedArchetype;

    return matchesSearch && matchesArchetype;
  });

  return (
    <div style={styles.container}>
      {/* Header Banner */}
      <div style={styles.headerBanner}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
          <span style={{ fontSize: '2rem' }}>📖</span>
          <h2 className="handwritten" style={{ margin: 0, fontSize: '2.4rem', color: '#2c3e50' }}>
            Confidential Case Solutions & True Narratives
          </h2>
        </div>
        <p style={{ margin: 0, fontFamily: 'monospace', fontSize: '0.92rem', color: '#444', lineHeight: '1.6' }}>
          Official Homicide Bureau Solved Archives. If you were unable to solve a case, got an acquittal in court, or simply want to read the true literary story of what occurred behind the scenes, unlock any case file below.
        </p>
        <div style={styles.disclaimerNote}>
          🛡️ <strong>Investigation Integrity Note:</strong> Opening or reading these true stories is purely for your reference and will <strong>not</strong> alter, reset, or influence your active investigation or game characters in any way.
        </div>
      </div>

      {/* Filter and Search Controls */}
      <div style={styles.controlsBar}>
        <div style={{ flex: 1, minWidth: '240px' }}>
          <label style={styles.controlLabel}>Search Case, Victim, or Case #:</label>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="e.g. Silicon Alibi, Vivienne Vance, 1934..."
            style={styles.input}
          />
        </div>

        <div style={{ minWidth: '220px' }}>
          <label style={styles.controlLabel}>Filter by Mystery Archetype:</label>
          <select
            value={selectedArchetype}
            onChange={(e) => setSelectedArchetype(e.target.value)}
            style={styles.select}
          >
            <option value="all">🔍 All Archetypes ({stories.length})</option>
            {ARCHETYPE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.icon} {opt.label}
              </option>
            ))}
          </select>
        </div>

        <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-end' }}>
          <button
            type="button"
            onClick={revealAll}
            style={{ ...styles.utilityBtn, backgroundColor: '#8b3a3a', color: '#fff' }}
            title="Reveal all case solutions on screen"
          >
            🔓 Reveal All
          </button>
          <button
            type="button"
            onClick={hideAll}
            style={{ ...styles.utilityBtn, backgroundColor: '#34495e', color: '#fff' }}
            title="Re-seal all case solutions"
          >
            🔒 Re-seal All
          </button>
        </div>
      </div>

      {/* Cases List */}
      {filteredStories.length === 0 ? (
        <div style={styles.emptyState}>
          <p className="handwritten" style={{ fontSize: '1.8rem', color: '#8b3a3a', margin: 0 }}>
            No matching case dossiers found.
          </p>
          <p style={{ fontFamily: 'monospace', fontSize: '0.88rem', color: '#666' }}>
            Try adjusting your search query or archetype filter.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {filteredStories.map((story) => {
            const caseId = story._id || story.caseNumber;
            const isRevealed = Boolean(revealedCases[caseId]);
            const groundTruth = story.groundTruth;

            const killerObj = (story.suspects || []).find(s => s.id === groundTruth?.killer);
            const fallGuyObj = groundTruth?.fallGuy
              ? (story.suspects || []).find(s => s.id === groundTruth.fallGuy)
              : null;
            const weaponObj = (story.evidence || []).find(e => e.id === groundTruth?.weapon);
            const contradictionObj = (story.evidence || []).find(e => e.id === groundTruth?.keyContradiction);

            const archetypeInfo = ARCHETYPE_OPTIONS.find(a => a.value === groundTruth?.archetype);

            return (
              <div key={caseId} style={styles.caseCard}>
                {/* Case Header Banner */}
                <div style={styles.caseCardHeader}>
                  <div>
                    <span style={styles.caseTag}>
                      CASE #{story.caseNumber} · {story.status}
                    </span>
                    <h3 className="handwritten" style={styles.caseTitle}>
                      {story.title}
                    </h3>
                    <div style={styles.caseMeta}>
                      <span><strong>Victim:</strong> {story.victimProfile?.name || 'Unknown'} ({story.victimProfile?.occupation})</span>
                      <span>•</span>
                      <span><strong>Lead Detective:</strong> {story.leadDetective}</span>
                      <span>•</span>
                      <span><strong>Est. TOD:</strong> {story.victimProfile?.timeOfDeath}</span>
                    </div>
                  </div>

                  {archetypeInfo && (
                    <div style={styles.archetypeBadge}>
                      <span style={{ fontSize: '1.1rem' }}>{archetypeInfo.icon}</span>
                      <span>{archetypeInfo.label}</span>
                    </div>
                  )}
                </div>

                {/* Spoiler Shield or Revealed Story */}
                {!isRevealed ? (
                  <div style={styles.sealedCover}>
                    <div style={styles.waxSeal}>
                      <span style={{ fontSize: '2.5rem' }}>🔒</span>
                    </div>
                    <h4 style={{ fontFamily: 'Georgia, serif', fontSize: '1.25rem', color: '#2c3e50', margin: '10px 0 4px 0' }}>
                      CLASSIFIED HOMICIDE DOSSIER SEALED
                    </h4>
                    <p style={{ fontFamily: 'monospace', fontSize: '0.85rem', color: '#666', margin: '0 0 16px 0', maxWidth: '600px' }}>
                      ⚠️ <strong>SPOILER WARNING:</strong> Breaking this wax seal reveals the true killer's identity, the lethal weapon, the hidden motives, and the complete step-by-step narrative chronology.
                    </p>
                    <button
                      type="button"
                      onClick={() => toggleReveal(caseId)}
                      style={styles.revealButton}
                    >
                      🔓 Break Red Wax Seal & Reveal True Story Solution
                    </button>
                  </div>
                ) : (
                  <div style={styles.revealedContent}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '2px solid #8b3a3a', paddingBottom: '10px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '1.4rem' }}>📜</span>
                        <strong style={{ fontFamily: 'Georgia, serif', fontSize: '1.2rem', color: '#8b3a3a' }}>
                          THE OFFICIAL TRUE STORY & CHRONOLOGY
                        </strong>
                      </div>
                      <button
                        type="button"
                        onClick={() => toggleReveal(caseId)}
                        style={styles.resealButton}
                      >
                        🔒 Re-seal Dossier
                      </button>
                    </div>

                    {/* Chapter 1: The Mastermind & True Motive */}
                    <div style={styles.storyChapter}>
                      <div style={styles.chapterHeader}>
                        <span style={styles.chapterNum}>ACT I</span>
                        <h4 style={styles.chapterTitle}>The Mastermind & The Deadly Motive</h4>
                      </div>
                      <p style={styles.chapterBody}>
                        The true perpetrator of the crime was{' '}
                        <strong style={{ color: '#8b3a3a', fontSize: '1.05rem' }}>
                          {killerObj?.name || groundTruth?.killer || 'The Accused'}
                        </strong>{' '}
                        ({killerObj?.role || 'Prime Suspect'}).
                      </p>
                      <div style={styles.quoteBlock}>
                        <strong>Core Motive:</strong>{' '}
                        {groundTruth?.motive || killerObj?.motive || 'Covering up corporate fraud and securing personal assets.'}
                      </div>
                      <p style={styles.chapterBody}>
                        {killerObj?.privateKnowledge || `Behind the public alibi, ${killerObj?.name || 'the killer'} operated in secret to execute the murder while maintaining an appearance of innocence.`}
                      </p>
                    </div>

                    {/* Chapter 2: The Lethal Mechanism & Opportunity Window */}
                    <div style={styles.storyChapter}>
                      <div style={styles.chapterHeader}>
                        <span style={styles.chapterNum}>ACT II</span>
                        <h4 style={styles.chapterTitle}>The Lethal Mechanism & Opportunity Window</h4>
                      </div>
                      <p style={styles.chapterBody}>
                        <strong>Medical Cause of Death:</strong>{' '}
                        {groundTruth?.trueFatalMechanism || story.victimProfile?.causeOfDeath || 'Lethal assault / poisoning'}.
                      </p>
                      <div style={styles.quoteBlock}>
                        <strong>Murder Weapon / Access Clue:</strong>{' '}
                        {weaponObj?.title || groundTruth?.weapon || 'Critical Physical Evidence'}
                        {weaponObj?.details ? ` — ${weaponObj.details}` : ''}
                      </div>
                      <p style={styles.chapterBody}>
                        The victim ({story.victimProfile?.name}) was targeted during the critical window of{' '}
                        <strong>{story.victimProfile?.timeOfDeath}</strong>. The perpetrator took advantage of access to the scene before colleagues or witnesses discovered the body.
                      </p>
                    </div>

                    {/* Chapter 3: The Web of Lies & Red Herrings */}
                    <div style={styles.storyChapter}>
                      <div style={styles.chapterHeader}>
                        <span style={styles.chapterNum}>ACT III</span>
                        <h4 style={styles.chapterTitle}>The Web of Lies & The Red Herring Traps</h4>
                      </div>
                      <p style={styles.chapterBody}>
                        Why hasty detectives get this case wrong:
                      </p>

                      {fallGuyObj ? (
                        <div style={{ ...styles.quoteBlock, borderLeftColor: '#d97706', backgroundColor: '#fffbeb' }}>
                          <strong style={{ color: '#b45309' }}>The Suspect Trap:</strong>{' '}
                          <strong>{fallGuyObj.name}</strong> ({fallGuyObj.role}) seemed overwhelmingly guilty because{' '}
                          {groundTruth?.redHerringCrime || fallGuyObj.motive || 'they acted defensively and lied about their movements'}.
                          However, forensic timeline analysis proves they never administered the fatal blow.
                        </div>
                      ) : (
                        <div style={{ ...styles.quoteBlock, borderLeftColor: '#d97706', backgroundColor: '#fffbeb' }}>
                          <strong style={{ color: '#b45309' }}>The Alibi Web:</strong>{' '}
                          All suspects maintained deceptive alibis during initial interrogation. Each concealed personal secrets that made them appear suspicious, masking the true killer's solitary window of opportunity.
                        </div>
                      )}
                    </div>

                    {/* Chapter 4: The Fatal Mistake & Key Contradiction */}
                    <div style={styles.storyChapter}>
                      <div style={styles.chapterHeader}>
                        <span style={styles.chapterNum}>ACT IV</span>
                        <h4 style={styles.chapterTitle}>The Fatal Mistake (The Decisive Contradiction)</h4>
                      </div>
                      <p style={styles.chapterBody}>
                        The single incontrovertible physical proof that broke the case was:
                      </p>
                      <div style={{ ...styles.quoteBlock, borderLeftColor: '#2563eb', backgroundColor: '#eff6ff' }}>
                        <strong style={{ color: '#1d4ed8' }}>Decisive Clue:</strong>{' '}
                        <strong>{contradictionObj?.title || groundTruth?.keyContradiction || 'Timeline & Forensic Inconsistency'}</strong>
                        {contradictionObj?.details ? ` — ${contradictionObj.details}` : ''}
                      </div>
                      <p style={styles.chapterBody}>
                        When confronted with this exact forensic artifact and their broken timeline,{' '}
                        {killerObj?.name || 'the killer'}'s constructed alibi completely collapsed.
                      </p>
                    </div>

                    {/* Chapter 5: Full Objective Timeline Narrative */}
                    <div style={{ ...styles.storyChapter, borderBottom: 'none', marginBottom: 0 }}>
                      <div style={styles.chapterHeader}>
                        <span style={styles.chapterNum}>ACT V</span>
                        <h4 style={styles.chapterTitle}>The Complete Crime Chronology (The True Story)</h4>
                      </div>
                      <div style={styles.narrativeStoryBox}>
                        <p style={{ margin: 0, fontFamily: 'Georgia, serif', fontSize: '1rem', lineHeight: '1.8', color: '#1e293b' }}>
                          {groundTruth?.timelineSummary || 'No complete timeline summary recorded for this case.'}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

const styles = {
  container: {
    width: '100%',
    maxWidth: '1000px',
    margin: '0 auto',
    boxSizing: 'border-box' as const
  },
  headerBanner: {
    backgroundColor: '#fffdf8',
    border: '2px solid #8b3a3a',
    borderRadius: '6px',
    padding: '24px 28px',
    marginBottom: '24px',
    boxShadow: '0 4px 15px rgba(0,0,0,0.1)'
  },
  disclaimerNote: {
    marginTop: '14px',
    backgroundColor: '#f0fdf4',
    border: '1px solid #86efac',
    borderRadius: '4px',
    padding: '10px 14px',
    fontFamily: 'monospace',
    fontSize: '0.82rem',
    color: '#166534'
  },
  controlsBar: {
    display: 'flex',
    gap: '16px',
    alignItems: 'center',
    flexWrap: 'wrap' as const,
    backgroundColor: 'rgba(255,255,255,0.85)',
    padding: '16px 20px',
    borderRadius: '6px',
    marginBottom: '24px',
    border: '1px solid #ccc'
  },
  controlLabel: {
    display: 'block',
    fontFamily: 'monospace',
    fontSize: '0.82rem',
    fontWeight: 'bold' as const,
    color: '#333',
    marginBottom: '6px'
  },
  input: {
    width: '100%',
    padding: '10px 12px',
    fontFamily: 'monospace',
    fontSize: '0.9rem',
    border: '1px solid #bbb',
    borderRadius: '4px',
    backgroundColor: '#fff',
    boxSizing: 'border-box' as const
  },
  select: {
    width: '100%',
    padding: '10px 12px',
    fontFamily: 'monospace',
    fontSize: '0.88rem',
    border: '1px solid #bbb',
    borderRadius: '4px',
    backgroundColor: '#fff',
    boxSizing: 'border-box' as const,
    fontWeight: 'bold' as const
  },
  utilityBtn: {
    padding: '10px 16px',
    border: 'none',
    borderRadius: '4px',
    fontFamily: 'monospace',
    fontSize: '0.85rem',
    fontWeight: 'bold' as const,
    cursor: 'pointer',
    whiteSpace: 'nowrap' as const
  },
  emptyState: {
    textAlign: 'center' as const,
    padding: '40px 20px',
    backgroundColor: '#fff',
    borderRadius: '6px',
    border: '1px dashed #999'
  },
  caseCard: {
    backgroundColor: '#fffdf9',
    borderRadius: '6px',
    border: '1px solid #d4c5b3',
    boxShadow: '0 3px 10px rgba(0,0,0,0.12)',
    overflow: 'hidden' as const
  },
  caseCardHeader: {
    padding: '20px 24px',
    borderBottom: '1px solid #eee',
    backgroundColor: '#fbf9f4',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    flexWrap: 'wrap' as const,
    gap: '12px'
  },
  caseTag: {
    display: 'inline-block',
    backgroundColor: '#374151',
    color: '#fff',
    fontFamily: 'monospace',
    fontSize: '0.72rem',
    fontWeight: 'bold' as const,
    padding: '3px 8px',
    borderRadius: '3px',
    letterSpacing: '0.5px',
    marginBottom: '6px'
  },
  caseTitle: {
    margin: '4px 0 6px 0',
    fontSize: '1.9rem',
    color: '#2c3e50'
  },
  caseMeta: {
    display: 'flex',
    gap: '8px',
    flexWrap: 'wrap' as const,
    fontFamily: 'monospace',
    fontSize: '0.82rem',
    color: '#666'
  },
  archetypeBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    backgroundColor: '#8b3a3a',
    color: '#fff',
    fontFamily: 'monospace',
    fontSize: '0.78rem',
    fontWeight: 'bold' as const,
    padding: '6px 12px',
    borderRadius: '20px',
    letterSpacing: '0.5px'
  },
  sealedCover: {
    padding: '40px 24px',
    textAlign: 'center' as const,
    backgroundColor: '#f9f6f0',
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center'
  },
  waxSeal: {
    width: '64px',
    height: '64px',
    borderRadius: '50%',
    backgroundColor: '#8b3a3a',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 4px 10px rgba(139, 58, 58, 0.4)',
    marginBottom: '12px'
  },
  revealButton: {
    backgroundColor: '#8b3a3a',
    color: '#fff',
    border: 'none',
    borderRadius: '4px',
    padding: '12px 28px',
    fontFamily: 'monospace',
    fontSize: '0.95rem',
    fontWeight: 'bold' as const,
    cursor: 'pointer',
    boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
    transition: 'background 0.2s'
  },
  resealButton: {
    backgroundColor: '#475569',
    color: '#fff',
    border: 'none',
    borderRadius: '4px',
    padding: '6px 14px',
    fontFamily: 'monospace',
    fontSize: '0.8rem',
    fontWeight: 'bold' as const,
    cursor: 'pointer'
  },
  revealedContent: {
    padding: '24px 28px',
    backgroundColor: '#fff'
  },
  storyChapter: {
    marginBottom: '20px',
    paddingBottom: '16px',
    borderBottom: '1px dashed #e2e8f0'
  },
  chapterHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    marginBottom: '8px'
  },
  chapterNum: {
    backgroundColor: '#8b3a3a',
    color: '#fff',
    fontFamily: 'monospace',
    fontSize: '0.72rem',
    fontWeight: 'bold' as const,
    padding: '2px 8px',
    borderRadius: '3px'
  },
  chapterTitle: {
    margin: 0,
    fontFamily: 'Georgia, serif',
    fontSize: '1.15rem',
    color: '#2c3e50'
  },
  chapterBody: {
    margin: '0 0 10px 0',
    fontFamily: 'monospace',
    fontSize: '0.9rem',
    lineHeight: '1.6',
    color: '#333'
  },
  quoteBlock: {
    backgroundColor: '#f8fafc',
    borderLeft: '4px solid #8b3a3a',
    padding: '10px 14px',
    borderRadius: '4px',
    fontFamily: 'monospace',
    fontSize: '0.88rem',
    color: '#1e293b',
    margin: '10px 0'
  },
  narrativeStoryBox: {
    backgroundColor: '#f8fafc',
    border: '1px solid #cbd5e1',
    borderRadius: '6px',
    padding: '18px 22px',
    marginTop: '8px'
  }
};
