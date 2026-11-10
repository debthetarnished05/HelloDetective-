import { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { gameApi } from './api/client';
import { useGameStore } from './store/gameStore';
import { useAuthStore } from './store/authStore';
import Navigation from './components/Navigation';
import NotepadSidebar from './components/NotepadSidebar';
import AuthModal from './components/AuthModal';
import DetectiveProfileModal from './components/DetectiveProfileModal';

import CaseHub from './pages/CaseHub';
import SuspectsDirectory from './pages/SuspectsDirectory';
import EvidenceLocker from './pages/EvidenceLocker';
import Locations from './pages/Locations';
import OfficerDesk from './pages/OfficerDesk';
import Warrant from './pages/Warrant';
import StoryCreator from './pages/StoryCreator';

function App() {
  const { sessionId, setSessionData } = useGameStore();
  const { initAuth, user } = useAuthStore();
  const [initError, setInitError] = useState<string | null>(null);

  // Initialize auth credentials on app start
  useEffect(() => {
    initAuth();
  }, [initAuth]);

  // When user logs in/registers and session is active, refresh session data to sync Detective name
  useEffect(() => {
    if (sessionId && user) {
      gameApi.getSession(sessionId)
        .then((result) => setSessionData(result))
        .catch((err) => console.warn('Syncing user session error:', err));
    }
  }, [sessionId, user?.id, setSessionData]);

  useEffect(() => {
    const initGame = async () => {
      try {
        const savedSessionId = localStorage.getItem('detective_session_id');
        if (savedSessionId) {
          try {
            const resumed = await gameApi.getSession(savedSessionId);
            if (resumed && resumed.sessionId && resumed.session) {
              setSessionData(resumed);
              return;
            }
          } catch (resumeErr) {
            console.warn('Saved detective session invalid or expired, starting fresh:', resumeErr);
            localStorage.removeItem('detective_session_id');
          }
        }

        const result = await gameApi.startGame();
        setSessionData(result);
      } catch (error: any) {
        console.error('Failed to initialize game:', error);
        setInitError(error.message || 'Cannot connect to Detective AI backend on port 3001.');
      }
    };

    if (!sessionId) {
      initGame();
    }
  }, [sessionId, setSessionData]);

  if (initError) {
    return (
      <div style={{ textAlign: 'center', marginTop: '15%', color: 'white', fontFamily: 'monospace' }}>
        <h2 style={{ color: '#ff6b6b' }}>Investigation Dispatch Failure</h2>
        <p>{initError}</p>
        <button
          onClick={() => window.location.reload()}
          style={{
            marginTop: '20px',
            padding: '10px 20px',
            backgroundColor: '#8b3a3a',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Retry Connection
        </button>
      </div>
    );
  }

  if (!sessionId) {
    return (
      <div style={{ textAlign: 'center', marginTop: '20%', color: 'white', fontFamily: 'monospace' }}>
        <h2>Accessing Homicide Bureau Files...</h2>
        <p style={{ color: '#aaa', marginTop: '10px' }}>Loading case database & suspects...</p>
      </div>
    );
  }

  return (
    <Router>
      <Navigation />
      <NotepadSidebar />
      <AuthModal />
      <DetectiveProfileModal />

      <div className="main-content-layout">
        <Routes>
          <Route path="/" element={<CaseHub />} />
          <Route path="/suspects" element={<SuspectsDirectory />} />
          <Route path="/evidence" element={<EvidenceLocker />} />
          <Route path="/locations" element={<Locations />} />
          <Route path="/officer" element={<OfficerDesk />} />
          <Route path="/warrant" element={<Warrant />} />
          <Route path="/story-creator" element={<StoryCreator />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;