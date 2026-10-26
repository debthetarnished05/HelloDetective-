import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { gameApi } from './api/client';
import { useGameStore } from './store/gameStore';
import Navigation from './components/Navigation';
import NotepadSidebar from './components/NotepadSidebar'; // 1. Import the sidebar

import CaseHub from './pages/CaseHub';
import SuspectsDirectory from './pages/SuspectsDirectory';
import EvidenceLocker from './pages/EvidenceLocker';
import Locations from './pages/Locations';
import OfficerDesk from './pages/OfficerDesk';
import Warrant from './pages/Warrant';

function App() {
  const { sessionId, setSessionData } = useGameStore();

  useEffect(() => {
    const initGame = async () => {
      try {
        const response = await gameApi.startGame('player_123');
        setSessionData(response.data._id, response.data.unlockedEvidence, response.data.unlockedLocations);
      } catch (error) {
        console.error("Failed to initialize game:", error);
      }
    };
    if (!sessionId) initGame();
  }, [sessionId, setSessionData]);

  if (!sessionId) return <div style={{ textAlign: 'center', marginTop: '20%' }}>Loading...</div>;

  return (
    <Router>
      <Navigation />
      
      {/* 2. Add the Sidebar here */}
      <NotepadSidebar />

      <div style={{ paddingTop: '70px', minHeight: '100vh' }}>
        <Routes>
          <Route path="/" element={<CaseHub />} />
          <Route path="/suspects" element={<SuspectsDirectory />} />
          <Route path="/evidence" element={<EvidenceLocker />} />
          <Route path="/locations" element={<Locations />} />
          <Route path="/officer" element={<OfficerDesk />} />
          <Route path="/warrant" element={<Warrant />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;