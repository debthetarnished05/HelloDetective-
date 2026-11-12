import { matchesGuestSessionToken } from '../utils/guestSession.js';

interface GameSessionAccessState {
  userId?: unknown;
  guestAccessTokenHash?: string | null;
}

interface GameSessionRequester {
  userId?: unknown;
  guestAccessToken?: string;
}

export function canAccessGameSession(session: GameSessionAccessState, requester: GameSessionRequester): boolean {
  if (!session.userId) {
    return !requester.userId && matchesGuestSessionToken(
      requester.guestAccessToken || '',
      session.guestAccessTokenHash
    );
  }

  return Boolean(requester.userId) && String(session.userId) === String(requester.userId);
}
