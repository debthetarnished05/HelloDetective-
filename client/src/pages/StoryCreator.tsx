import { useState, useEffect } from 'react';
import { gameApi } from '../api/client';
import { useGameStore } from '../store/gameStore';
import type { IStory } from '../types/index';
import { useNavigate } from 'react-router-dom';

interface FormLocation {
  id: string;
  title: string;
  subtitle: string;
  status: string;
  lastVisited: string;
  witnesses: string;
  notes: string;
  unlockStage: number;
}

interface FormEvidence {
  id: string;
  title: string;
  subtitle: string;
  details: string;
  date: string;
  location: string;
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
  unlockStage: number;
}

interface FormSuspect {
  id: string;
  name: string;
  role: string;
  trait: string;
  category: 'prime_suspect' | 'person_of_interest' | 'witness';
  isPrimeSuspect: boolean;
  initialTrust: number;
  initialStress: number;
  alibi: string;
  motive: string;
  privateKnowledge: string;
  secrets: string;
  breakdownThreshold: number;
}

interface FormStage {
  stage: number;
  title: string;
  description: string;
  gateRules: string;
  unlockEvidenceIds: string;
  unlockLocationIds: string;
}

interface CaseFormData {
  title: string;
  caseNumber: string;
  leadDetective: string;
  status: string;
  victimName: string;
  victimAge: number | '';
  victimOccupation: string;
  victimDiscovered: string;
  victimCauseOfDeath: string;
  victimTimeOfDeath: string;
  initialBriefing: string;
  detectiveInsights: string;
  progressText: string;
  currentObjectivesText: string;
  locations: FormLocation[];
  evidence: FormEvidence[];
  suspects: FormSuspect[];
  stages: FormStage[];
  killerId: string;
  groundMotive: string;
  groundWeapon: string;
  groundKeyContradiction: string;
  groundTimelineSummary: string;
}

const EXAMPLE_TEMPLATE: CaseFormData = {
  title: 'The Velvet Alibi: Poison at the Midnight Lounge',
  caseNumber: '1952-0814-VL',
  leadDetective: 'Lieutenant Jack Callahan',
  status: 'Active Homicide Investigation',
  victimName: "Vincent 'Lucky' Moretti",
  victimAge: 47,
  victimOccupation: 'Nightclub Proprietor & Syndicate Boss',
  victimDiscovered: 'August 14, 1952, 2:15 AM in the VIP Backroom',
  victimCauseOfDeath: 'Acute potassium cyanide poisoning via rye highball',
  victimTimeOfDeath: 'Between 1:30 AM and 2:00 AM',
  initialBriefing: 'Vincent Moretti was found slumped across his mahogany desk with an empty whiskey tumbler smelling of bitter almonds. The club was packed for the midnight jazz set, but the private corridor was monitored by his inner circle.',
  detectiveInsights: 'Moretti was preparing to sell the club and divorce his wife. The torch singer, the bartender, and a rival syndicate boss all had access to his private drink stash.',
  progressText: "Secured VIP Backroom crime scene\nImpounded bar glasses for toxicological screening\nDetained primary lounge staff in the Green Room for questioning",
  currentObjectivesText: "Interrogate Delilah Moretti, Mickey Shores, and Salvatore Vance\nDetermine who acquired the pharmaceutical-grade potassium cyanide\nExpose the false alibi regarding the 1:30-2:00 AM performance window\nPresent deduction to Officer Davis to secure a warrant for the office safe",
  locations: [
    {
      id: 'vip_backroom',
      title: 'The VIP Backroom',
      subtitle: 'Midnight Lounge - Rear Corridor',
      status: 'Active Crime Scene',
      lastVisited: 'August 14, 2:20 AM',
      witnesses: 'Club Doorman, Cleaning Maid',
      notes: 'Mahogany desk, half-full rye whiskey bottle, cracked safe with documents missing.',
      unlockStage: 1
    },
    {
      id: 'main_jazz_bar',
      title: 'The Main Jazz Bar & Stage',
      subtitle: 'Midnight Lounge Floor',
      status: 'Location of Interest',
      lastVisited: 'Pending',
      witnesses: 'Patrons, Brass Band Members',
      notes: 'Busy bar counter where all specialty drinks and private decanters are prepped.',
      unlockStage: 1
    },
    {
      id: 'upper_mezzanine_office',
      title: 'Upper Mezzanine Private Office',
      subtitle: 'Midnight Lounge - 2nd Floor',
      status: 'Secured Area',
      lastVisited: 'Pending',
      witnesses: 'Accountant',
      notes: 'Contains private financial ledgers, hidden cash reserves, and divorce filings.',
      unlockStage: 2
    },
    {
      id: 'pier_19_cold_storage',
      title: 'Pier 19 Cold Storage',
      subtitle: 'Waterfront Harbor District',
      status: 'Secondary Crime Scene',
      lastVisited: 'Pending',
      witnesses: 'Dockworkers',
      notes: 'Warehouse used by Salvatore Vance to store smuggled liquors and industrial solvents.',
      unlockStage: 3
    }
  ],
  evidence: [
    {
      id: 'cyanide_whiskey_glass',
      title: 'Crystal Whiskey Tumbler',
      subtitle: 'Traces of lethal potassium cyanide',
      details: 'Lab tests confirm crystalline cyanide dissolved in 18-year rye whiskey.',
      date: 'Aug 14, 2:25 AM',
      location: 'VIP Backroom Desk',
      priority: 'Critical',
      unlockStage: 1
    },
    {
      id: 'torn_roulette_voucher',
      title: 'Torn Gambling Debt Voucher',
      subtitle: 'Signed by Mickey Shores',
      details: 'A debt slip showing Mickey owed Vincent $15,000 due at midnight.',
      date: 'Aug 14, 2:30 AM',
      location: 'Wastebasket under Desk',
      priority: 'High',
      unlockStage: 1
    },
    {
      id: 'silver_powder_compact',
      title: "Delilah's Silver Cosmetic Compact",
      subtitle: 'False compartment with poison residue',
      details: 'A vintage silver compact mirror containing fine white cyanide powder under the powder puff.',
      date: 'Stage 2 Search',
      location: 'Upper Mezzanine Office Vanity',
      priority: 'Critical',
      unlockStage: 2
    },
    {
      id: 'chemical_shipping_manifest',
      title: 'Smuggled Chemical Invoice',
      subtitle: 'Issued to Salvatore Vance',
      details: 'Customs papers showing industrial cyanide shipments cleared through Pier 19.',
      date: 'Stage 3 Search',
      location: 'Pier 19 Cold Storage',
      priority: 'Medium',
      unlockStage: 3
    }
  ],
  suspects: [
    {
      id: 'delilah_moretti',
      name: 'Delilah Moretti',
      role: "Lead Torch Singer & Victim's Wife",
      trait: 'Glamorous, composed, icy under cross-examination, protective of her future',
      category: 'prime_suspect',
      isPrimeSuspect: true,
      initialTrust: 45,
      initialStress: 30,
      alibi: 'Claims she was performing her midnight set on the stage continuously from 1:15 AM to 2:00 AM without stepping off.',
      motive: 'Vincent planned to serve her with divorce papers and cut her out of the estate and club ownership.',
      privateKnowledge: 'She stepped into the VIP backroom during the 10-minute trumpet solo at 1:40 AM to spike his private rye bottle.',
      secrets: "Admitted arguing violently with Vincent backstage before the midnight set\nConfessed she took her passport and cash bundle from Vincent's safe\nRevealed she saw Mickey delivering the drink tray to Vincent's room",
      breakdownThreshold: 75
    },
    {
      id: 'mickey_shores',
      name: "Mickey 'Two-Times' Shores",
      role: 'Head Bartender & Floor Manager',
      trait: 'Nervous, fast-talking, wiping down the bar compulsively, sweating',
      category: 'prime_suspect',
      isPrimeSuspect: true,
      initialTrust: 50,
      initialStress: 40,
      alibi: 'Claims he was behind the main bar mixing cocktails for the crowd all night.',
      motive: 'Vincent held over $15,000 in defaulted gambling markers against him and threatened violence.',
      privateKnowledge: 'Mickey poured the rye at 1:35 AM and brought it to the backroom, but claims Vincent was alive when he set it down.',
      secrets: "Admitted he poured Vincent's private rye at 1:30 AM\nConfessed Vincent threatened to have his hands broken over the gambling debt\nRevealed Salvatore handed him an unlabelled amber vial earlier that evening",
      breakdownThreshold: 70
    },
    {
      id: 'salvatore_vance',
      name: 'Salvatore Vance',
      role: 'Rival Downtown Syndicate Boss',
      trait: 'Arrogant, cigar-smoking, dismissive of police authority',
      category: 'person_of_interest',
      isPrimeSuspect: false,
      initialTrust: 55,
      initialStress: 20,
      alibi: 'Claims he was seated in the front row booth flanked by three bodyguards all evening.',
      motive: 'Wanted to absorb the Midnight Lounge into his gambling and liquor empire.',
      privateKnowledge: 'He offered Delilah the cyanide powder days ago, knowing her desperation to get rid of Vincent.',
      secrets: "Admitted offering Vincent $50,000 to purchase the Midnight Lounge deed\nConfessed meeting Delilah in secret behind the theater two nights ago\nRevealed he stores industrial chemicals at Pier 19",
      breakdownThreshold: 80
    }
  ],
  stages: [
    {
      stage: 1,
      title: 'Stage 1: The Initial Scene (The Alibi Crack)',
      description: "Find the first major flaw in the suspects' stated movements during the 1:30-2:00 AM murder window.",
      gateRules: 'The detective must prove that Delilah Moretti stepped off stage during the trumpet solo or that Mickey delivered the private drink tray.',
      unlockEvidenceIds: 'silver_powder_compact',
      unlockLocationIds: 'upper_mezzanine_office'
    },
    {
      stage: 2,
      title: 'Stage 2: The Hidden Web (The Divorce & Poison)',
      description: "Uncover the financial and domestic motive behind Vincent's assassination.",
      gateRules: 'The detective must present the divorce petition or recover the silver cosmetic compact with cyanide residue.',
      unlockEvidenceIds: 'chemical_shipping_manifest',
      unlockLocationIds: 'pier_19_cold_storage'
    },
    {
      stage: 3,
      title: 'Stage 3: The Cornered Suspects (The Source of Cyanide)',
      description: 'Trace the chemical origin and pin down the exact opportunity.',
      gateRules: 'The detective must establish that the cyanide was obtained from Pier 19 and slipped into the rye glass during the performance break.',
      unlockEvidenceIds: '',
      unlockLocationIds: ''
    },
    {
      stage: 4,
      title: 'Stage 4: The Final Squeeze',
      description: 'Confront the killer with the cosmetic compact and broken alibi to force a confession.',
      gateRules: 'Submit the Arrest Warrant and forensic brief to the District Attorney.',
      unlockEvidenceIds: '',
      unlockLocationIds: ''
    }
  ],
  killerId: 'delilah_moretti',
  groundMotive: 'divorce_and_insurance_estate',
  groundWeapon: 'cyanide_whiskey_glass',
  groundKeyContradiction: 'silver_powder_compact',
  groundTimelineSummary: "Delilah Moretti obtained industrial cyanide from Salvatore Vance. During the extended trumpet solo at 1:42 AM, she slipped off stage, went into Vincent's VIP room, poisoned his rye glass, and returned to the stage to sing the finale before anyone discovered the body."
};

const BLANK_TEMPLATE: CaseFormData = {
  title: '',
  caseNumber: '',
  leadDetective: 'Lead Detective',
  status: 'Active Homicide Investigation',
  victimName: '',
  victimAge: 40,
  victimOccupation: '',
  victimDiscovered: '',
  victimCauseOfDeath: '',
  victimTimeOfDeath: '',
  initialBriefing: '',
  detectiveInsights: '',
  progressText: '',
  currentObjectivesText: '',
  locations: [
    {
      id: 'crime_scene_main',
      title: 'Main Crime Scene',
      subtitle: 'Primary Location',
      status: 'Active Crime Scene',
      lastVisited: 'Recent',
      witnesses: 'None',
      notes: '',
      unlockStage: 1
    }
  ],
  evidence: [
    {
      id: 'evidence_clue_1',
      title: 'Initial Forensic Clue',
      subtitle: 'Found at the scene',
      details: '',
      date: 'Recent',
      location: 'Main Crime Scene',
      priority: 'High',
      unlockStage: 1
    }
  ],
  suspects: [
    {
      id: 'suspect_1',
      name: 'Prime Suspect One',
      role: 'Business Associate / Relative',
      trait: 'Nervous, defensive',
      category: 'prime_suspect',
      isPrimeSuspect: true,
      initialTrust: 50,
      initialStress: 25,
      alibi: '',
      motive: '',
      privateKnowledge: '',
      secrets: '',
      breakdownThreshold: 75
    }
  ],
  stages: [
    {
      stage: 1,
      title: 'Stage 1: The Initial Scene (The Lie)',
      description: 'Break the first suspect alibi.',
      gateRules: 'Discover the initial timeline contradiction.',
      unlockEvidenceIds: '',
      unlockLocationIds: ''
    },
    {
      stage: 2,
      title: 'Stage 2: The Hidden Web (The Motive)',
      description: 'Uncover the motive behind the murder.',
      gateRules: 'Prove the financial or personal motive.',
      unlockEvidenceIds: '',
      unlockLocationIds: ''
    },
    {
      stage: 3,
      title: 'Stage 3: The Cornered Suspects (The Opportunity)',
      description: 'Pin down the murder weapon and opportunity.',
      gateRules: 'Identify the weapon and access window.',
      unlockEvidenceIds: '',
      unlockLocationIds: ''
    },
    {
      stage: 4,
      title: 'Stage 4: The Final Squeeze',
      description: 'Deliver the arrest warrant.',
      gateRules: 'Submit the final warrant.',
      unlockEvidenceIds: '',
      unlockLocationIds: ''
    }
  ],
  killerId: 'suspect_1',
  groundMotive: '',
  groundWeapon: 'evidence_clue_1',
  groundKeyContradiction: '',
  groundTimelineSummary: ''
};

export default function StoryCreator() {
  const [stories, setStories] = useState<IStory[]>([]);
  const [loading, setLoading] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiGenerating, setAiGenerating] = useState(false);
  const [activeTab, setActiveTab] = useState<'manage' | 'ai' | 'form'>('manage');
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [inspectedStory, setInspectedStory] = useState<IStory | null>(null);

  // Form State
  const [formData, setFormData] = useState<CaseFormData>(BLANK_TEMPLATE);

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

  // Helper functions for dynamic lists
  const handleAddLocation = () => {
    const newIdx = formData.locations.length + 1;
    setFormData(prev => ({
      ...prev,
      locations: [
        ...prev.locations,
        {
          id: `location_${newIdx}`,
          title: `Investigation Location ${newIdx}`,
          subtitle: 'Address or Area',
          status: 'Location of Interest',
          lastVisited: 'Pending',
          witnesses: 'None identified',
          notes: '',
          unlockStage: 1
        }
      ]
    }));
  };

  const handleRemoveLocation = (index: number) => {
    if (formData.locations.length <= 1) {
      alert('A case must have at least one location.');
      return;
    }
    setFormData(prev => ({
      ...prev,
      locations: prev.locations.filter((_, i) => i !== index)
    }));
  };

  const handleUpdateLocation = (index: number, field: keyof FormLocation, value: any) => {
    setFormData(prev => {
      const updated = [...prev.locations];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, locations: updated };
    });
  };

  const handleAddEvidence = () => {
    const newIdx = formData.evidence.length + 1;
    setFormData(prev => ({
      ...prev,
      evidence: [
        ...prev.evidence,
        {
          id: `evidence_${newIdx}`,
          title: `Forensic Clue ${newIdx}`,
          subtitle: 'Description or Category',
          details: '',
          date: 'Recent',
          location: prev.locations[0]?.title || 'Crime Scene',
          priority: 'Medium',
          unlockStage: 1
        }
      ]
    }));
  };

  const handleRemoveEvidence = (index: number) => {
    if (formData.evidence.length <= 1) {
      alert('A case must have at least one piece of evidence.');
      return;
    }
    setFormData(prev => ({
      ...prev,
      evidence: prev.evidence.filter((_, i) => i !== index)
    }));
  };

  const handleUpdateEvidence = (index: number, field: keyof FormEvidence, value: any) => {
    setFormData(prev => {
      const updated = [...prev.evidence];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, evidence: updated };
    });
  };

  const handleAddSuspect = () => {
    const newIdx = formData.suspects.length + 1;
    setFormData(prev => ({
      ...prev,
      suspects: [
        ...prev.suspects,
        {
          id: `suspect_${newIdx}`,
          name: `Suspect ${newIdx}`,
          role: 'Role / Occupation',
          trait: 'Distinguishing personality',
          category: 'person_of_interest',
          isPrimeSuspect: false,
          initialTrust: 50,
          initialStress: 20,
          alibi: 'Stated whereabouts during the time of death.',
          motive: 'Possible motive or zero motive.',
          privateKnowledge: 'Secret truth known only to this character.',
          secrets: '',
          breakdownThreshold: 75
        }
      ]
    }));
  };

  const handleRemoveSuspect = (index: number) => {
    if (formData.suspects.length <= 1) {
      alert('A case must have at least one suspect or person of interest.');
      return;
    }
    setFormData(prev => ({
      ...prev,
      suspects: prev.suspects.filter((_, i) => i !== index)
    }));
  };

  const handleUpdateSuspect = (index: number, field: keyof FormSuspect, value: any) => {
    setFormData(prev => {
      const updated = [...prev.suspects];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, suspects: updated };
    });
  };

  const handleUpdateStage = (index: number, field: keyof FormStage, value: any) => {
    setFormData(prev => {
      const updated = [...prev.stages];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, stages: updated };
    });
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    // Validations
    if (!formData.title.trim()) {
      setMessage({ text: 'Please enter a Case Title.', type: 'error' });
      return;
    }
    if (!formData.victimName.trim()) {
      setMessage({ text: 'Please enter the Victim Name.', type: 'error' });
      return;
    }
    if (formData.locations.length === 0) {
      setMessage({ text: 'Please add at least one location.', type: 'error' });
      return;
    }
    if (formData.evidence.length === 0) {
      setMessage({ text: 'Please add at least one evidence item.', type: 'error' });
      return;
    }
    if (formData.suspects.length === 0) {
      setMessage({ text: 'Please add at least one suspect.', type: 'error' });
      return;
    }

    const payload: Partial<IStory> = {
      title: formData.title.trim(),
      caseNumber: formData.caseNumber.trim() || `CASE-${Date.now().toString().slice(-6)}`,
      leadDetective: formData.leadDetective.trim() || 'Lead Detective',
      status: formData.status.trim() || 'Active Homicide Investigation',
      victimProfile: {
        name: formData.victimName.trim(),
        age: Number(formData.victimAge) || 40,
        occupation: formData.victimOccupation.trim() || 'Citizen',
        discovered: formData.victimDiscovered.trim() || 'Crime Scene',
        causeOfDeath: formData.victimCauseOfDeath.trim() || 'Unknown Cause',
        timeOfDeath: formData.victimTimeOfDeath.trim() || 'Estimated TOD Pending'
      },
      briefing: {
        initialBriefing: formData.initialBriefing.trim() || 'No briefing details provided.',
        detectiveInsights: formData.detectiveInsights.trim() || 'Initial impressions pending.'
      },
      objectives: {
        progress: formData.progressText.split('\n').map(s => s.trim()).filter(Boolean),
        currentObjectives: formData.currentObjectivesText.split('\n').map(s => s.trim()).filter(Boolean)
      },
      locations: formData.locations.map((loc, idx) => ({
        ...loc,
        id: loc.id.trim() || `loc_${idx + 1}_${loc.title.toLowerCase().replace(/[^a-z0-9]/g, '_')}`
      })),
      evidence: formData.evidence.map((ev, idx) => ({
        ...ev,
        id: ev.id.trim() || `ev_${idx + 1}_${ev.title.toLowerCase().replace(/[^a-z0-9]/g, '_')}`
      })),
      suspects: formData.suspects.map((susp, idx) => ({
        ...susp,
        id: susp.id.trim() || `susp_${idx + 1}_${susp.name.toLowerCase().replace(/[^a-z0-9]/g, '_')}`,
        secrets: susp.secrets.split('\n').map(s => s.trim()).filter(Boolean)
      })),
      stages: formData.stages.map(st => ({
        stage: st.stage,
        title: st.title.trim(),
        description: st.description.trim(),
        gateRules: st.gateRules.trim(),
        unlockEvidenceIds: st.unlockEvidenceIds.split(',').map(s => s.trim()).filter(Boolean),
        unlockLocationIds: st.unlockLocationIds.split(',').map(s => s.trim()).filter(Boolean)
      })),
      groundTruth: {
        killer: formData.killerId.trim() || formData.suspects[0]?.id || 'suspect_1',
        motive: formData.groundMotive.trim() || 'Undetermined motive',
        weapon: formData.groundWeapon.trim() || formData.evidence[0]?.id || 'evidence_1',
        keyContradiction: formData.groundKeyContradiction.trim() || 'Timeline inconsistency',
        timelineSummary: formData.groundTimelineSummary.trim() || 'Timeline summary pending.'
      },
      isDefault: false
    };

    try {
      setLoading(true);
      await gameApi.createStory(payload);
      setMessage({ text: `Case "${payload.title}" created successfully and saved to MongoDB!`, type: 'success' });
      await loadStories();
      setActiveTab('manage');
    } catch (err: any) {
      console.error('Failed to create custom case:', err);
      setMessage({ text: err.response?.data?.error || err.message || 'Failed to create case.', type: 'error' });
    } finally {
      setLoading(false);
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
          onClick={() => setActiveTab('form')}
          style={{ ...styles.tabBtn, backgroundColor: activeTab === 'form' ? '#8b3a3a' : '#2c3e50' }}
        >
          📝 Case Builder Form
        </button>
      </div>

      {message && (
        <div
          style={{
            maxWidth: '1000px',
            width: '100%',
            padding: '12px 20px',
            marginBottom: '20px',
            borderRadius: '4px',
            backgroundColor: message.type === 'success' ? '#d4edda' : '#f8d7da',
            color: message.type === 'success' ? '#155724' : '#721c24',
            fontFamily: 'monospace',
            textAlign: 'center',
            boxSizing: 'border-box'
          }}
        >
          {message.text}
        </div>
      )}

      {/* TAB 1: ALL SAVED CASES (ALAN WAKE 2 STYLE MIND PLACE CASE BOARD) */}
      {activeTab === 'manage' && (
        <div style={{
          width: '100%',
          maxWidth: '1200px',
          backgroundColor: '#1c140e',
          backgroundImage: `
            radial-gradient(circle at 50% 12%, rgba(65, 48, 36, 0.5) 0%, rgba(14, 10, 8, 0.98) 100%),
            repeating-linear-gradient(90deg, transparent, transparent 135px, rgba(0, 0, 0, 0.4) 135px, rgba(0, 0, 0, 0.4) 138px)
          `,
          border: '4px solid #100b08',
          boxShadow: 'inset 0 0 80px rgba(0,0,0,0.85), 0 12px 36px rgba(0,0,0,0.7)',
          borderRadius: '8px',
          padding: '35px 25px 60px',
          boxSizing: 'border-box'
        }}>
          {/* Board Header Plaque */}
          <div style={{ textAlign: 'center', marginBottom: '45px' }}>
            <div style={{
              display: 'inline-block',
              backgroundColor: 'rgba(10, 7, 5, 0.75)',
              border: '1px solid rgba(210, 180, 150, 0.25)',
              padding: '10px 32px',
              borderRadius: '4px',
              boxShadow: '0 4px 15px rgba(0,0,0,0.6)'
            }}>
              <h2 className="handwritten" style={{
                fontSize: '2.6rem',
                color: '#ebdccb',
                margin: 0,
                letterSpacing: '2px',
                textShadow: '2px 2px 6px rgba(0,0,0,0.9)'
              }}>
                Mind Place // Active Case Files
              </h2>
              <p style={{
                margin: '5px 0 0 0',
                fontFamily: "'Courier New', monospace",
                fontSize: '0.82rem',
                color: '#ba9f88',
                letterSpacing: '2px',
                textTransform: 'uppercase'
              }}>
                FEDERAL BUREAU OF INVESTIGATION • CRIMINAL INVESTIGATIVE DIVISION
              </p>
            </div>
          </div>

          {/* Grid of Manila Dossier Folders hanging from pins & red string */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 360px))',
            gap: '50px 35px',
            justifyContent: 'center',
            padding: '10px 10px 30px'
          }}>
            {stories.map((s) => {
              const isCurrent = currentStory?._id === s._id;
              const victim = s.victimProfile;
              const suspectCount = s.suspects?.length || 0;
              const evidenceCount = s.evidence?.length || 0;
              const locationCount = s.locations?.length || 0;

              // Compute clean short title for folder tab tape
              let tabText = s.title;
              if (tabText.includes(':')) {
                tabText = tabText.split(':')[1].trim();
              }
              if (tabText.length > 28) {
                tabText = tabText.slice(0, 25) + '...';
              }

              return (
                <div
                  key={s._id}
                  style={{
                    position: 'relative',
                    width: '100%',
                    maxWidth: '350px',
                    margin: '0 auto',
                    minHeight: '530px',
                    backgroundColor: '#dec9b8',
                    backgroundImage: 'linear-gradient(145deg, #e5d4c3 0%, #dbcaa0 45%, #ceb7a1 100%)',
                    borderRadius: '3px 18px 4px 4px',
                    boxShadow: '0 12px 28px rgba(0,0,0,0.65), 0 2px 6px rgba(0,0,0,0.4), inset 0 0 35px rgba(110, 70, 40, 0.09)',
                    border: '1px solid #bba490',
                    padding: '24px 20px 20px 34px',
                    boxSizing: 'border-box',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    transition: 'transform 0.25s ease, box-shadow 0.25s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-8px) rotate(-0.5deg)';
                    e.currentTarget.style.boxShadow = '0 22px 42px rgba(0,0,0,0.8), 0 4px 10px rgba(0,0,0,0.5), inset 0 0 35px rgba(110, 70, 40, 0.14)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'none';
                    e.currentTarget.style.boxShadow = '0 12px 28px rgba(0,0,0,0.65), 0 2px 6px rgba(0,0,0,0.4), inset 0 0 35px rgba(110, 70, 40, 0.09)';
                  }}
                >
                  {/* Top Red Crime String & 2 Push Pins */}
                  <div style={{
                    position: 'absolute',
                    top: '0px',
                    left: '26px',
                    right: '32px',
                    height: '2px',
                    backgroundColor: '#b32415',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.4)',
                    zIndex: 5
                  }} />
                  <div style={{
                    position: 'absolute',
                    left: '22px',
                    top: '-7px',
                    width: '14px',
                    height: '14px',
                    borderRadius: '50%',
                    backgroundColor: '#b32415',
                    background: 'radial-gradient(circle at 35% 35%, #ff5e5e 0%, #b32415 75%, #5a0a02 100%)',
                    boxShadow: '1px 2px 5px rgba(0,0,0,0.6)',
                    zIndex: 10
                  }} />
                  <div style={{
                    position: 'absolute',
                    right: '28px',
                    top: '-7px',
                    width: '14px',
                    height: '14px',
                    borderRadius: '50%',
                    backgroundColor: '#b32415',
                    background: 'radial-gradient(circle at 35% 35%, #ff5e5e 0%, #b32415 75%, #5a0a02 100%)',
                    boxShadow: '1px 2px 5px rgba(0,0,0,0.6)',
                    zIndex: 10
                  }} />

                  {/* 3 Debossed Crease Lines on Left Spine */}
                  <div style={{
                    position: 'absolute',
                    left: '14px',
                    top: 0,
                    bottom: 0,
                    width: '10px',
                    display: 'flex',
                    gap: '3px'
                  }}>
                    <div style={{ width: '1.5px', height: '100%', backgroundColor: 'rgba(125, 90, 65, 0.35)' }} />
                    <div style={{ width: '1.5px', height: '100%', backgroundColor: 'rgba(125, 90, 65, 0.35)' }} />
                    <div style={{ width: '1.5px', height: '100%', backgroundColor: 'rgba(125, 90, 65, 0.35)' }} />
                  </div>

                  {/* Right Manila Tab with Mint Green Label Tape */}
                  <div style={{
                    position: 'absolute',
                    right: '-28px',
                    top: '115px',
                    width: '28px',
                    height: '165px',
                    backgroundColor: '#d0ba9f',
                    borderRadius: '0 12px 12px 0',
                    border: '1px solid #bba490',
                    borderLeft: 'none',
                    boxShadow: '3px 4px 8px rgba(0,0,0,0.3)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 6
                  }}>
                    <div style={{
                      position: 'absolute',
                      left: '3px',
                      top: '8px',
                      bottom: '8px',
                      width: '20px',
                      backgroundColor: '#def0dd',
                      border: '1px solid rgba(0,0,0,0.12)',
                      borderRadius: '2px',
                      boxShadow: '0 1px 2px rgba(0,0,0,0.08)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      overflow: 'hidden'
                    }}>
                      <span style={{
                        writingMode: 'vertical-rl',
                        transform: 'rotate(180deg)',
                        fontFamily: "'Courier New', monospace",
                        fontWeight: 'bold',
                        fontSize: '0.72rem',
                        letterSpacing: '1.5px',
                        color: '#2a3b2a',
                        whiteSpace: 'nowrap',
                        textTransform: 'uppercase'
                      }}>
                        {tabText}
                      </span>
                    </div>
                  </div>

                  {/* FOLDER COVER CONTENTS */}
                  <div>
                    {/* Official Bureau Seal SVG */}
                    <div style={{ textAlign: 'center', marginBottom: '12px', marginTop: '4px' }}>
                      <svg width="86" height="86" viewBox="0 0 120 120" style={{ margin: '0 auto', display: 'block', opacity: 0.85 }}>
                        <circle cx="60" cy="60" r="56" fill="none" stroke="#44352b" strokeWidth="2.5" />
                        <circle cx="60" cy="60" r="51.5" fill="none" stroke="#44352b" strokeWidth="1" strokeDasharray="2.5,2.5" />
                        <circle cx="60" cy="60" r="47" fill="none" stroke="#44352b" strokeWidth="1.5" />
                        <defs>
                          <path id={`sealTop_${s._id}`} d="M 19,60 A 41,41 0 0,1 101,60" fill="none" />
                          <path id={`sealBot_${s._id}`} d="M 101,60 A 41,41 0 0,1 19,60" fill="none" />
                        </defs>
                        <text fill="#44352b" fontSize="7.2" fontWeight="bold" fontFamily="monospace" letterSpacing="1.2">
                          <textPath href={`#sealTop_${s._id}`} startOffset="50%" textAnchor="middle">
                            FEDERAL BUREAU OF INVESTIGATION
                          </textPath>
                        </text>
                        <text fill="#44352b" fontSize="6.8" fontWeight="bold" fontFamily="monospace" letterSpacing="1">
                          <textPath href={`#sealBot_${s._id}`} startOffset="50%" textAnchor="middle">
                            CRIMINAL INVESTIGATIVE DIV.
                          </textPath>
                        </text>
                        <circle cx="60" cy="60" r="32" fill="none" stroke="#44352b" strokeWidth="1.2" />
                        <path d="M 46,45 L 74,45 L 74,62 C 74,72 60,78 60,78 C 60,78 46,72 46,62 Z" fill="none" stroke="#44352b" strokeWidth="1.8" />
                        <rect x="47" y="46" width="26" height="6.5" fill="#44352b" opacity="0.35" />
                        <circle cx="52" cy="49.5" r="1.3" fill="#44352b" />
                        <circle cx="60" cy="49.5" r="1.3" fill="#44352b" />
                        <circle cx="68" cy="49.5" r="1.3" fill="#44352b" />
                        <line x1="53" y1="52.5" x2="53" y2="70" stroke="#44352b" strokeWidth="1.5" />
                        <line x1="60" y1="52.5" x2="60" y2="75" stroke="#44352b" strokeWidth="1.5" />
                        <line x1="67" y1="52.5" x2="67" y2="70" stroke="#44352b" strokeWidth="1.5" />
                        <path d="M 50,42 Q 60,37 70,42 Q 60,44 50,42 Z" fill="#44352b" />
                        <circle cx="60" cy="38" r="2.2" fill="#44352b" />
                      </svg>
                    </div>

                    {/* Black Banner: INTERNAL DISSEMINATION ONLY */}
                    <div style={{
                      backgroundColor: '#181412',
                      color: '#ffffff',
                      fontFamily: "'Courier New', monospace",
                      fontSize: '0.66rem',
                      fontWeight: 'bold',
                      letterSpacing: '2px',
                      padding: '4px 10px',
                      textAlign: 'center',
                      borderRadius: '2px',
                      margin: '0 auto 10px auto',
                      maxWidth: '240px',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.3)'
                    }}>
                      INTERNAL DISSEMINATION ONLY
                    </div>

                    {/* Heading: CONFIDENTIAL */}
                    <div style={{
                      fontFamily: "'Courier New', Georgia, serif",
                      fontSize: '1.25rem',
                      fontWeight: 900,
                      letterSpacing: '5px',
                      color: '#221b16',
                      textAlign: 'center',
                      marginBottom: '8px'
                    }}>
                      CONFIDENTIAL
                    </div>

                    {/* Official Legal Disclaimer Paragraph */}
                    <p style={{
                      fontFamily: "'Courier New', monospace",
                      fontSize: '0.48rem',
                      lineHeight: '1.35',
                      color: '#463a32',
                      textAlign: 'justify',
                      margin: '0 auto 14px auto',
                      maxWidth: '260px',
                      letterSpacing: '0.2px',
                      opacity: 0.92
                    }}>
                      ALL INDIVIDUALS HANDLING THIS INFORMATION ARE DESIGNATED TO PROTECT IT FROM UNAUTHORIZED DISCLOSURES IN THE INTEREST OF THE NATIONAL SECURITY OF THE UNITED STATES. HANDLING, STORAGE, DISSEMINATION AND REPRODUCTION OF THIS CLASSIFIED MATERIAL SHALL BE IN ACCORDANCE WITH APPLICABLE STATUTORY GUIDELINES.
                    </p>

                    {/* Stamped Typewriter Case Details Block */}
                    <div style={{
                      backgroundColor: 'rgba(255, 255, 255, 0.42)',
                      border: '1px solid rgba(140, 105, 80, 0.3)',
                      borderRadius: '3px',
                      padding: '9px 12px',
                      margin: '0 auto 12px auto',
                      fontFamily: "'Courier New', monospace",
                      fontSize: '0.74rem',
                      color: '#241a14',
                      lineHeight: '1.45',
                      maxWidth: '265px'
                    }}>
                      <div><strong>CASE NO:</strong> {s.caseNumber}</div>
                      <div style={{ color: '#8b261b', fontWeight: 'bold', marginTop: '2px' }}>{s.title}</div>
                      {victim && (
                        <div style={{ marginTop: '4px', fontSize: '0.70rem', color: '#382b22' }}>
                          <strong>VICTIM:</strong> {victim.name}
                        </div>
                      )}
                      <div style={{ fontSize: '0.67rem', color: '#554236', marginTop: '3px' }}>
                        👥 {suspectCount} Suspects · 🔍 {evidenceCount} Clues · 📍 {locationCount} Locs
                      </div>
                    </div>

                    {/* Active Investigation Stamp if Current */}
                    {isCurrent && (
                      <div style={{ textAlign: 'center', marginBottom: '10px' }}>
                        <div style={{
                          display: 'inline-block',
                          border: '2.5px solid #2e7d32',
                          color: '#2e7d32',
                          fontFamily: "'Courier New', monospace",
                          fontWeight: 'bold',
                          fontSize: '0.74rem',
                          letterSpacing: '1px',
                          padding: '3px 10px',
                          borderRadius: '3px',
                          transform: 'rotate(-4deg)',
                          backgroundColor: 'rgba(255, 255, 255, 0.65)'
                        }}>
                          ★ ACTIVE PLAYTHROUGH ★
                        </div>
                      </div>
                    )}
                  </div>

                  {/* FOLDER ACTIONS */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', zIndex: 10, marginTop: '8px' }}>
                    <button
                      onClick={() => s._id && handleStartGameWithStory(s._id)}
                      className="action-button"
                      style={{
                        margin: 0,
                        padding: '10px 16px',
                        fontSize: '0.92rem',
                        letterSpacing: '1px',
                        backgroundColor: isCurrent ? '#2e7d32' : '#8b261b',
                        boxShadow: '0 3px 6px rgba(0,0,0,0.35)'
                      }}
                      disabled={loading}
                    >
                      {isCurrent ? 'CONTINUE CASE ➔' : 'OPEN CASE FILE ➔'}
                    </button>

                    <button
                      onClick={() => setInspectedStory(s)}
                      type="button"
                      style={{
                        backgroundColor: 'rgba(50, 40, 32, 0.85)',
                        color: '#ebd8c5',
                        border: '1px solid #7c6250',
                        borderRadius: '4px',
                        fontFamily: "'Courier New', monospace",
                        fontSize: '0.78rem',
                        fontWeight: 'bold',
                        padding: '7px 12px',
                        cursor: 'pointer',
                        letterSpacing: '0.5px'
                      }}
                    >
                      INSPECT DOSSIER 🔍
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* INSPECTION DOSSIER MODAL */}
          {inspectedStory && (
            <div style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.85)',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              zIndex: 9999,
              padding: '20px',
              boxSizing: 'border-box'
            }}>
              <div style={{
                maxWidth: '850px',
                width: '100%',
                maxHeight: '90vh',
                overflowY: 'auto',
                backgroundColor: '#f6f1e6',
                backgroundImage: 'linear-gradient(to bottom, #faf6ee 0%, #f1e9da 100%)',
                borderRadius: '6px',
                border: '2px solid #bda893',
                boxShadow: '0 20px 60px rgba(0,0,0,0.9)',
                padding: '30px 35px',
                position: 'relative',
                boxSizing: 'border-box'
              }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  borderBottom: '2px solid #8b3a3a',
                  paddingBottom: '15px',
                  marginBottom: '20px'
                }}>
                  <div>
                    <span style={{
                      backgroundColor: '#1a1410',
                      color: '#fff',
                      fontFamily: 'monospace',
                      fontSize: '0.72rem',
                      letterSpacing: '2px',
                      padding: '3px 8px',
                      borderRadius: '2px',
                      fontWeight: 'bold'
                    }}>
                      CONFIDENTIAL HOMICIDE DOSSIER
                    </span>
                    <h2 style={{ fontFamily: 'Georgia, serif', color: '#2c3e50', fontSize: '1.8rem', margin: '8px 0 4px 0' }}>
                      {inspectedStory.title}
                    </h2>
                    <p style={{ margin: 0, fontFamily: 'monospace', fontSize: '0.85rem', color: '#666' }}>
                      CASE #: <strong>{inspectedStory.caseNumber}</strong> · LEAD: <strong>{inspectedStory.leadDetective}</strong> · STATUS: <span style={{ color: '#8b3a3a' }}>{inspectedStory.status}</span>
                    </p>
                  </div>
                  <button
                    onClick={() => setInspectedStory(null)}
                    style={{
                      background: 'none',
                      border: 'none',
                      fontSize: '1.6rem',
                      cursor: 'pointer',
                      color: '#8b3a3a',
                      fontWeight: 'bold',
                      padding: '4px 8px'
                    }}
                  >
                    ✕
                  </button>
                </div>

                {/* Victim Profile */}
                {inspectedStory.victimProfile && (
                  <div style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.75)',
                    border: '1px solid #dcd5c9',
                    borderRadius: '4px',
                    padding: '16px',
                    marginBottom: '20px',
                    fontFamily: 'monospace',
                    fontSize: '0.88rem'
                  }}>
                    <strong style={{ color: '#8b3a3a', fontSize: '1rem', display: 'block', marginBottom: '8px', borderBottom: '1px dashed #ccc', paddingBottom: '4px' }}>
                      📋 OFFICIAL AUTOPSY & VICTIM PROFILE
                    </strong>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px' }}>
                      <div><strong>Victim:</strong> {inspectedStory.victimProfile.name}</div>
                      <div><strong>Age:</strong> {inspectedStory.victimProfile.age} y/o</div>
                      <div><strong>Occupation:</strong> {inspectedStory.victimProfile.occupation}</div>
                      <div><strong>Discovered:</strong> {inspectedStory.victimProfile.discovered}</div>
                      <div style={{ gridColumn: 'span 2' }}><strong>Cause of Death:</strong> {inspectedStory.victimProfile.causeOfDeath}</div>
                      <div style={{ gridColumn: 'span 2' }}><strong>Est. Time of Death:</strong> {inspectedStory.victimProfile.timeOfDeath}</div>
                    </div>
                  </div>
                )}

                {/* Briefing */}
                {inspectedStory.briefing && (
                  <div style={{ marginBottom: '20px' }}>
                    <strong style={{ fontFamily: 'Georgia, serif', color: '#2c3e50', fontSize: '1.05rem', display: 'block', marginBottom: '6px' }}>
                      Scene Briefing:
                    </strong>
                    <p style={{
                      fontFamily: 'Georgia, serif',
                      fontStyle: 'italic',
                      color: '#333',
                      lineHeight: '1.6',
                      margin: '0 0 12px 0',
                      backgroundColor: 'rgba(255,255,255,0.6)',
                      padding: '12px 16px',
                      borderRadius: '4px',
                      borderLeft: '4px solid #8b3a3a'
                    }}>
                      "{inspectedStory.briefing.initialBriefing}"
                    </p>
                    <strong style={{ fontFamily: 'Georgia, serif', color: '#2c3e50', fontSize: '1.05rem', display: 'block', marginBottom: '6px' }}>
                      Detective Insights:
                    </strong>
                    <p style={{
                      fontFamily: 'monospace',
                      color: '#444',
                      lineHeight: '1.5',
                      margin: 0,
                      backgroundColor: 'rgba(255,255,255,0.6)',
                      padding: '10px 14px',
                      borderRadius: '4px'
                    }}>
                      {inspectedStory.briefing.detectiveInsights}
                    </p>
                  </div>
                )}

                {/* Suspects & Evidence Summary */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '15px', marginBottom: '25px' }}>
                  <div style={{ backgroundColor: 'rgba(255,255,255,0.7)', padding: '14px', borderRadius: '4px', border: '1px solid #ddd' }}>
                    <strong style={{ fontFamily: 'monospace', color: '#2c3e50', display: 'block', marginBottom: '8px' }}>
                      👥 SUSPECTS ({inspectedStory.suspects?.length || 0}):
                    </strong>
                    <ul style={{ margin: 0, paddingLeft: '18px', fontFamily: 'monospace', fontSize: '0.82rem', color: '#444' }}>
                      {(inspectedStory.suspects || []).map((s, idx) => (
                        <li key={idx} style={{ marginBottom: '4px' }}>
                          <strong>{s.name}</strong> ({s.role}) {s.isPrimeSuspect && <span style={{ color: '#8b3a3a' }}>[Prime Suspect]</span>}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div style={{ backgroundColor: 'rgba(255,255,255,0.7)', padding: '14px', borderRadius: '4px', border: '1px solid #ddd' }}>
                    <strong style={{ fontFamily: 'monospace', color: '#2c3e50', display: 'block', marginBottom: '8px' }}>
                      🔍 EVIDENCE ITEMS ({inspectedStory.evidence?.length || 0}):
                    </strong>
                    <ul style={{ margin: 0, paddingLeft: '18px', fontFamily: 'monospace', fontSize: '0.82rem', color: '#444' }}>
                      {(inspectedStory.evidence || []).map((e, idx) => (
                        <li key={idx} style={{ marginBottom: '4px' }}>
                          <strong>{e.title}</strong> — <span style={{ color: '#8b3a3a' }}>[{e.priority}]</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Action buttons in modal */}
                <div style={{ display: 'flex', gap: '15px', justifyContent: 'flex-end', borderTop: '1px solid #ddd', paddingTop: '15px', flexWrap: 'wrap' }}>
                  <button
                    onClick={() => setInspectedStory(null)}
                    style={{
                      padding: '10px 20px',
                      backgroundColor: '#555',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '4px',
                      fontFamily: 'monospace',
                      fontWeight: 'bold',
                      cursor: 'pointer'
                    }}
                  >
                    ✕ Return to Case Board
                  </button>
                  <button
                    onClick={() => {
                      if (inspectedStory._id) {
                        handleStartGameWithStory(inspectedStory._id);
                      }
                    }}
                    className="action-button"
                    style={{
                      margin: 0,
                      padding: '10px 24px',
                      backgroundColor: '#8b3a3a',
                      fontSize: '1rem',
                      letterSpacing: '1px'
                    }}
                    disabled={loading}
                  >
                    🚨 Launch Active Playthrough With This Case ➔
                  </button>
                </div>
              </div>
            </div>
          )}
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

      {/* TAB 3: CUSTOM CASE BUILDER FORM */}
      {activeTab === 'form' && (
        <div style={{ ...styles.container, maxWidth: '1000px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px', marginBottom: '15px' }}>
            <h2 className="handwritten" style={{ fontSize: '2.5rem', color: '#2c3e50', margin: 0 }}>
              Custom Case Creation Form
            </h2>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={() => setFormData(EXAMPLE_TEMPLATE)}
                style={{ ...styles.actionBtnSecondary, backgroundColor: '#34495e' }}
              >
                ⚡ Pre-fill Example Mystery (The Velvet Alibi)
              </button>
              <button
                type="button"
                onClick={() => setFormData(BLANK_TEMPLATE)}
                style={{ ...styles.actionBtnSecondary, backgroundColor: '#7f8c8d' }}
              >
                🗑️ Clear to Blank
              </button>
            </div>
          </div>

          <p style={{ fontFamily: 'monospace', color: '#444', marginBottom: '25px', lineHeight: '1.5' }}>
            Fill out each required section below to register a fully playable mystery into MongoDB. You can freely add or remove crime scenes, forensic clues, and suspects.
          </p>

          <form onSubmit={handleFormSubmit}>
            {/* SECTION 1: CASE DISPATCH & METADATA */}
            <div style={formStyles.sectionCard}>
              <div style={formStyles.sectionTitle}>
                <span>1. Case Dispatch & Identifiers</span>
              </div>
              <div style={formStyles.row}>
                <div style={formStyles.fieldGroup}>
                  <label style={formStyles.label}>Case Title *</label>
                  <input
                    style={formStyles.input}
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="e.g., The Velvet Alibi: Murder at the Midnight Lounge"
                    required
                  />
                </div>
                <div style={formStyles.fieldGroup}>
                  <label style={formStyles.label}>Case Number *</label>
                  <input
                    style={formStyles.input}
                    value={formData.caseNumber}
                    onChange={(e) => setFormData({ ...formData, caseNumber: e.target.value })}
                    placeholder="e.g., 1952-0814-VL"
                    required
                  />
                </div>
              </div>
              <div style={formStyles.row}>
                <div style={formStyles.fieldGroup}>
                  <label style={formStyles.label}>Lead Detective</label>
                  <input
                    style={formStyles.input}
                    value={formData.leadDetective}
                    onChange={(e) => setFormData({ ...formData, leadDetective: e.target.value })}
                    placeholder="e.g., Lieutenant Jack Callahan"
                  />
                </div>
                <div style={formStyles.fieldGroup}>
                  <label style={formStyles.label}>Investigation Status</label>
                  <input
                    style={formStyles.input}
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    placeholder="e.g., Active Homicide Investigation"
                  />
                </div>
              </div>
            </div>

            {/* SECTION 2: VICTIM DOSSIER */}
            <div style={formStyles.sectionCard}>
              <div style={formStyles.sectionTitle}>
                <span>2. Victim Dossier</span>
              </div>
              <div style={formStyles.row}>
                <div style={formStyles.fieldGroup}>
                  <label style={formStyles.label}>Victim Full Name *</label>
                  <input
                    style={formStyles.input}
                    value={formData.victimName}
                    onChange={(e) => setFormData({ ...formData, victimName: e.target.value })}
                    placeholder="e.g., Vincent 'Lucky' Moretti"
                    required
                  />
                </div>
                <div style={formStyles.fieldGroup}>
                  <label style={formStyles.label}>Age *</label>
                  <input
                    type="number"
                    style={formStyles.input}
                    value={formData.victimAge}
                    onChange={(e) => setFormData({ ...formData, victimAge: e.target.value ? Number(e.target.value) : '' })}
                    placeholder="e.g., 47"
                    required
                  />
                </div>
                <div style={formStyles.fieldGroup}>
                  <label style={formStyles.label}>Occupation / Title *</label>
                  <input
                    style={formStyles.input}
                    value={formData.victimOccupation}
                    onChange={(e) => setFormData({ ...formData, victimOccupation: e.target.value })}
                    placeholder="e.g., Nightclub Owner & Bootlegger"
                    required
                  />
                </div>
              </div>
              <div style={formStyles.row}>
                <div style={formStyles.fieldGroup}>
                  <label style={formStyles.label}>Discovered Time & Place *</label>
                  <input
                    style={formStyles.input}
                    value={formData.victimDiscovered}
                    onChange={(e) => setFormData({ ...formData, victimDiscovered: e.target.value })}
                    placeholder="e.g., August 14, 1952, 2:15 AM in the VIP Backroom"
                    required
                  />
                </div>
                <div style={formStyles.fieldGroup}>
                  <label style={formStyles.label}>Cause of Death *</label>
                  <input
                    style={formStyles.input}
                    value={formData.victimCauseOfDeath}
                    onChange={(e) => setFormData({ ...formData, victimCauseOfDeath: e.target.value })}
                    placeholder="e.g., Acute potassium cyanide poisoning via rye highball"
                    required
                  />
                </div>
                <div style={formStyles.fieldGroup}>
                  <label style={formStyles.label}>Estimated Time of Death *</label>
                  <input
                    style={formStyles.input}
                    value={formData.victimTimeOfDeath}
                    onChange={(e) => setFormData({ ...formData, victimTimeOfDeath: e.target.value })}
                    placeholder="e.g., Between 1:30 AM and 2:00 AM"
                    required
                  />
                </div>
              </div>
            </div>

            {/* SECTION 3: CASE BRIEFING & OBJECTIVES */}
            <div style={formStyles.sectionCard}>
              <div style={formStyles.sectionTitle}>
                <span>3. Case Briefing & Objectives</span>
              </div>
              <div style={{ marginBottom: '14px' }}>
                <label style={formStyles.label}>Initial Briefing (Scene Overview) *</label>
                <textarea
                  style={formStyles.textarea}
                  rows={3}
                  value={formData.initialBriefing}
                  onChange={(e) => setFormData({ ...formData, initialBriefing: e.target.value })}
                  placeholder="Describe the initial discovery, setting, and atmosphere..."
                  required
                />
              </div>
              <div style={{ marginBottom: '14px' }}>
                <label style={formStyles.label}>Lead Detective's Initial Insights *</label>
                <textarea
                  style={formStyles.textarea}
                  rows={2}
                  value={formData.detectiveInsights}
                  onChange={(e) => setFormData({ ...formData, detectiveInsights: e.target.value })}
                  placeholder="Detective's internal deductions, gut feelings, and lead theories..."
                  required
                />
              </div>
              <div style={formStyles.row}>
                <div style={formStyles.fieldGroup}>
                  <label style={formStyles.label}>Completed Initial Progress (1 per line)</label>
                  <textarea
                    style={formStyles.textarea}
                    rows={3}
                    value={formData.progressText}
                    onChange={(e) => setFormData({ ...formData, progressText: e.target.value })}
                    placeholder="Secured VIP Backroom crime scene&#10;Impounded bar glasses&#10;Coroner summoned"
                  />
                </div>
                <div style={formStyles.fieldGroup}>
                  <label style={formStyles.label}>Current Active Objectives (1 per line)</label>
                  <textarea
                    style={formStyles.textarea}
                    rows={3}
                    value={formData.currentObjectivesText}
                    onChange={(e) => setFormData({ ...formData, currentObjectivesText: e.target.value })}
                    placeholder="Interrogate Delilah Moretti&#10;Determine source of poison&#10;Present alibi crack to Officer Davis"
                  />
                </div>
              </div>
            </div>

            {/* SECTION 4: INVESTIGATION LOCATIONS */}
            <div style={formStyles.sectionCard}>
              <div style={formStyles.sectionTitle}>
                <span>4. Crime Scenes & Locations ({formData.locations.length})</span>
                <button
                  type="button"
                  onClick={handleAddLocation}
                  style={{ ...formStyles.smallBtn, backgroundColor: '#2e7d32', color: '#fff' }}
                >
                  ➕ Add Location
                </button>
              </div>

              {formData.locations.map((loc, idx) => (
                <div key={idx} style={formStyles.itemCard}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <strong style={{ fontFamily: 'Georgia, serif', color: '#2c3e50', fontSize: '1.1rem' }}>
                      📍 Location #{idx + 1}: {loc.title || 'Untitled Location'}
                    </strong>
                    {formData.locations.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveLocation(idx)}
                        style={{ ...formStyles.smallBtn, backgroundColor: '#c0392b', color: '#fff' }}
                      >
                        🗑️ Delete
                      </button>
                    )}
                  </div>
                  <div style={formStyles.row}>
                    <div style={formStyles.fieldGroup}>
                      <label style={formStyles.label}>Location Title *</label>
                      <input
                        style={formStyles.input}
                        value={loc.title}
                        onChange={(e) => handleUpdateLocation(idx, 'title', e.target.value)}
                        placeholder="e.g., The VIP Backroom"
                        required
                      />
                    </div>
                    <div style={formStyles.fieldGroup}>
                      <label style={formStyles.label}>Subtitle / Address *</label>
                      <input
                        style={formStyles.input}
                        value={loc.subtitle}
                        onChange={(e) => handleUpdateLocation(idx, 'subtitle', e.target.value)}
                        placeholder="e.g., Midnight Lounge - Rear Corridor"
                        required
                      />
                    </div>
                    <div style={formStyles.fieldGroup}>
                      <label style={formStyles.label}>Unlock Stage (1-4) *</label>
                      <select
                        style={formStyles.input}
                        value={loc.unlockStage}
                        onChange={(e) => handleUpdateLocation(idx, 'unlockStage', Number(e.target.value))}
                      >
                        <option value={1}>Stage 1 (Initial Scene)</option>
                        <option value={2}>Stage 2 (Motive Web)</option>
                        <option value={3}>Stage 3 (Opportunity)</option>
                        <option value={4}>Stage 4 (Final)</option>
                      </select>
                    </div>
                  </div>
                  <div style={formStyles.row}>
                    <div style={formStyles.fieldGroup}>
                      <label style={formStyles.label}>Status</label>
                      <input
                        style={formStyles.input}
                        value={loc.status}
                        onChange={(e) => handleUpdateLocation(idx, 'status', e.target.value)}
                        placeholder="e.g., Active Crime Scene"
                      />
                    </div>
                    <div style={formStyles.fieldGroup}>
                      <label style={formStyles.label}>Witnesses Present</label>
                      <input
                        style={formStyles.input}
                        value={loc.witnesses}
                        onChange={(e) => handleUpdateLocation(idx, 'witnesses', e.target.value)}
                        placeholder="e.g., Club Doorman, Cleaning Maid"
                      />
                    </div>
                    <div style={formStyles.fieldGroup}>
                      <label style={formStyles.label}>Forensic Notes</label>
                      <input
                        style={formStyles.input}
                        value={loc.notes}
                        onChange={(e) => handleUpdateLocation(idx, 'notes', e.target.value)}
                        placeholder="e.g., Half-full rye bottle, safe cracked open"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* SECTION 5: FORENSIC EVIDENCE LOCKER */}
            <div style={formStyles.sectionCard}>
              <div style={formStyles.sectionTitle}>
                <span>5. Forensic Clues & Evidence Locker ({formData.evidence.length})</span>
                <button
                  type="button"
                  onClick={handleAddEvidence}
                  style={{ ...formStyles.smallBtn, backgroundColor: '#2e7d32', color: '#fff' }}
                >
                  ➕ Add Clue
                </button>
              </div>

              {formData.evidence.map((ev, idx) => (
                <div key={idx} style={formStyles.itemCard}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <strong style={{ fontFamily: 'Georgia, serif', color: '#2c3e50', fontSize: '1.1rem' }}>
                      🔍 Clue #{idx + 1}: {ev.title || 'Untitled Evidence'}
                    </strong>
                    {formData.evidence.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveEvidence(idx)}
                        style={{ ...formStyles.smallBtn, backgroundColor: '#c0392b', color: '#fff' }}
                      >
                        🗑️ Delete
                      </button>
                    )}
                  </div>
                  <div style={formStyles.row}>
                    <div style={formStyles.fieldGroup}>
                      <label style={formStyles.label}>Clue Title *</label>
                      <input
                        style={formStyles.input}
                        value={ev.title}
                        onChange={(e) => handleUpdateEvidence(idx, 'title', e.target.value)}
                        placeholder="e.g., Crystal Whiskey Tumbler"
                        required
                      />
                    </div>
                    <div style={formStyles.fieldGroup}>
                      <label style={formStyles.label}>Subtitle / Summary *</label>
                      <input
                        style={formStyles.input}
                        value={ev.subtitle}
                        onChange={(e) => handleUpdateEvidence(idx, 'subtitle', e.target.value)}
                        placeholder="e.g., Traces of lethal potassium cyanide"
                        required
                      />
                    </div>
                    <div style={formStyles.fieldGroup}>
                      <label style={formStyles.label}>Priority *</label>
                      <select
                        style={formStyles.input}
                        value={ev.priority}
                        onChange={(e) => handleUpdateEvidence(idx, 'priority', e.target.value)}
                      >
                        <option value="Critical">Critical</option>
                        <option value="High">High</option>
                        <option value="Medium">Medium</option>
                        <option value="Low">Low</option>
                      </select>
                    </div>
                    <div style={formStyles.fieldGroup}>
                      <label style={formStyles.label}>Unlock Stage (1-4) *</label>
                      <select
                        style={formStyles.input}
                        value={ev.unlockStage}
                        onChange={(e) => handleUpdateEvidence(idx, 'unlockStage', Number(e.target.value))}
                      >
                        <option value={1}>Stage 1 (Initial Scene)</option>
                        <option value={2}>Stage 2 (Motive Web)</option>
                        <option value={3}>Stage 3 (Opportunity)</option>
                        <option value={4}>Stage 4 (Final)</option>
                      </select>
                    </div>
                  </div>
                  <div style={formStyles.row}>
                    <div style={{ ...formStyles.fieldGroup, gridColumn: 'span 2' }}>
                      <label style={formStyles.label}>Forensic Details & Lab Analysis *</label>
                      <input
                        style={formStyles.input}
                        value={ev.details}
                        onChange={(e) => handleUpdateEvidence(idx, 'details', e.target.value)}
                        placeholder="e.g., Lab tests confirm crystalline cyanide dissolved in 18-year rye whiskey."
                        required
                      />
                    </div>
                    <div style={formStyles.fieldGroup}>
                      <label style={formStyles.label}>Found At Location</label>
                      <input
                        style={formStyles.input}
                        value={ev.location}
                        onChange={(e) => handleUpdateEvidence(idx, 'location', e.target.value)}
                        placeholder="e.g., VIP Backroom Desk"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* SECTION 6: SUSPECTS & WITNESSES */}
            <div style={formStyles.sectionCard}>
              <div style={formStyles.sectionTitle}>
                <span>6. Suspects, Persons of Interest & Witnesses ({formData.suspects.length})</span>
                <button
                  type="button"
                  onClick={handleAddSuspect}
                  style={{ ...formStyles.smallBtn, backgroundColor: '#2e7d32', color: '#fff' }}
                >
                  ➕ Add Suspect / Witness
                </button>
              </div>

              {formData.suspects.map((susp, idx) => (
                <div key={idx} style={formStyles.itemCard}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <strong style={{ fontFamily: 'Georgia, serif', color: '#2c3e50', fontSize: '1.1rem' }}>
                      👤 #{idx + 1}: {susp.name || 'Untitled Suspect'} {susp.isPrimeSuspect && <span style={{ color: '#8b3a3a', fontSize: '0.85rem' }}>(Prime Suspect)</span>}
                    </strong>
                    {formData.suspects.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveSuspect(idx)}
                        style={{ ...formStyles.smallBtn, backgroundColor: '#c0392b', color: '#fff' }}
                      >
                        🗑️ Delete
                      </button>
                    )}
                  </div>
                  <div style={formStyles.row}>
                    <div style={formStyles.fieldGroup}>
                      <label style={formStyles.label}>Full Name *</label>
                      <input
                        style={formStyles.input}
                        value={susp.name}
                        onChange={(e) => handleUpdateSuspect(idx, 'name', e.target.value)}
                        placeholder="e.g., Delilah Moretti"
                        required
                      />
                    </div>
                    <div style={formStyles.fieldGroup}>
                      <label style={formStyles.label}>Role / Occupation *</label>
                      <input
                        style={formStyles.input}
                        value={susp.role}
                        onChange={(e) => handleUpdateSuspect(idx, 'role', e.target.value)}
                        placeholder="e.g., Lead Torch Singer & Victim's Wife"
                        required
                      />
                    </div>
                    <div style={formStyles.fieldGroup}>
                      <label style={formStyles.label}>Category *</label>
                      <select
                        style={formStyles.input}
                        value={susp.category}
                        onChange={(e) => {
                          const cat = e.target.value as any;
                          handleUpdateSuspect(idx, 'category', cat);
                          handleUpdateSuspect(idx, 'isPrimeSuspect', cat === 'prime_suspect');
                        }}
                      >
                        <option value="prime_suspect">Prime Suspect (Highlighted on Case Hub)</option>
                        <option value="person_of_interest">Person of Interest</option>
                        <option value="witness">Witness / Specialist</option>
                      </select>
                    </div>
                  </div>
                  <div style={formStyles.row}>
                    <div style={{ ...formStyles.fieldGroup, gridColumn: 'span 2' }}>
                      <label style={formStyles.label}>Distinct Personality Trait *</label>
                      <input
                        style={formStyles.input}
                        value={susp.trait}
                        onChange={(e) => handleUpdateSuspect(idx, 'trait', e.target.value)}
                        placeholder="e.g., Glamorous, composed, icy under cross-examination"
                        required
                      />
                    </div>
                    <div style={formStyles.fieldGroup}>
                      <label style={formStyles.label}>Initial Trust (0-100) / Stress (0-100)</label>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <input
                          type="number"
                          style={formStyles.input}
                          value={susp.initialTrust}
                          onChange={(e) => handleUpdateSuspect(idx, 'initialTrust', Number(e.target.value))}
                          placeholder="Trust (e.g. 50)"
                          min={0}
                          max={100}
                        />
                        <input
                          type="number"
                          style={formStyles.input}
                          value={susp.initialStress}
                          onChange={(e) => handleUpdateSuspect(idx, 'initialStress', Number(e.target.value))}
                          placeholder="Stress (e.g. 20)"
                          min={0}
                          max={100}
                        />
                      </div>
                    </div>
                  </div>
                  <div style={formStyles.row}>
                    <div style={formStyles.fieldGroup}>
                      <label style={formStyles.label}>Stated Alibi *</label>
                      <textarea
                        style={formStyles.textarea}
                        rows={2}
                        value={susp.alibi}
                        onChange={(e) => handleUpdateSuspect(idx, 'alibi', e.target.value)}
                        placeholder="Their formal stated story of where they were..."
                        required
                      />
                    </div>
                    <div style={formStyles.fieldGroup}>
                      <label style={formStyles.label}>Potential Motive *</label>
                      <textarea
                        style={formStyles.textarea}
                        rows={2}
                        value={susp.motive}
                        onChange={(e) => handleUpdateSuspect(idx, 'motive', e.target.value)}
                        placeholder="Financial, personal, revenge, or 'None'..."
                        required
                      />
                    </div>
                  </div>
                  <div style={formStyles.row}>
                    <div style={formStyles.fieldGroup}>
                      <label style={formStyles.label}>Private Knowledge (Secret Truth they hide initially) *</label>
                      <textarea
                        style={formStyles.textarea}
                        rows={3}
                        value={susp.privateKnowledge}
                        onChange={(e) => handleUpdateSuspect(idx, 'privateKnowledge', e.target.value)}
                        placeholder="What they actually witnessed or did that they don't want police to know..."
                        required
                      />
                    </div>
                    <div style={formStyles.fieldGroup}>
                      <label style={formStyles.label}>Secrets to Confess under Pressure (1 per line)</label>
                      <textarea
                        style={formStyles.textarea}
                        rows={3}
                        value={susp.secrets}
                        onChange={(e) => handleUpdateSuspect(idx, 'secrets', e.target.value)}
                        placeholder="Admitted arguing backstage&#10;Confessed taking passport and cash from safe&#10;Revealed seeing rival near backroom"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* SECTION 7: 4-STAGE DEDUCTION PROGRESSION */}
            <div style={formStyles.sectionCard}>
              <div style={formStyles.sectionTitle}>
                <span>7. Four-Stage Deduction Gate Progression</span>
              </div>
              <p style={{ fontFamily: 'monospace', fontSize: '0.85rem', color: '#555', marginTop: 0 }}>
                Define what the player must realize and report to Officer Davis to advance each investigation stage.
              </p>

              {formData.stages.map((st, idx) => (
                <div key={idx} style={{ ...formStyles.itemCard, borderLeft: '4px solid #8b3a3a' }}>
                  <div style={{ marginBottom: '8px' }}>
                    <strong style={{ fontFamily: 'Georgia, serif', color: '#8b3a3a', fontSize: '1.05rem' }}>
                      Stage {st.stage}: {st.title}
                    </strong>
                  </div>
                  <div style={formStyles.row}>
                    <div style={formStyles.fieldGroup}>
                      <label style={formStyles.label}>Stage Title *</label>
                      <input
                        style={formStyles.input}
                        value={st.title}
                        onChange={(e) => handleUpdateStage(idx, 'title', e.target.value)}
                        required
                      />
                    </div>
                    <div style={formStyles.fieldGroup}>
                      <label style={formStyles.label}>Stage Objective / Description *</label>
                      <input
                        style={formStyles.input}
                        value={st.description}
                        onChange={(e) => handleUpdateStage(idx, 'description', e.target.value)}
                        required
                      />
                    </div>
                  </div>
                  <div style={{ marginBottom: '10px' }}>
                    <label style={formStyles.label}>Officer Davis Deduction Gate Rule (What the player must report) *</label>
                    <textarea
                      style={formStyles.textarea}
                      rows={2}
                      value={st.gateRules}
                      onChange={(e) => handleUpdateStage(idx, 'gateRules', e.target.value)}
                      placeholder="The player must explain that..."
                      required
                    />
                  </div>
                  <div style={formStyles.row}>
                    <div style={formStyles.fieldGroup}>
                      <label style={formStyles.label}>Evidence IDs Unlocked on Clear (comma-separated)</label>
                      <input
                        style={formStyles.input}
                        value={st.unlockEvidenceIds}
                        onChange={(e) => handleUpdateStage(idx, 'unlockEvidenceIds', e.target.value)}
                        placeholder="e.g., silver_powder_compact"
                      />
                    </div>
                    <div style={formStyles.fieldGroup}>
                      <label style={formStyles.label}>Location IDs Unlocked on Clear (comma-separated)</label>
                      <input
                        style={formStyles.input}
                        value={st.unlockLocationIds}
                        onChange={(e) => handleUpdateStage(idx, 'unlockLocationIds', e.target.value)}
                        placeholder="e.g., upper_mezzanine_office"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* SECTION 8: GROUND TRUTH & AI JUDGE SOLUTION */}
            <div style={formStyles.sectionCard}>
              <div style={formStyles.sectionTitle}>
                <span>8. Ground Truth & Solution (Evaluated by AI Judge)</span>
              </div>
              <div style={formStyles.row}>
                <div style={formStyles.fieldGroup}>
                  <label style={formStyles.label}>True Killer *</label>
                  <select
                    style={formStyles.input}
                    value={formData.killerId}
                    onChange={(e) => setFormData({ ...formData, killerId: e.target.value })}
                  >
                    {formData.suspects.map((s, idx) => (
                      <option key={idx} value={s.id || `suspect_${idx + 1}`}>
                        {s.name || `Suspect ${idx + 1}`} ({s.role})
                      </option>
                    ))}
                  </select>
                </div>
                <div style={formStyles.fieldGroup}>
                  <label style={formStyles.label}>True Motive *</label>
                  <input
                    style={formStyles.input}
                    value={formData.groundMotive}
                    onChange={(e) => setFormData({ ...formData, groundMotive: e.target.value })}
                    placeholder="e.g., divorce_and_insurance_estate"
                    required
                  />
                </div>
              </div>
              <div style={formStyles.row}>
                <div style={formStyles.fieldGroup}>
                  <label style={formStyles.label}>Murder Weapon / Method *</label>
                  <input
                    style={formStyles.input}
                    value={formData.groundWeapon}
                    onChange={(e) => setFormData({ ...formData, groundWeapon: e.target.value })}
                    placeholder="e.g., cyanide_whiskey_glass"
                    required
                  />
                </div>
                <div style={formStyles.fieldGroup}>
                  <label style={formStyles.label}>Key Contradiction (Crucial Clue that breaks their alibi) *</label>
                  <input
                    style={formStyles.input}
                    value={formData.groundKeyContradiction}
                    onChange={(e) => setFormData({ ...formData, groundKeyContradiction: e.target.value })}
                    placeholder="e.g., silver_powder_compact"
                    required
                  />
                </div>
              </div>
              <div style={{ marginBottom: '14px' }}>
                <label style={formStyles.label}>Complete Timeline Summary (Ground Truth narrative for the trial) *</label>
                <textarea
                  style={formStyles.textarea}
                  rows={4}
                  value={formData.groundTimelineSummary}
                  onChange={(e) => setFormData({ ...formData, groundTimelineSummary: e.target.value })}
                  placeholder="Detail step-by-step how the killer carried out the murder, how they acquired the weapon, and where their alibi shattered..."
                  required
                />
              </div>
            </div>

            {/* SUBMIT BUTTON */}
            <button
              type="submit"
              className="action-button"
              style={{
                width: '100%',
                padding: '18px',
                fontSize: '1.25rem',
                letterSpacing: '1px',
                marginTop: '10px'
              }}
              disabled={loading}
            >
              {loading ? 'Registering Case File into Database...' : '💾 Register & Save Case File to Database'}
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
  actionBtnSecondary: {
    padding: '8px 16px',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    fontFamily: 'monospace',
    fontSize: '0.85rem',
    fontWeight: 'bold' as const,
    cursor: 'pointer',
    boxShadow: '0 2px 4px rgba(0,0,0,0.15)'
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

const formStyles = {
  sectionCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.88)',
    border: '1px solid #b5c2a3',
    borderRadius: '6px',
    padding: '24px',
    marginBottom: '22px',
    boxShadow: '0 2px 6px rgba(0,0,0,0.08)'
  },
  sectionTitle: {
    fontSize: '1.28rem',
    fontWeight: 'bold',
    color: '#8b3a3a',
    fontFamily: 'Georgia, serif',
    marginBottom: '16px',
    borderBottom: '2px solid #dcd5c9',
    paddingBottom: '8px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  row: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: '16px',
    marginBottom: '14px'
  },
  fieldGroup: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '6px'
  },
  label: {
    fontFamily: 'monospace',
    fontSize: '0.82rem',
    fontWeight: 'bold',
    color: '#333'
  },
  input: {
    padding: '10px 12px',
    fontFamily: 'monospace',
    fontSize: '0.9rem',
    border: '1px solid #bbb',
    borderRadius: '4px',
    backgroundColor: '#fff',
    boxSizing: 'border-box' as const,
    width: '100%'
  },
  textarea: {
    padding: '10px 12px',
    fontFamily: 'monospace',
    fontSize: '0.88rem',
    border: '1px solid #bbb',
    borderRadius: '4px',
    backgroundColor: '#fff',
    boxSizing: 'border-box' as const,
    width: '100%',
    lineHeight: '1.4'
  },
  itemCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    border: '1px solid #ccd6bc',
    borderRadius: '6px',
    padding: '18px',
    marginBottom: '16px',
    boxShadow: '0 1px 4px rgba(0,0,0,0.05)'
  },
  smallBtn: {
    padding: '6px 12px',
    fontSize: '0.8rem',
    fontFamily: 'monospace',
    fontWeight: 'bold',
    cursor: 'pointer',
    border: 'none',
    borderRadius: '4px'
  }
};
