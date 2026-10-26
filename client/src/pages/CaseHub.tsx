import React from 'react';
import { useGameStore } from '../store/gameStore';

export default function CaseHub() {
  const { currentStage } = useGameStore();

  return (
    <div className="page-wrapper">
      
      {/* Title Card */}
      <div className="taped-title handwritten">
        The TechVision Murder (Stage {currentStage})
      </div>

      {/* Grid Layout for the Dashboard Notes */}
      <div style={styles.dashboardGrid}>
        
        {/* Card 1: Case Details & Victim Profile */}
        <div className=" center-tape-note" style={styles.card}>
          <h2 className="handwritten" style={styles.cardHeader}>Victim Profile</h2>
          
          <div style={styles.contentBlock}>
            <p><strong>Case Number:</strong> 2025-0421-MR</p>
            <p><strong>Status:</strong> Active Investigation</p>
            <p><strong>Lead Detective:</strong> Alex Morgan</p>
          </div>
          
          <div style={styles.contentBlock}>
            <p><strong>Name:</strong> Michael Reynolds (Age: 42)</p>
            <p><strong>Occupation:</strong> CEO & Co-Founder, TechVision Solutions</p>
            <p><strong>Discovered:</strong> April 18, 2025, 8:45 AM by janitor Maria Garcia</p>
            <p><strong>Cause of Death:</strong> Single stab wound to the chest with a letter opener</p>
            <p><strong>Time of Death:</strong> Between 10:30 PM and 11:30 PM, April 17, 2025</p>
          </div>
        </div>

        {/* Card 2: Initial Briefing & Insights */}
        <div className=" center-tape-note" style={styles.card}>
          <h2 className="handwritten" style={styles.cardHeader}>Briefing & Insights</h2>
          
          <div style={styles.contentBlock}>
            <h3 style={styles.subHeader}>Initial Briefing</h3>
            <p style={styles.text}>
              You've been assigned to investigate the murder of Michael Reynolds, found dead in his office at Riverside Corporate Center. Initial evidence suggests his business partner, Marcus Chen, may be involved. Security footage shows someone matching his build entering the building around the estimated time of death, and threatening emails were traced to a coffee shop Marcus frequented.
            </p>
            <p style={styles.text}>
              The victim's sister, Sarah Reynolds, stands to benefit financially from his death through a recently updated life insurance policy. A neighbor, Diana Wilkins, has provided helpful information but seems unusually nervous during interviews.
            </p>
          </div>

          <div style={styles.contentBlock}>
            <h3 style={styles.subHeader}>Detective's Insights</h3>
            <p style={styles.text}>
              The case against Marcus Chen seems straightforward - perhaps too straightforward. The threatening email and security footage make him an obvious suspect, but several details don't align. The victim's personal diary suggests complicated relationships with multiple individuals. Building security is sophisticated, requiring keycard access after hours.
            </p>
            <p style={styles.text}>
              The nervous behavior of Diana Wilkins warrants closer examination. Her apartment's proximity to the victim's could be significant. The coffee shop connection requires further investigation - who exactly sent that email?
            </p>
          </div>
        </div>

        {/* Card 3: Status & Objectives */}
        <div className="center-tape-note" style={styles.card}>
          <h2 className="handwritten" style={styles.cardHeader}>Progress & Objectives</h2>
          
          <div style={styles.contentBlock}>
            <h3 style={styles.subHeader}>Investigation Progress</h3>
            <ul style={styles.list}>
              <li>Crime scene examined and initial evidence collected</li>
              <li>Preliminary interviews conducted with Marcus Chen and Sarah Reynolds</li>
              <li>Access to security footage from Riverside Corporate Center</li>
              <li>Discovery of threatening email on victim's laptop</li>
              <li>Phone records obtained showing calls between victim and Marcus Chen on night of murder</li>
            </ul>
          </div>

          <div style={styles.contentBlock}>
            <h3 style={styles.subHeader}>Current Objectives</h3>
            <ol style={styles.list}>
              <li>Analyze security footage to confirm identity of person entering building</li>
              <li>Interview Diana Wilkins, neighbor who claimed to hear an argument the night of the murder</li>
              <li>Investigate IP address origin at local coffee shop</li>
              <li>Review victim's personal records and financial situation</li>
              <li>Check building access logs for the night of the murder</li>
            </ol>
          </div>
        </div>

        {/* Card 4: Case Board Status */}
        <div className="center-tape-note" style={styles.card}>
          <h2 className="handwritten" style={styles.cardHeader}>Persons of Interest</h2>
          
          <div style={styles.contentBlock}>
            <h3 style={styles.subHeader}>Primary Suspect: Marcus Chen</h3>
            <ul style={styles.list}>
              <li><strong>Motive:</strong> Would gain control of company patents; recent business disputes</li>
              <li><strong>Evidence:</strong> Security footage shows similar build; threatening email traced to frequented coffee shop</li>
              <li><strong>Alibi:</strong> Claims to have been working at another location</li>
            </ul>
          </div>

          <div style={styles.contentBlock}>
            <h3 style={styles.subHeader}>POI: Sarah Reynolds (Victim's Sister)</h3>
            <ul style={styles.list}>
              <li><strong>Motive:</strong> Recently named beneficiary of $2 million life insurance policy</li>
              <li><strong>Alibi:</strong> Claims to have been home alone</li>
              <li><strong>Notes:</strong> Appears genuinely distraught; financial records show significant debt</li>
            </ul>
          </div>

          <div style={styles.contentBlock}>
            <h3 style={styles.subHeader}>Witness: Diana Wilkins (Neighbor)</h3>
            <ul style={styles.list}>
              <li><strong>Statement:</strong> Heard argument from victim's apartment night of murder</li>
              <li><strong>Behavior:</strong> Unusually helpful but noticeably nervous during interview</li>
              <li><strong>Notes:</strong> Recently moved into apartment adjacent to victim's</li>
            </ul>
          </div>
        </div>

      </div>
    </div>
  );
}

const styles = {
  dashboardGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))',
    gap: '40px',
    width: '100%',
    maxWidth: '1400px',
    marginTop: '20px',
    alignItems: 'start'
  },
  card: {
    backgroundColor: '#c9d6b8', /* Matching the faded green flat paper style */
    padding: '30px',
    boxShadow: '2px 4px 15px rgba(0, 0, 0, 0.4)',
    transform: 'none', /* Flat, no tilt */
    maxWidth: '100%'
  },
  cardHeader: {
    fontSize: '2.2rem',
    color: '#2c3e50',
    borderBottom: '2px solid rgba(0,0,0,0.1)',
    paddingBottom: '10px',
    marginBottom: '20px',
    textAlign: 'center' as const
  },
  contentBlock: {
    marginBottom: '20px'
  },
  subHeader: {
    fontSize: '1.1rem',
    fontFamily: 'monospace',
    color: '#8b3a3a',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.5px',
    marginBottom: '10px'
  },
  text: {
    fontFamily: 'monospace',
    fontSize: '1rem',
    lineHeight: '1.6',
    color: '#444',
    marginBottom: '10px'
  },
  list: {
    fontFamily: 'monospace',
    fontSize: '0.95rem',
    lineHeight: '1.6',
    color: '#444',
    paddingLeft: '20px'
  }
};