import { useEffect, useMemo, useRef, useState } from 'react';
import type { FormEvent, MouseEvent as ReactMouseEvent, PointerEvent as ReactPointerEvent } from 'react';
import { useGameStore } from '../store/gameStore';
import type { ILeadBoardCard, ILeadBoardConnection, ILeadBoardReference, LeadBoardLeadType, LeadBoardRelationship } from '../types/index';
import './LeadBoard.css';

interface LeadBoardNode extends ILeadBoardReference {
  title: string;
  summary: string;
}

interface BoardMenuState {
  screenX: number;
  screenY: number;
  boardX: number;
  boardY: number;
  group: string | null;
}

interface PendingConnection extends ILeadBoardConnection {
  editingKey?: string;
}

interface CardDragState {
  id: string;
  pointerId: number;
  startClientX: number;
  startClientY: number;
  grabX: number;
  grabY: number;
  moved: boolean;
}

const CARD_WIDTH = 240;
const CARD_HEIGHT = 160;
const MAX_CANVAS_COORDINATE = 10000;

const RELATIONSHIPS: Array<{ value: LeadBoardRelationship; label: string; color: string }> = [
  { value: 'supports', label: 'May support', color: '#57c785' },
  { value: 'contradicts', label: 'May contradict', color: '#e16d6d' },
  { value: 'related', label: 'Related to', color: '#e8bd5c' },
  { value: 'uncertain', label: 'Unclear connection', color: '#ad93f2' }
];

const LEAD_GROUPS = [
  { id: 'clues', label: 'Clues & evidence', types: ['evidence', 'statement'] as LeadBoardLeadType[] },
  { id: 'suspects', label: 'Suspects', types: ['suspect'] as LeadBoardLeadType[] },
  { id: 'alibis', label: 'Alibis', types: ['alibi'] as LeadBoardLeadType[] },
  { id: 'locations', label: 'Locations', types: ['location'] as LeadBoardLeadType[] }
];

function referenceKey(reference: ILeadBoardReference): string {
  return JSON.stringify([reference.type, reference.id]);
}

function connectionKey(connection: ILeadBoardConnection): string {
  return JSON.stringify([referenceKey(connection.from), referenceKey(connection.to)].sort());
}

function typeLabel(type: LeadBoardLeadType): string {
  switch (type) {
    case 'evidence': return 'Evidence';
    case 'statement': return 'Clue';
    case 'suspect': return 'Suspect';
    case 'alibi': return 'Alibi';
    case 'location': return 'Location';
  }
}

function shorten(value: string, length: number): string {
  const trimmed = value.trim();
  return trimmed.length > length ? `${trimmed.slice(0, length - 1).trimEnd()}…` : trimmed;
}

function relationshipInfo(value: LeadBoardRelationship) {
  return RELATIONSHIPS.find(item => item.value === value) || RELATIONSHIPS[2];
}

export default function LeadBoard() {
  const {
    sessionId,
    story,
    unlockedEvidence,
    unlockedLocations,
    unlockedSuspects,
    recordedClues,
    leadBoardCards,
    leadBoardConnections,
    leadBoardSaveStatus,
    setLeadBoardCards,
    setLeadBoardConnections,
    retryLeadBoardSave
  } = useGameStore();
  const [placedCards, setPlacedCards] = useState<ILeadBoardCard[]>(leadBoardCards);
  const placedCardsRef = useRef<ILeadBoardCard[]>(leadBoardCards);
  const [selectedCardKey, setSelectedCardKey] = useState<string | null>(null);
  const [pendingConnection, setPendingConnection] = useState<PendingConnection | null>(null);
  const [connectionReason, setConnectionReason] = useState('');
  const [connectionError, setConnectionError] = useState('');
  const [menu, setMenu] = useState<BoardMenuState | null>(null);
  const [boardMessage, setBoardMessage] = useState('');
  const surfaceRef = useRef<HTMLDivElement>(null);
  const reasonInputRef = useRef<HTMLTextAreaElement>(null);
  const cardDragRef = useRef<CardDragState | null>(null);
  const touchMenuRef = useRef<{ pointerId: number; clientX: number; clientY: number } | null>(null);
  const longPressTimerRef = useRef<number | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const serializedPlacedCards = JSON.stringify(leadBoardCards);

  useEffect(() => () => {
    if (longPressTimerRef.current !== null) window.clearTimeout(longPressTimerRef.current);
  }, []);

  useEffect(() => {
    placedCardsRef.current = leadBoardCards;
    setPlacedCards(leadBoardCards);
  }, [sessionId, serializedPlacedCards]);

  useEffect(() => {
    setSelectedCardKey(null);
    setPendingConnection(null);
    setMenu(null);
    setBoardMessage('');
  }, [sessionId]);

  const connectionEditorOpen = pendingConnection !== null;
  useEffect(() => {
    if (connectionEditorOpen) reasonInputRef.current?.focus();
  }, [connectionEditorOpen]);

  useEffect(() => {
    if (!menu) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMenu(null);
    };
    const handlePointerDown = (event: PointerEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) setMenu(null);
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('pointerdown', handlePointerDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('pointerdown', handlePointerDown);
    };
  }, [menu]);

  const nodes = useMemo<LeadBoardNode[]>(() => {
    const evidence = (story?.evidence || [])
      .filter(item => unlockedEvidence.includes(item.id))
      .map(item => ({
        type: 'evidence' as const,
        id: item.id,
        title: item.title,
        summary: item.details || item.subtitle
      }));
    const statements = recordedClues
      .filter(clue => unlockedSuspects.includes(clue.suspectId))
      .map(clue => ({
        type: 'statement' as const,
        id: clue.id,
        title: `${clue.suspectName}'s statement`,
        summary: clue.statement
      }));
    const people = (story?.suspects || [])
      .filter(person => unlockedSuspects.includes(person.id))
      .flatMap(person => {
        const cards: LeadBoardNode[] = [{
          type: 'suspect', id: person.id, title: person.name, summary: person.role
        }];
        if (person.alibi?.trim()) cards.push({
          type: 'alibi', id: person.id, title: `${person.name}'s alibi`, summary: person.alibi
        });
        return cards;
      });
    const locations = (story?.locations || [])
      .filter(location => unlockedLocations.includes(location.id))
      .map(location => ({
        type: 'location' as const,
        id: location.id,
        title: location.title,
        summary: location.notes || location.subtitle
      }));
    return [...evidence, ...statements, ...people, ...locations];
  }, [story, unlockedEvidence, unlockedLocations, unlockedSuspects, recordedClues]);

  const nodesByKey = useMemo(() => new Map(nodes.map(node => [referenceKey(node), node])), [nodes]);
  const cardsByKey = useMemo(() => new Map(placedCards.map(card => [referenceKey(card), card])), [placedCards]);
  const canvasWidth = Math.max(document.documentElement.clientWidth - 32, ...placedCards.map(card => card.x + CARD_WIDTH + 24));
  const canvasHeight = Math.max(window.innerHeight - 75, 700, ...placedCards.map(card => card.y + CARD_HEIGHT + 100));
  const groups = LEAD_GROUPS.map(group => ({
    ...group,
    nodes: nodes.filter(node => group.types.includes(node.type))
  }));

  function replaceVisibleCards(cards: ILeadBoardCard[]) {
    placedCardsRef.current = cards;
    setPlacedCards(cards);
  }

  function commitCards(cards: ILeadBoardCard[]) {
    replaceVisibleCards(cards);
    setLeadBoardCards(cards);
  }

  function openLeadMenu(screenX: number, screenY: number, boardX: number, boardY: number) {
    const left = Math.max(8, Math.min(screenX, window.innerWidth - 310));
    const top = Math.max(8, Math.min(screenY, window.innerHeight - 390));
    setBoardMessage('');
    setMenu({ screenX: left, screenY: top, boardX, boardY, group: null });
  }

  function handleContextMenu(event: ReactMouseEvent<HTMLDivElement>) {
    if ((event.target as HTMLElement).closest('.lead-board-card')) return;
    event.preventDefault();
    const surface = surfaceRef.current;
    if (!surface) return;
    const bounds = surface.getBoundingClientRect();
    openLeadMenu(event.clientX, event.clientY, event.clientX - bounds.left, event.clientY - bounds.top);
  }

  function cancelTouchMenu() {
    if (longPressTimerRef.current !== null) window.clearTimeout(longPressTimerRef.current);
    longPressTimerRef.current = null;
    touchMenuRef.current = null;
  }

  function beginTouchMenu(event: ReactPointerEvent<HTMLDivElement>) {
    if (event.pointerType !== 'touch' || event.target !== surfaceRef.current) return;
    cancelTouchMenu();
    const touch = { pointerId: event.pointerId, clientX: event.clientX, clientY: event.clientY };
    touchMenuRef.current = touch;
    longPressTimerRef.current = window.setTimeout(() => {
      const surface = surfaceRef.current;
      if (!surface) return;
      const bounds = surface.getBoundingClientRect();
      openLeadMenu(touch.clientX, touch.clientY, touch.clientX - bounds.left, touch.clientY - bounds.top);
      longPressTimerRef.current = null;
      touchMenuRef.current = null;
    }, 550);
  }

  function moveTouchMenu(event: ReactPointerEvent<HTMLDivElement>) {
    const touch = touchMenuRef.current;
    if (touch?.pointerId !== event.pointerId) return;
    if (Math.hypot(event.clientX - touch.clientX, event.clientY - touch.clientY) > 12) cancelTouchMenu();
  }

  function finishTouchMenu(event: ReactPointerEvent<HTMLDivElement>) {
    if (touchMenuRef.current?.pointerId === event.pointerId) cancelTouchMenu();
  }

  function placeLead(node: LeadBoardNode) {
    if (!menu) return;
    if (placedCardsRef.current.length >= 200) {
      setBoardMessage('This board has reached its 200-card limit. Remove a card to add another.');
      setMenu(null);
      return;
    }
    const key = referenceKey(node);
    if (placedCardsRef.current.some(card => referenceKey(card) === key)) {
      setBoardMessage('That lead is already on the board.');
      return;
    }

    let x = Math.max(12, Math.min(Math.min(MAX_CANVAS_COORDINATE - CARD_WIDTH, canvasWidth - CARD_WIDTH), Math.round(menu.boardX - CARD_WIDTH / 2)));
    let y = Math.max(12, Math.min(MAX_CANVAS_COORDINATE - CARD_HEIGHT, Math.round(menu.boardY - CARD_HEIGHT / 2)));
    let attempts = 0;
    while (attempts < 20 && placedCardsRef.current.some(card => Math.abs(card.x - x) < 35 && Math.abs(card.y - y) < 35)) {
      x = Math.min(MAX_CANVAS_COORDINATE - CARD_WIDTH, x + 28);
      y = Math.min(MAX_CANVAS_COORDINATE - CARD_HEIGHT, y + 28);
      attempts += 1;
    }

    commitCards([...placedCardsRef.current, { type: node.type, id: node.id, x, y }]);
    setMenu(null);
    setBoardMessage(`${typeLabel(node.type)} card added.`);
  }

  function removeCard(card: ILeadBoardCard) {
    const key = referenceKey(card);
    const nextCards = placedCardsRef.current.filter(item => referenceKey(item) !== key);
    commitCards(nextCards);
    setLeadBoardConnections(leadBoardConnections.filter(connection =>
      referenceKey(connection.from) !== key && referenceKey(connection.to) !== key
    ));
    if (selectedCardKey === key) setSelectedCardKey(null);
    if (pendingConnection && (referenceKey(pendingConnection.from) === key || referenceKey(pendingConnection.to) === key)) {
      setPendingConnection(null);
    }
  }

  function selectCard(card: ILeadBoardCard) {
    if (pendingConnection) return;
    const key = referenceKey(card);
    setBoardMessage('');
    if (!selectedCardKey) {
      setSelectedCardKey(key);
      return;
    }
    if (selectedCardKey === key) {
      setSelectedCardKey(null);
      return;
    }

    const selectedReference = JSON.parse(selectedCardKey) as [LeadBoardLeadType, string];
    const from = { type: selectedReference[0], id: selectedReference[1] };
    const to = { type: card.type, id: card.id };
    const matching = leadBoardConnections.find(connection => connectionKey(connection) === connectionKey({
      from, to, relationship: 'related', note: ''
    }));
    setSelectedCardKey(null);
    setConnectionError('');
    if (matching) {
      openConnectionEditor({ ...matching, editingKey: connectionKey(matching) });
      return;
    }
    if (leadBoardConnections.length >= 300) {
      setBoardMessage('This board has reached its 300-connection limit. Remove a link to add another.');
      return;
    }
    openConnectionEditor({ from, to, relationship: 'related', note: '' });
  }

  function openConnectionEditor(connection: PendingConnection) {
    setConnectionError('');
    setConnectionReason(connection.note);
    setPendingConnection(connection);
  }

  function closeConnectionEditor() {
    setPendingConnection(null);
    setConnectionReason('');
    setConnectionError('');
  }

  function beginCardDrag(event: ReactPointerEvent<HTMLDivElement>, card: ILeadBoardCard) {
    if (event.button !== 0) return;
    event.preventDefault();
    event.stopPropagation();
    const surface = surfaceRef.current;
    if (!surface) return;
    const bounds = surface.getBoundingClientRect();
    cardDragRef.current = {
      id: referenceKey(card),
      pointerId: event.pointerId,
      startClientX: event.clientX,
      startClientY: event.clientY,
      grabX: event.clientX - bounds.left - card.x,
      grabY: event.clientY - bounds.top - card.y,
      moved: false
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function moveCard(event: ReactPointerEvent<HTMLDivElement>) {
    const drag = cardDragRef.current;
    const surface = surfaceRef.current;
    if (!drag || !surface || drag.pointerId !== event.pointerId) return;
    if (!drag.moved && Math.hypot(event.clientX - drag.startClientX, event.clientY - drag.startClientY) < 4) return;
    drag.moved = true;
    const bounds = surface.getBoundingClientRect();
    const x = Math.max(0, Math.min(Math.min(MAX_CANVAS_COORDINATE, canvasWidth - CARD_WIDTH), Math.round(event.clientX - bounds.left - drag.grabX)));
    const y = Math.max(0, Math.min(MAX_CANVAS_COORDINATE, Math.round(event.clientY - bounds.top - drag.grabY)));
    replaceVisibleCards(placedCardsRef.current.map(card => referenceKey(card) === drag.id ? { ...card, x, y } : card));
  }

  function finishCardDrag(event: ReactPointerEvent<HTMLDivElement>, card: ILeadBoardCard) {
    const drag = cardDragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    cardDragRef.current = null;
    if (drag.moved) {
      commitCards(placedCardsRef.current);
    } else {
      selectCard(card);
    }
  }

  function saveConnection(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!pendingConnection) return;
    const cleanedNote = connectionReason.trim();
    if (!cleanedNote) {
      setConnectionError('Write a short reason for this connection.');
      return;
    }
    const saved: ILeadBoardConnection = {
      from: pendingConnection.from,
      to: pendingConnection.to,
      relationship: pendingConnection.relationship,
      note: cleanedNote
    };
    delete (saved as PendingConnection).editingKey;
    if (pendingConnection.editingKey) {
      setLeadBoardConnections(leadBoardConnections.map(connection =>
        connectionKey(connection) === pendingConnection.editingKey ? saved : connection
      ));
    } else {
      setLeadBoardConnections([...leadBoardConnections, saved]);
    }
    closeConnectionEditor();
    setBoardMessage('Connection saved to this case board.');
  }

  function removeConnection() {
    if (!pendingConnection?.editingKey) return;
    setLeadBoardConnections(leadBoardConnections.filter(connection => connectionKey(connection) !== pendingConnection.editingKey));
    closeConnectionEditor();
    setBoardMessage('Connection removed.');
  }

  function drawConnection(connection: ILeadBoardConnection, draft = false) {
    const from = cardsByKey.get(referenceKey(connection.from));
    const to = cardsByKey.get(referenceKey(connection.to));
    if (!from || !to) return null;
    const style = relationshipInfo(connection.relationship);
    const fromNailX = from.x + CARD_WIDTH / 2;
    const fromNailY = from.y + 15.5;
    const toNailX = to.x + CARD_WIDTH / 2;
    const toNailY = to.y + 15.5;
    const deltaX = toNailX - fromNailX;
    const deltaY = toNailY - fromNailY;
    const distance = Math.hypot(deltaX, deltaY) || 1;
    const nailRadius = 7.5;
    const x1 = fromNailX + (deltaX / distance) * nailRadius;
    const y1 = fromNailY + (deltaY / distance) * nailRadius;
    const x2 = toNailX - (deltaX / distance) * nailRadius;
    const y2 = toNailY - (deltaY / distance) * nailRadius;
    const midX = (x1 + x2) / 2;
    const midY = (y1 + y2) / 2;
    const reason = (draft ? connectionReason : connection.note).trim() || (draft ? 'Write a reason' : 'Click to add reason');
    const editing = !draft && pendingConnection?.editingKey === connectionKey(connection);

    return (
      <g
        key={draft ? 'draft-connection' : connectionKey(connection)}
        className={`lead-board-edge${draft ? ' is-draft' : ''}${editing ? ' is-editing' : ''}`}
      >
        <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={style.color} strokeWidth={draft ? 3 : 2.5} strokeDasharray={draft ? '8 7' : undefined} />
        <g
          className="lead-board-edge-label"
          transform={`translate(${midX} ${midY})`}
          role="button"
          tabIndex={draft ? -1 : 0}
          aria-label={draft ? 'Add a reason for this connection' : `Edit connection reason: ${reason}`}
          onClick={() => !draft && !pendingConnection && openConnectionEditor({ ...connection, editingKey: connectionKey(connection) })}
          onKeyDown={event => {
            if (!draft && !pendingConnection && (event.key === 'Enter' || event.key === ' ')) {
              event.preventDefault();
              openConnectionEditor({ ...connection, editingKey: connectionKey(connection) });
            }
          }}
        >
          <title>{reason}</title>
          <rect x="-93" y="-16" width="186" height="32" rx="8" fill="#f5e8c8" stroke={style.color} strokeWidth="2" />
          <text x="0" y="4" textAnchor="middle">{shorten(reason, 31)}</text>
        </g>
      </g>
    );
  }

  const menuGroup = menu ? groups.find(group => group.id === menu.group) : undefined;

  return (
    <main className="page-wrapper lead-board-page">
      <header className="lead-board-header">
        <div className="taped-title handwritten">Visual Lead Board</div>
      </header>

      <section className="lead-board-workspace" aria-label="Investigation lead board">
        {leadBoardSaveStatus === 'Save failed' && (
          <div className="lead-board-floating-tools" aria-live="polite">
            <span>Save failed</span>
            <button type="button" className="lead-board-secondary-button" onClick={retryLeadBoardSave}>Retry</button>
          </div>
        )}

        {boardMessage && <p className="lead-board-feedback" aria-live="polite">{boardMessage}</p>}

        {pendingConnection && (
          <form className="lead-board-link-editor" onSubmit={saveConnection}>
            <div className="lead-board-editor-title">
              <div>
                <h3>{pendingConnection.editingKey ? 'Edit connection' : 'Explain this connection'}</h3>
                <p>{nodesByKey.get(referenceKey(pendingConnection.from))?.title} ↔ {nodesByKey.get(referenceKey(pendingConnection.to))?.title}</p>
              </div>
              <button type="button" className="lead-board-icon-button" aria-label="Close connection editor" onClick={closeConnectionEditor}>×</button>
            </div>
            <label>
              Relationship
              <select
                value={pendingConnection.relationship}
                onChange={event => setPendingConnection(current => current ? { ...current, relationship: event.target.value as LeadBoardRelationship } : current)}
              >
                {RELATIONSHIPS.map(item => <option key={item.value} value={item.value}>{item.label}</option>)}
              </select>
            </label>
            <label className="lead-board-reason-field">
              Reason shown on the line
              <textarea
                ref={reasonInputRef}
                value={connectionReason}
                maxLength={500}
                onChange={event => {
                  setConnectionError('');
                  setConnectionReason(event.target.value);
                }}
                placeholder="What do these two leads suggest when considered together?"
              />
              <span>{connectionReason.length}/500</span>
            </label>
            {connectionError && <p className="lead-board-form-error" role="alert">{connectionError}</p>}
            <div className="lead-board-editor-actions">
              {pendingConnection.editingKey && <button type="button" className="lead-board-danger-button" onClick={removeConnection}>Remove link</button>}
              <button type="button" className="lead-board-secondary-button" onClick={closeConnectionEditor}>Cancel</button>
              <button type="submit" className="lead-board-primary-button">{pendingConnection.editingKey ? 'Save reason' : 'Draw connection'}</button>
            </div>
          </form>
        )}

        <div
          className="lead-board-viewport"
          onContextMenu={handleContextMenu}
          onPointerDown={beginTouchMenu}
          onPointerMove={moveTouchMenu}
          onPointerUp={finishTouchMenu}
          onPointerCancel={finishTouchMenu}
        >
          <div
            className="lead-board-canvas"
            ref={surfaceRef}
            style={{ width: `${canvasWidth}px`, height: `${canvasHeight}px` }}
          >
            <svg className="lead-board-connection-layer" width={canvasWidth} height={canvasHeight} aria-label="Connections between leads">
              {leadBoardConnections.map(connection => drawConnection(connection))}
              {pendingConnection && !pendingConnection.editingKey && drawConnection(pendingConnection, true)}
            </svg>

            {placedCards.length === 0 && (
              <div className="lead-board-empty-canvas">
                <span aria-hidden="true">＋</span>
                <strong>Start your investigation board</strong>
                <p>Right-click an open space to add a lead. On touch screens, press and hold.</p>
              </div>
            )}

            {placedCards.map(card => {
              const node = nodesByKey.get(referenceKey(card));
              if (!node) return null;
              const cardKey = referenceKey(card);
              const selected = selectedCardKey === cardKey;
              return (
                <div
                  className={`lead-board-card lead-card-${card.type}${selected ? ' is-selected' : ''}`}
                  key={cardKey}
                  style={{ left: card.x, top: card.y }}
                  onPointerDown={event => beginCardDrag(event, card)}
                  onPointerMove={moveCard}
                  onPointerUp={event => finishCardDrag(event, card)}
                  onPointerCancel={event => {
                    if (cardDragRef.current?.pointerId === event.pointerId) {
                      const drag = cardDragRef.current;
                      cardDragRef.current = null;
                      if (drag.moved) commitCards(placedCardsRef.current);
                    }
                  }}
                  role="group"
                  tabIndex={0}
                  aria-label={`${typeLabel(card.type)}: ${node.title}${selected ? ', selected' : ''}. Drag to move; on touch screens drag from the pin. Click to connect.`}
                  onKeyDown={event => {
                    if (event.target !== event.currentTarget) return;
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault();
                      selectCard(card);
                    }
                  }}
                >
                  <span className="lead-board-card-pin" aria-hidden="true" />
                  <button
                    type="button"
                    className="lead-board-card-remove"
                    aria-label={`Remove ${node.title} from board`}
                    onPointerDown={event => event.stopPropagation()}
                    onClick={event => { event.stopPropagation(); removeCard(card); }}
                  >×</button>
                  <span className="lead-board-card-type">{typeLabel(card.type)}</span>
                  <strong>{node.title}</strong>
                  <span className="lead-board-card-summary">{shorten(node.summary || 'No additional details recorded.', 145)}</span>
                  {selected && <span className="lead-board-card-selected">Selected · choose another card</span>}
                </div>
              );
            })}

          </div>
        </div>
      </section>

      {menu && (
        <div
          className="lead-board-context-menu"
          ref={menuRef}
          role="dialog"
          aria-label="Add a lead to the board"
          style={{ left: menu.screenX, top: menu.screenY }}
        >
          {!menu.group ? (
            <>
              <div className="lead-board-menu-heading">Add a card</div>
              {groups.map(group => (
                <button
                  type="button"
                  className="lead-board-menu-option"
                  key={group.id}
                  disabled={group.nodes.length === 0}
                  onClick={() => setMenu({ ...menu, group: group.id })}
                >
                  <span>{group.label}</span><span>{group.nodes.length} ›</span>
                </button>
              ))}
              <button type="button" className="lead-board-menu-close" onClick={() => setMenu(null)}>Cancel</button>
            </>
          ) : (
            <>
              <div className="lead-board-menu-heading">
                <button type="button" className="lead-board-menu-back" onClick={() => setMenu({ ...menu, group: null })}>‹ Categories</button>
                {menuGroup?.label}
              </div>
              <div className="lead-board-menu-list">
                {(menuGroup?.nodes || []).map(node => {
                  const isPlaced = placedCards.some(card => referenceKey(card) === referenceKey(node));
                  return (
                    <button
                      type="button"
                      className="lead-board-menu-option"
                      key={referenceKey(node)}
                      disabled={isPlaced}
                      onClick={() => placeLead(node)}
                    >
                      <span><small>{typeLabel(node.type)}</small>{node.title}</span>
                      {isPlaced && <span>On board</span>}
                    </button>
                  );
                })}
              </div>
              <button type="button" className="lead-board-menu-close" onClick={() => setMenu(null)}>Cancel</button>
            </>
          )}
        </div>
      )}
    </main>
  );
}
