import { Link } from 'react-router-dom';
import { useGameStore } from '../store/gameStore';

export default function Navigation() {
  const { currentStage } = useGameStore();

  return (
    <nav style={styles.navBar}>
      <h2 style={{ fontFamily: 'Caveat, cursive', margin: 0 }}>TechVision Case - Stage {currentStage}</h2>
      <div style={styles.links}>
        <Link to="/" style={styles.link}>Case Hub</Link>
        <Link to="/evidence" style={styles.link}>Evidence Locker</Link>
        <Link to="/locations" style={styles.link}>Locations</Link>
        <Link to="/suspects" style={styles.link}>Suspects</Link>
        <Link to="/officer" style={styles.link}>Officer Davis (Deductions)</Link>
        <Link to="/warrant" style={{ ...styles.link, color: '#ff9999' }}>Submit Warrant</Link>
      </div>
    </nav>
  );
}

const styles = {
navBar: {
    display: 'flex', 
    justifyContent: 'space-between', 
    alignItems: 'center',
    background: '#2c3e50', 
    color: 'white', 
    padding: '15px 30px',
    boxShadow: '0 4px 6px rgba(0,0,0,0.3)', 
    position: 'fixed' as const,
    top: 0, 
    left: 0,                   // <-- ADD THIS
    width: '100%', 
    boxSizing: 'border-box' as const, // <-- ADD THIS to prevent padding from pushing it off-screen
    zIndex: 1000
  },
  links: { display: 'flex', gap: '20px' },
  link: { color: 'white', textDecoration: 'none', fontWeight: 'bold' }
};