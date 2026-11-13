import { useMemo, useState } from 'react';
import { useGameStore } from '../store/gameStore';
import type { ILeadBoardConnection, ILeadBoardReference, LeadBoardRelationship } from '../types/index';
import './LeadBoard.css';

interface LeadBoardNode extends ILeadBoardReference {
  title: string;
  summary: string;
  group: 'Evidence & statements' | 'People & alibis' | 'Locations';
}

interface PendingConnection {
  from: LeadBoardNode;
  to: LeadBoardNode;
}

const RELATIONSHIPS: Array<{ value: LeadBoardRelationship; label: string }> = [
  { value: 'supports', label: 'May support' },
  { value: 'contradicts', label: 'May contradict' },
  { value: 'related', label: 'Related to' },
  { value: 'uncertain', label: 'Unclear connection' }
];

function nodeKey(reference: ILeadBoardReference): string {
  return JSON.stringify([reference.type, reference.id]);
}

function connectionKey(connection: ILeadBoardConnection): string {
  return JSON.stringify([nodeKey(connection.from), nodeKey(connection.to)].sort());
}

function relationshipLabel(relationship: LeadBoardRelationship): string {
  return RELATIONSHIPS.find(item => item.value === relationship)?.label || 'Related to';
}

function shorten(value: string, maxLength = 180): string {
  const cleaned = value.trim();
  return cleaned.length > maxLength ? `${cleaned.slice(0, maxLength).trimEnd()}…` : cleaned;
}

export default function LeadBoard() {
  const {
    story,
    unlockedEvidence,
    unlockedLocations,
    unlockedSuspects,
    recordedClues,
    leadBoardConnections,
    setLeadBoardConnections,
    leadBoardSaveStatus: saveStatus,
    retryLeadBoardSave
  } = useGameStore();
  const [selectedLead, setSelectedLead] = useState<LeadBoardNode | null>(null);
  const [pendingConnection, setPendingConnection] = useState<PendingConnection | null>(null);
  const [selectionMessage, setSelectionMessage] = useState('');
  const [relationship, setRelationship] = useState<LeadBoardRelationship>('related');
  const [note, setNote] = useState('');

  const nodes = useMemo<LeadBoardNode[]>(() => {
    const evidence = (story?.evidence || [])
      .filter(item => unlockedEvidence.includes(item.id))
      .map(item => ({
        type: 'evidence' as const,
        id: item.id,
        title: item.title,
        summary: item.details || item.subtitle,
        group: 'Evidence & statements' as const
      }));
    const statements = recordedClues.map(clue => ({
      type: 'statement' as const,
      id: clue.id,
      title: `${clue.suspectName}'s recorded statement`,
      summary: clue.statement,
      group: 'Evidence & statements' as const
    }));
    const people = (story?.suspects || [])
      .filter(person => unlockedSuspects.includes(person.id))
      .flatMap(person => {
        const cards: LeadBoardNode[] = [{
          type: 'suspect',
          id: person.id,
          title: person.name,
          summary: person.role,
          group: 'People & alibis'
        }];
        if (person.alibi?.trim()) {
          cards.push({
            type: 'alibi',
            id: person.id,
            title: `${person.name}'s alibi`,
            summary: person.alibi,
            group: 'People & alibis'
          });
        }
        return cards;
      });
    const locations = (story?.locations || [])
      .filter(item => unlockedLocations.includes(item.id))
      .map(item => ({
        type: 'location' as const,
        id: item.id,
        title: item.title,
        summary: item.notes || item.subtitle,
        group: 'Locations' as const
      }));
    return [...evidence, ...statements, ...people, ...locations];
  }, [story, unlockedEvidence, unlockedLocations, unlockedSuspects, recordedClues]);

  const nodesByKey = useMemo(() => new Map(nodes.map(node => [nodeKey(node), node])), [nodes]);

  const groups: Array<LeadBoardNode['group']> = ['Evidence & statements', 'People & alibis', 'Locations'];

  function selectLead(node: LeadBoardNode) {
    setSelectionMessage('');
    if (!selectedLead) {
      if (leadBoardConnections.length >= 300) {
        setSelectionMessage('Remove a connection before adding another.');
        return;
      }
      setSelectedLead(node);
      return;
    }
    if (nodeKey(selectedLead) === nodeKey(node)) {
      setSelectedLead(null);
      return;
    }
    const key = JSON.stringify([nodeKey(selectedLead), nodeKey(node)].sort());
    if (leadBoardConnections.some(connection => connectionKey(connection) === key)) {
      setSelectionMessage('Those leads are already connected. Remove the link below to connect them again.');
      setSelectedLead(null);
      return;
    }
    if (leadBoardConnections.length >= 300) {
      setSelectionMessage('Remove a connection before adding another.');
      setSelectedLead(null);
      return;
    }
    setPendingConnection({ from: selectedLead, to: node });
    setSelectedLead(null);
    setRelationship('related');
    setNote('');
  }

  function addConnection() {
    if (!pendingConnection) return;
    const nextConnection: ILeadBoardConnection = {
      from: { type: pendingConnection.from.type, id: pendingConnection.from.id },
      to: { type: pendingConnection.to.type, id: pendingConnection.to.id },
      relationship,
      note: note.trim()
    };
    setLeadBoardConnections([...leadBoardConnections, nextConnection]);
    setPendingConnection(null);
    setNote('');
  }

  function removeConnection(connectionToRemove: ILeadBoardConnection) {
    const key = connectionKey(connectionToRemove);
    setLeadBoardConnections(leadBoardConnections.filter(connection => connectionKey(connection) !== key));
  }

  return (
    <main className="page-wrapper lead-board-page">
      <header className="lead-board-header">
        <div className="taped-title handwritten">Visual Lead Board</div>
        <p>Review the leads you have uncovered and record how you think they connect.</p>
        <div className="lead-board-notice">
          Your links and notes are private case notes. They do not confirm a theory or change story progression.
          <span aria-live="polite">{saveStatus}</span>
        </div>
      </header>

      <section className="lead-board-section" aria-labelledby="available-leads-title">
        <div className="lead-board-section-heading">
          <div>
            <h2 id="available-leads-title">Available leads</h2>
            <p>Select one card, then another, to connect them.</p>
          </div>
          {selectedLead && (
            <button type="button" className="lead-board-secondary-button" onClick={() => setSelectedLead(null)}>
              Cancel selection
            </button>
          )}
        </div>
        {(selectionMessage || leadBoardConnections.length >= 300) && (
          <p className="lead-board-limit">{selectionMessage || 'This board has reached its 300-connection limit. Remove a connection to add another.'}</p>
        )}

        {nodes.length === 0 ? (
          <p className="lead-board-empty">No leads are unlocked yet. New cards will appear here as the investigation unfolds.</p>
        ) : (
          <div className="lead-board-groups">
            {groups.map(group => {
              const groupNodes = nodes.filter(node => node.group === group);
              if (groupNodes.length === 0) return null;
              return (
                <section className="lead-board-group" key={group} aria-label={group}>
                  <h3>{group}</h3>
                  <div className="lead-board-cards">
                    {groupNodes.map(node => {
                      const isSelected = selectedLead ? nodeKey(selectedLead) === nodeKey(node) : false;
                      return (
                        <button
                          type="button"
                          className={`lead-board-card${isSelected ? ' is-selected' : ''}`}
                          key={nodeKey(node)}
                          aria-pressed={isSelected}
                          onClick={() => selectLead(node)}
                        >
                          <span className="lead-board-card-type">{node.type}</span>
                          <strong>{node.title}</strong>
                          <span className="lead-board-card-summary">{shorten(node.summary || 'No additional details recorded.')}</span>
                          {isSelected && <span className="lead-board-selected-label">Selected — choose another lead</span>}
                        </button>
                      );
                    })}
                  </div>
                </section>
              );
            })}
          </div>
        )}
      </section>

      {pendingConnection && (
        <section className="lead-board-composer" aria-labelledby="connection-composer-title">
          <h2 id="connection-composer-title">Record your connection</h2>
          <div className="lead-board-pair-preview">
            <span>{pendingConnection.from.title}</span>
            <span aria-hidden="true">↔</span>
            <span>{pendingConnection.to.title}</span>
          </div>
          <label>
            How do these leads relate?
            <select value={relationship} onChange={event => setRelationship(event.target.value as LeadBoardRelationship)}>
              {RELATIONSHIPS.map(item => <option key={item.value} value={item.value}>{item.label}</option>)}
            </select>
          </label>
          <label>
            Private note (optional)
            <textarea value={note} maxLength={500} onChange={event => setNote(event.target.value)} placeholder="What makes this connection worth checking?" />
            <span className="lead-board-character-count">{note.length}/500</span>
          </label>
          <div className="lead-board-composer-actions">
            <button type="button" className="lead-board-primary-button" onClick={addConnection}>Add connection</button>
            <button type="button" className="lead-board-secondary-button" onClick={() => setPendingConnection(null)}>Cancel</button>
          </div>
        </section>
      )}

      <section className="lead-board-section" aria-labelledby="connections-title">
        <div className="lead-board-section-heading">
          <div>
            <h2 id="connections-title">Your connections <span>{leadBoardConnections.length}</span></h2>
            <p>These are your working theories. Revise or remove them as you investigate.</p>
          </div>
          {saveStatus === 'Save failed' && (
            <button type="button" className="lead-board-secondary-button" onClick={retryLeadBoardSave}>Retry save</button>
          )}
        </div>
        {leadBoardConnections.length === 0 ? (
          <p className="lead-board-empty">No connections yet. Choose two lead cards above to start building your board.</p>
        ) : (
          <div className="lead-board-connections">
            {leadBoardConnections.map(connection => {
              const from = nodesByKey.get(nodeKey(connection.from));
              const to = nodesByKey.get(nodeKey(connection.to));
              if (!from || !to) return null;
              return (
                <article className={`lead-board-connection relation-${connection.relationship}`} key={connectionKey(connection)}>
                  <div className="lead-board-connection-card">
                    <span>{from.type}</span>
                    <strong>{from.title}</strong>
                  </div>
                  <div className="lead-board-connector">
                    <span>{relationshipLabel(connection.relationship)}</span>
                    <i aria-hidden="true" />
                  </div>
                  <div className="lead-board-connection-card">
                    <span>{to.type}</span>
                    <strong>{to.title}</strong>
                  </div>
                  {connection.note && <p className="lead-board-connection-note">{connection.note}</p>}
                  <button type="button" className="lead-board-remove" onClick={() => removeConnection(connection)} aria-label={`Remove connection between ${from.title} and ${to.title}`}>Remove</button>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}
