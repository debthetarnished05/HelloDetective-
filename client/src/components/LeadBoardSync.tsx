import { useEffect, useRef } from 'react';
import { gameApi } from '../api/client';
import { useGameStore } from '../store/gameStore';
import type { ILeadBoardCard, ILeadBoardConnection } from '../types/index';

export default function LeadBoardSync() {
  const sessionId = useGameStore(state => state.sessionId);
  const cards = useGameStore(state => state.leadBoardCards);
  const connections = useGameStore(state => state.leadBoardConnections);
  const retryCount = useGameStore(state => state.leadBoardSaveRetry);
  const setSaveStatus = useGameStore(state => state.setLeadBoardSaveStatus);
  const latestSnapshot = useRef('');
  const lastSaved = useRef<{ sessionId: string; snapshot: string } | null>(null);
  const saveQueue = useRef<Promise<void>>(Promise.resolve());
  const serializedBoard = JSON.stringify({ cards, connections });

  useEffect(() => {
    latestSnapshot.current = serializedBoard;
  }, [serializedBoard]);

  useEffect(() => {
    if (!sessionId) return;
    lastSaved.current = { sessionId, snapshot: serializedBoard };
    setSaveStatus('');
  }, [sessionId]);

  useEffect(() => {
    if (!sessionId) return;
    const snapshot = serializedBoard;
    if (lastSaved.current?.sessionId === sessionId && lastSaved.current.snapshot === snapshot) return;

    const payload = JSON.parse(snapshot) as { cards: ILeadBoardCard[]; connections: ILeadBoardConnection[] };
    const timeout = window.setTimeout(() => {
      setSaveStatus('Saving…');
      saveQueue.current = saveQueue.current.catch(() => undefined).then(async () => {
        const result = await gameApi.saveLeadBoard(sessionId, payload.cards, payload.connections);
        const savedSnapshot = JSON.stringify(result);
        lastSaved.current = { sessionId, snapshot: savedSnapshot };
        if (useGameStore.getState().sessionId === sessionId && latestSnapshot.current === savedSnapshot) {
          setSaveStatus('Saved to this case');
        }
      }).catch(() => {
        if (useGameStore.getState().sessionId === sessionId && latestSnapshot.current === snapshot) {
          setSaveStatus('Save failed');
        }
      });
    }, 700);

    return () => window.clearTimeout(timeout);
  }, [sessionId, serializedBoard, retryCount]);

  return null;
}
