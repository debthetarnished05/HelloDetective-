import { useState, useEffect } from 'react';
import { gameApi } from '../api/client';
import { useGameStore } from '../store/gameStore';
import { useAuthStore } from '../store/authStore';
import type { IStory, MysteryArchetype } from '../types/index';
import { useNavigate } from 'react-router-dom';
import CaseSolutionsTab from '../components/CaseSolutionsTab';
import OpenCaseFolderModal from '../components/OpenCaseFolderModal';
import MobileCarousel from '../components/MobileCarousel';

export const ARCHETYPE_OPTIONS: {
  value: MysteryArchetype;
  label: string;
  icon: string;
  tagline: string;
  description: string;
  trap: string;
}[] = [
  {
    value: 'classic_procedural',
    label: '1. The Classic Procedural (Fair-Play Direct)',
    icon: '🔍',
    tagline: 'Pure deduction noir',
    description: 'The killer attempted to cover their tracks, but forensic evidence and timeline contradictions trace directly to them. Suspects hide personal secrets, but only the real culprit committed murder.',
    trap: 'Subtle forensic details: alibis check out unless cross-referenced with physical evidence.'
  },
  {
    value: 'multi_crime_convergence',
    label: '2. The Multi-Crime Convergence (Guilty of Another Crime)',
    icon: '💼',
    tagline: 'The Burglar / Embezzler Trap',
    description: 'A secondary crime (safe burglary, embezzlement, or blackmail) occurred at the same time. The thief lies, panics, and sweats, appearing guilty of murder—even though they never touched the victim.',
    trap: 'Hasty detectives arrest the burglar because they broke in and lied, letting the true poisoner/killer walk free.'
  },
  {
    value: 'deliberate_frame_job',
    label: '3. The Deliberate Frame Job (The Planted Patsy)',
    icon: '🎭',
    tagline: 'The "Too Convenient" Clue',
    description: 'The true killer deliberately planted physical evidence (badge, weapon, clothing fibers) pointing screamingly at an innocent Fall Guy (Patsy).',
    trap: 'The case against the Patsy looks airtight, but contains a physical contradiction (e.g., mismatched hand size, fabricated security timestamps).'
  },
  {
    value: 'cause_of_death_twist',
    label: '4. The Cause-of-Death Twist (The Stunner vs. The Killer)',
    icon: '🧪',
    tagline: 'The Assault Confession Trap',
    description: 'A suspect confesses to striking the victim with a blunt object and fleeing in panic. But the coroner discovers the blow was merely a stunner—the true fatal cause was lethal poison or asphyxiation!',
    trap: 'Detectives arrest the person who "confessed to the assault" without checking toxicology, while the real assassin escapes.'
  },
  {
    value: 'false_confession',
    label: '5. The False Confession / Coerced Scapegoat',
    icon: '⚖️',
    tagline: 'Coerced Under Maximum Stress',
    description: 'Under aggressive interrogation, a terrified or protective suspect breaks down and falsely admits guilt to protect family or end the pressure. Their story contradicts physical crime scene forensics.',
    trap: 'Submitting a warrant based on a coerced confession causes the AI Judge to dismiss charges and cite police misconduct.'
  },
  {
    value: 'non_linear_web',
    label: '6. The Non-Linear Web of Lies (Multi-Path Mesh)',
    icon: '🕸️',
    tagline: '3 Guilty Suspects, 1 Lethal Window',
    description: 'All 3 suspects have broken alibis, motives, and access. Uncovering leads strips away their collective lies, leaving all three looking guilty. Detective must deduce the exact lethal window.',
    trap: 'No suspect is obviously innocent by the time all leads are secured; player must pinpoint the exact 5-minute lethal window rather than relying on order of discovery.'
  }
];

export function getCleanArchetypeTitle(archetype?: string): string {
  if (!archetype) return 'Classic Procedural';
  const opt = ARCHETYPE_OPTIONS.find((a) => a.value === archetype);
  if (!opt) return archetype;
  return opt.label.replace(/^\d+\.\s*/, '').split('(')[0].trim();
}

interface FormLocation {
  id: string;
  title: string;
  subtitle: string;
  status: string;
  lastVisited: string;
  witnesses: string;
  notes: string;
  isInitiallyUnlocked: boolean;
  hiddenEvidenceIds: string;
  canvassReport: string;
  leadSourceType?: 'suspect_clue' | 'evidence_mention';
  leadSourceName?: string;
  leadSourceId?: string;
  leadSourceDescription?: string;
}

interface FormEvidence {
  id: string;
  title: string;
  subtitle: string;
  details: string;
  date: string;
  location: string;
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
  isInitiallyUnlocked: boolean;
  discoveryType?: 'initial' | 'location_canvass' | 'officer_subpoena';
  locationId: string;
  subpoenaSource?: string;
}

interface FormDynamicUnlock {
  type: 'location' | 'evidence' | 'character';
  targetId: string;
  triggerStress?: number | '';
  triggerEvidenceId?: string;
  revealDialogue?: string;
}

interface FormSuspect {
  id: string;
  name: string;
  role: string;
  trait: string;
  category: 'prime_suspect' | 'person_of_interest' | 'witness';
  personality: 'confident' | 'nervous' | 'cunning' | 'aggressive' | 'defensive';
  isPrimeSuspect: boolean;
  isInitiallyUnlocked: boolean;
  initialTrust: number;
  initialStress: number;
  alibi: string;
  motive: string;
  privateKnowledge: string;
  secrets: string;
  breakdownThreshold: number;
  leadSourceType?: 'suspect_clue' | 'evidence_mention' | 'location_mention';
  leadSourceName?: string;
  leadSourceId?: string;
  leadSourceDescription?: string;
  dynamicUnlocks: FormDynamicUnlock[];
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
  killerId: string;
  groundMotive: string;
  groundWeapon: string;
  groundKeyContradiction: string;
  groundTimelineSummary: string;
  groundArchetype: MysteryArchetype;
  groundFallGuy: string;
  groundRedHerringCrime: string;
  groundTrueFatalMechanism: string;
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
  currentObjectivesText: "Interrogate Delilah Moretti and Mickey Shores\nCanvass the VIP Backroom and Main Jazz Bar for physical evidence\nExpose who held the pharmaceutical-grade potassium cyanide\nSubmit formal indictment to the District Attorney",
  locations: [
    {
      id: 'vip_backroom',
      title: 'The VIP Backroom',
      subtitle: 'Midnight Lounge - Rear Corridor',
      status: 'Active Crime Scene',
      lastVisited: 'August 14, 2:20 AM',
      witnesses: 'Club Doorman, Cleaning Maid',
      notes: 'Mahogany desk, half-full rye whiskey bottle, cracked safe with documents missing.',
      isInitiallyUnlocked: true,
      hiddenEvidenceIds: 'cyanide_whiskey_glass, torn_roulette_voucher',
      canvassReport: 'Forensics dusted the mahogany desk and recovered a crystal tumbler coated with cyanide crystals, along with a torn gambling marker in the wastebasket.'
    },
    {
      id: 'main_jazz_bar',
      title: 'The Main Jazz Bar & Stage',
      subtitle: 'Midnight Lounge Floor',
      status: 'Location of Interest',
      lastVisited: 'Pending',
      witnesses: 'Patrons, Brass Band Members',
      notes: 'Busy bar counter where all specialty drinks and private decanters are prepped.',
      isInitiallyUnlocked: true,
      hiddenEvidenceIds: '',
      canvassReport: 'CSI swept the stage and backstage door. Floorboards show scuff marks leading directly to the private corridor.'
    },
    {
      id: 'upper_mezzanine_office',
      title: 'Upper Mezzanine Private Office',
      subtitle: 'Midnight Lounge - 2nd Floor',
      status: 'Secured Area',
      lastVisited: 'Pending',
      witnesses: 'Accountant',
      notes: 'Contains private financial ledgers, hidden cash reserves, and divorce filings.',
      isInitiallyUnlocked: false,
      hiddenEvidenceIds: 'silver_powder_compact',
      canvassReport: 'CSI forced open the office vanity mirror, discovering a hidden powder compact with traces of white crystalline cyanide residue.'
    },
    {
      id: 'pier_19_cold_storage',
      title: 'Pier 19 Cold Storage',
      subtitle: 'Waterfront Harbor District',
      status: 'Secondary Crime Scene',
      lastVisited: 'Pending',
      witnesses: 'Dockworkers',
      notes: 'Warehouse used by Salvatore Vance to store smuggled liquors and industrial solvents.',
      isInitiallyUnlocked: false,
      hiddenEvidenceIds: 'chemical_shipping_manifest',
      canvassReport: 'Officers raided the waterfront locker, seizing customs manifests showing industrial chemical shipments cleared under Vance’s signature.'
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
      isInitiallyUnlocked: true,
      locationId: 'vip_backroom'
    },
    {
      id: 'torn_roulette_voucher',
      title: 'Torn Gambling Debt Voucher',
      subtitle: 'Signed by Mickey Shores',
      details: 'A debt slip showing Mickey owed Vincent $15,000 due at midnight.',
      date: 'Aug 14, 2:30 AM',
      location: 'Wastebasket under Desk',
      priority: 'High',
      isInitiallyUnlocked: true,
      locationId: 'vip_backroom'
    },
    {
      id: 'silver_powder_compact',
      title: "Delilah's Silver Cosmetic Compact",
      subtitle: 'False compartment with poison residue',
      details: 'A vintage silver compact mirror containing fine white cyanide powder under the powder puff.',
      date: 'CSI Search',
      location: 'Upper Mezzanine Office Vanity',
      priority: 'Critical',
      isInitiallyUnlocked: false,
      locationId: 'upper_mezzanine_office'
    },
    {
      id: 'chemical_shipping_manifest',
      title: 'Smuggled Chemical Invoice',
      subtitle: 'Issued to Salvatore Vance',
      details: 'Customs papers showing industrial cyanide shipments cleared through Pier 19.',
      date: 'CSI Search',
      location: 'Pier 19 Cold Storage',
      priority: 'Medium',
      isInitiallyUnlocked: false,
      locationId: 'pier_19_cold_storage'
    }
  ],
  suspects: [
    {
      id: 'delilah_moretti',
      name: 'Delilah Moretti',
      role: "Lead Torch Singer & Victim's Wife",
      trait: 'Glamorous, composed, icy under cross-examination, protective of her future',
      category: 'prime_suspect',
      personality: 'cunning',
      isPrimeSuspect: true,
      isInitiallyUnlocked: true,
      initialTrust: 45,
      initialStress: 30,
      alibi: 'Claims she was performing her midnight set on the stage continuously from 1:15 AM to 2:00 AM without stepping off.',
      motive: 'Vincent planned to serve her with divorce papers and cut her out of the estate and club ownership.',
      privateKnowledge: 'She stepped into the VIP backroom during the 10-minute trumpet solo at 1:40 AM to spike his private rye bottle.',
      secrets: "Admitted arguing violently with Vincent backstage before the midnight set\nConfessed she took her passport and cash bundle from Vincent's safe\nRevealed she saw Mickey delivering the drink tray to Vincent's room",
      breakdownThreshold: 75,
      dynamicUnlocks: [
        {
          type: 'location',
          targetId: 'upper_mezzanine_office',
          triggerStress: 50,
          revealDialogue: "Alright! If you want to dig through our marital dirt, check Vincent's private office on the mezzanine! But leave me alone!"
        }
      ]
    },
    {
      id: 'mickey_shores',
      name: "Mickey 'Two-Times' Shores",
      role: 'Head Bartender & Floor Manager',
      trait: 'Nervous, fast-talking, wiping down the bar compulsively, sweating',
      category: 'prime_suspect',
      personality: 'nervous',
      isPrimeSuspect: true,
      isInitiallyUnlocked: true,
      initialTrust: 50,
      initialStress: 40,
      alibi: 'Claims he was behind the main bar mixing cocktails for the crowd all night.',
      motive: 'Vincent held over $15,000 in defaulted gambling markers against him and threatened violence.',
      privateKnowledge: 'Mickey poured the rye at 1:35 AM and brought it to the backroom, but claims Vincent was alive when he set it down.',
      secrets: "Admitted he poured Vincent's private rye at 1:30 AM\nConfessed Vincent threatened to have his hands broken over the gambling debt\nRevealed Salvatore handed him an unlabelled amber vial earlier that evening",
      breakdownThreshold: 70,
      dynamicUnlocks: [
        {
          type: 'character',
          targetId: 'salvatore_vance',
          triggerStress: 55,
          revealDialogue: "It was Salvatore Vance! He threatened to break my thumbs! He cornered me near the VIP room, go question him!"
        }
      ]
    },
    {
      id: 'salvatore_vance',
      name: 'Salvatore Vance',
      role: 'Rival Downtown Syndicate Boss',
      trait: 'Arrogant, cigar-smoking, dismissive of police authority',
      category: 'person_of_interest',
      personality: 'aggressive',
      isPrimeSuspect: false,
      isInitiallyUnlocked: false,
      initialTrust: 55,
      initialStress: 20,
      alibi: 'Claims he was seated in the front row booth flanked by three bodyguards all evening.',
      motive: 'Wanted to absorb the Midnight Lounge into his gambling and liquor empire.',
      privateKnowledge: 'He offered Delilah the cyanide powder days ago, knowing her desperation to get rid of Vincent.',
      secrets: "Admitted offering Vincent $50,000 to purchase the Midnight Lounge deed\nConfessed meeting Delilah in secret behind the theater two nights ago\nRevealed he stores industrial chemicals at Pier 19",
      breakdownThreshold: 80,
      dynamicUnlocks: [
        {
          type: 'location',
          targetId: 'pier_19_cold_storage',
          triggerStress: 60,
          revealDialogue: "You think I need to poison drinks with my bare hands? My operations run out of Pier 19 cold storage. Go send your lab boys there!"
        }
      ]
    }
  ],
  killerId: 'delilah_moretti',
  groundMotive: 'divorce_and_insurance_estate',
  groundWeapon: 'cyanide_whiskey_glass',
  groundKeyContradiction: 'silver_powder_compact',
  groundTimelineSummary: "Delilah Moretti obtained industrial cyanide from Salvatore Vance. During the extended trumpet solo at 1:42 AM, she slipped off stage, went into Vincent's VIP room, poisoned his rye glass, and returned to the stage to sing the finale before anyone discovered the body.",
  groundArchetype: 'classic_procedural',
  groundFallGuy: '',
  groundRedHerringCrime: '',
  groundTrueFatalMechanism: 'Acute potassium cyanide poisoning via rye highball'
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
      isInitiallyUnlocked: true,
      hiddenEvidenceIds: '',
      canvassReport: ''
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
      isInitiallyUnlocked: true,
      locationId: 'crime_scene_main'
    }
  ],
  suspects: [
    {
      id: 'suspect_1',
      name: 'Prime Suspect One',
      role: 'Business Associate / Relative',
      trait: 'Nervous, defensive',
      category: 'prime_suspect',
      personality: 'nervous',
      isPrimeSuspect: true,
      isInitiallyUnlocked: true,
      initialTrust: 50,
      initialStress: 25,
      alibi: '',
      motive: '',
      privateKnowledge: '',
      secrets: '',
      breakdownThreshold: 75,
      dynamicUnlocks: []
    }
  ],
  killerId: 'suspect_1',
  groundMotive: '',
  groundWeapon: 'evidence_clue_1',
  groundKeyContradiction: '',
  groundTimelineSummary: '',
  groundArchetype: 'classic_procedural',
  groundFallGuy: '',
  groundRedHerringCrime: '',
  groundTrueFatalMechanism: ''
};

export default function StoryCreator() {
  const [stories, setStories] = useState<IStory[]>([]);
  const [loading, setLoading] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiArchetype, setAiArchetype] = useState<string>('random');
  const [aiGenerating, setAiGenerating] = useState(false);
  const [activeTab, setActiveTab] = useState<'manage' | 'ai' | 'form' | 'solutions'>('manage');
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [inspectedStory, setInspectedStory] = useState<IStory | null>(null);

  // Form State
  const [formData, setFormData] = useState<CaseFormData>(BLANK_TEMPLATE);

  const { user, isGuest, openAuthModal } = useAuthStore();
  const { story: currentStory, setSessionData } = useGameStore();
  const navigate = useNavigate();

  const handleTabClick = (tab: 'manage' | 'ai' | 'form' | 'solutions') => {
    if (tab !== 'manage' && isGuest) {
      openAuthModal('register', 'Bureau Clearance Required: The AI Mystery Generator, Case Builder Form, and Confidential Case Solutions are reserved for registered detectives.');
      return;
    }
    setActiveTab(tab);
  };

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

  useEffect(() => {
    if (user && formData.leadDetective === 'Lead Detective') {
      setFormData(prev => ({ ...prev, leadDetective: `Detective ${user.username}` }));
    }
  }, [user]);

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
      const generated = await gameApi.generateAiStory(aiPrompt, aiArchetype);
      setMessage({ text: `Successfully generated "${generated.title}" with dynamic lead-web architecture!`, type: 'success' });
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
          isInitiallyUnlocked: false,
          hiddenEvidenceIds: '',
          canvassReport: ''
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
          isInitiallyUnlocked: false,
          locationId: prev.locations[0]?.id || ''
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
          personality: 'defensive',
          isPrimeSuspect: false,
          isInitiallyUnlocked: false,
          initialTrust: 50,
          initialStress: 20,
          alibi: 'Stated whereabouts during the time of death.',
          motive: 'Possible motive or zero motive.',
          privateKnowledge: 'Secret truth known only to this character.',
          secrets: '',
          breakdownThreshold: 75,
          dynamicUnlocks: []
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

  const handleAddDynamicUnlock = (suspectIndex: number) => {
    setFormData(prev => {
      const updated = [...prev.suspects];
      const currentUnlocks = updated[suspectIndex].dynamicUnlocks || [];
      updated[suspectIndex] = {
        ...updated[suspectIndex],
        dynamicUnlocks: [
          ...currentUnlocks,
          {
            type: 'location',
            targetId: '',
            triggerStress: 50,
            revealDialogue: ''
          }
        ]
      };
      return { ...prev, suspects: updated };
    });
  };

  const handleRemoveDynamicUnlock = (suspectIndex: number, unlockIndex: number) => {
    setFormData(prev => {
      const updated = [...prev.suspects];
      updated[suspectIndex] = {
        ...updated[suspectIndex],
        dynamicUnlocks: (updated[suspectIndex].dynamicUnlocks || []).filter((_, i) => i !== unlockIndex)
      };
      return { ...prev, suspects: updated };
    });
  };

  const handleUpdateDynamicUnlock = (
    suspectIndex: number,
    unlockIndex: number,
    field: keyof FormDynamicUnlock,
    value: any
  ) => {
    setFormData(prev => {
      const updated = [...prev.suspects];
      const unlocks = [...(updated[suspectIndex].dynamicUnlocks || [])];
      unlocks[unlockIndex] = { ...unlocks[unlockIndex], [field]: value };
      updated[suspectIndex] = { ...updated[suspectIndex], dynamicUnlocks: unlocks };
      return { ...prev, suspects: updated };
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
        id: loc.id.trim() || `loc_${idx + 1}_${loc.title.toLowerCase().replace(/[^a-z0-9]/g, '_')}`,
        isInitiallyUnlocked: Boolean(loc.isInitiallyUnlocked),
        hiddenEvidenceIds: loc.hiddenEvidenceIds
          ? loc.hiddenEvidenceIds.split(',').map(s => s.trim()).filter(Boolean)
          : [],
        canvassReport: loc.canvassReport?.trim() || `CSI completed a comprehensive forensic sweep of ${loc.title}.`,
        leadSource: !loc.isInitiallyUnlocked && loc.leadSourceType ? {
          type: loc.leadSourceType,
          sourceName: loc.leadSourceName?.trim(),
          sourceId: loc.leadSourceId?.trim(),
          description: loc.leadSourceDescription?.trim()
        } : undefined
      })),
      evidence: formData.evidence.map((ev, idx) => ({
        ...ev,
        id: ev.id.trim() || `ev_${idx + 1}_${ev.title.toLowerCase().replace(/[^a-z0-9]/g, '_')}`,
        isInitiallyUnlocked: Boolean(ev.isInitiallyUnlocked),
        discoveryType: ev.discoveryType || (ev.isInitiallyUnlocked ? 'initial' : (ev.locationId ? 'location_canvass' : 'officer_subpoena')),
        locationId: ev.locationId?.trim() || undefined,
        subpoenaSource: ev.subpoenaSource?.trim() || undefined
      })),
      suspects: formData.suspects.map((susp, idx) => ({
        ...susp,
        id: susp.id.trim() || `susp_${idx + 1}_${susp.name.toLowerCase().replace(/[^a-z0-9]/g, '_')}`,
        secrets: susp.secrets.split('\n').map(s => s.trim()).filter(Boolean),
        personality: susp.personality || 'defensive',
        isInitiallyUnlocked: Boolean(susp.isInitiallyUnlocked),
        leadSource: !susp.isInitiallyUnlocked && susp.leadSourceType ? {
          type: susp.leadSourceType,
          sourceName: susp.leadSourceName?.trim(),
          sourceId: susp.leadSourceId?.trim(),
          description: susp.leadSourceDescription?.trim()
        } : undefined,
        dynamicUnlocks: (susp.dynamicUnlocks || []).map(u => ({
          type: u.type,
          targetId: u.targetId.trim(),
          triggerEvidenceId: u.triggerEvidenceId?.trim() || undefined,
          revealDialogue: u.revealDialogue?.trim() || undefined
        }))
      })),
      archetype: formData.groundArchetype || 'classic_procedural',
      trope: ARCHETYPE_OPTIONS.find(a => a.value === formData.groundArchetype)?.tagline || '',
      groundTruth: {
        killer: formData.killerId.trim() || formData.suspects[0]?.id || 'suspect_1',
        motive: formData.groundMotive.trim() || 'Undetermined motive',
        weapon: formData.groundWeapon.trim() || formData.evidence[0]?.id || 'evidence_1',
        keyContradiction: formData.groundKeyContradiction.trim() || 'Timeline inconsistency',
        timelineSummary: formData.groundTimelineSummary.trim() || 'Timeline summary pending.',
        archetype: formData.groundArchetype || 'classic_procedural',
        fallGuy: formData.groundFallGuy?.trim() || undefined,
        redHerringCrime: formData.groundRedHerringCrime?.trim() || undefined,
        trueFatalMechanism: formData.groundTrueFatalMechanism?.trim() || undefined
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

      <div className="case-manager-tabs" style={styles.tabBar}>
        <button
          onClick={() => handleTabClick('manage')}
          className="case-manager-tab-btn"
          style={{ ...styles.tabBtn, backgroundColor: activeTab === 'manage' ? '#8b3a3a' : '#2c3e50' }}
        >
          📂 <span className="desktop-tab-text">All Saved Cases ({stories.length})</span><span className="mobile-tab-text">Saved Cases ({stories.length})</span>
        </button>
        <button
          onClick={() => handleTabClick('ai')}
          className="case-manager-tab-btn"
          style={{
            ...styles.tabBtn,
            backgroundColor: activeTab === 'ai' ? '#8b3a3a' : '#2c3e50',
            opacity: isGuest ? 0.85 : 1
          }}
          title={isGuest ? 'Restricted to Registered Detectives' : 'AI Mystery Generator'}
        >
          {isGuest ? '🔒 ' : ''}✨ <span className="desktop-tab-text">AI Mystery Generator</span><span className="mobile-tab-text">AI Generator</span>
        </button>
        <button
          onClick={() => handleTabClick('form')}
          className="case-manager-tab-btn"
          style={{
            ...styles.tabBtn,
            backgroundColor: activeTab === 'form' ? '#8b3a3a' : '#2c3e50',
            opacity: isGuest ? 0.85 : 1
          }}
          title={isGuest ? 'Restricted to Registered Detectives' : 'Case Builder Form'}
        >
          {isGuest ? '🔒 ' : ''}📝 <span className="desktop-tab-text">Case Builder Form</span><span className="mobile-tab-text">Case Builder</span>
        </button>
        <button
          onClick={() => handleTabClick('solutions')}
          className="case-manager-tab-btn"
          style={{
            ...styles.tabBtn,
            backgroundColor: activeTab === 'solutions' ? '#8b3a3a' : '#2c3e50',
            opacity: isGuest ? 0.85 : 1
          }}
          title={isGuest ? 'Restricted to Registered Detectives' : 'Confidential Case Solutions'}
        >
          {isGuest ? '🔒 ' : ''}📖 <span className="desktop-tab-text">Case Solutions & True Stories ({stories.length})</span><span className="mobile-tab-text">True Stories ({stories.length})</span>
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

      {/* TAB 1: ALL SAVED CASES */}
      {activeTab === 'manage' && (
        <div style={{
          width: '100%',
          maxWidth: '1200px',
          boxSizing: 'border-box',
          padding: '0 10px'
        }}>
          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: '35px' }}>
            <h2 className="handwritten" style={{
              fontSize: '3rem',
              color: '#f5eedc',
              margin: 0,
              letterSpacing: '2px',
              textShadow: '2px 3px 8px rgba(0,0,0,0.85)'
            }}>
              Case Files
            </h2>
          </div>

          {/* Grid of Manila Dossier Folders hanging from pins & red string / Mobile Sideways Carousel */}
          <MobileCarousel
            itemCount={stories.length}
            itemLabel="Case File"
            className="case-files-carousel-track"
          >
            {stories.map((s) => {
              const isCurrent = currentStory?._id === s._id;
              const victim = s.victimProfile;

              return (
                <div
                  key={s._id}
                  onClick={() => setInspectedStory(s)}
                  style={{
                    position: 'relative',
                    width: 'min(330px, 84vw)',
                    maxWidth: '350px',
                    margin: '0 auto',
                    minHeight: '480px',
                    backgroundColor: '#dec9b8',
                    backgroundImage: 'linear-gradient(145deg, #e5d4c3 0%, #dbcaa0 45%, #ceb7a1 100%)',
                    borderRadius: '4px 14px 4px 4px',
                    boxShadow: '0 12px 28px rgba(0,0,0,0.65), 0 2px 6px rgba(0,0,0,0.4), inset 0 0 35px rgba(110, 70, 40, 0.09)',
                    border: '1px solid #bba490',
                    padding: '28px 24px 22px 34px',
                    boxSizing: 'border-box',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    cursor: 'pointer',
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
                      {(s.archetype || s.groundTruth?.archetype) && (
                        <div style={{ marginTop: '4px', fontSize: '0.67rem', color: '#5a4638' }}>
                          <strong>ARCHETYPE:</strong> {getCleanArchetypeTitle(s.archetype || s.groundTruth?.archetype)}
                        </div>
                      )}
                      {s.trope && (
                        <div style={{ marginTop: '2px', fontSize: '0.64rem', color: '#715847' }}>
                          <strong>TROPE:</strong> {s.trope}
                        </div>
                      )}
                    </div>

                    {/* Active Investigation Stamp if Current */}
                    {isCurrent && (
                      <div style={{ textAlign: 'center', marginBottom: '8px' }}>
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
                          ★ ACTIVE CASE ★
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Clean Click Prompt at Bottom of File */}
                  <div style={{
                    textAlign: 'center',
                    marginTop: '10px',
                    borderTop: '1px dashed rgba(140, 105, 80, 0.25)',
                    paddingTop: '8px'
                  }}>
                    <span style={{
                      fontFamily: "'Courier New', monospace",
                      fontSize: '0.70rem',
                      fontWeight: 'bold',
                      color: '#715847',
                      letterSpacing: '1.5px',
                      textTransform: 'uppercase'
                    }}>
                      [ CLICK FILE TO OPEN DOSSIER ]
                    </span>
                  </div>
                </div>
              );
            })}
          </MobileCarousel>

          {/* OPEN MANILA CASE FILE FOLDER MODAL */}
          {inspectedStory && (
            <OpenCaseFolderModal
              story={inspectedStory}
              onClose={() => setInspectedStory(null)}
              onLaunch={handleStartGameWithStory}
              isLoading={loading}
            />
          )}
        </div>
      )}

      {/* RESTRICTED ACCESS CLEARANCE GATE FOR GUESTS */}
      {isGuest && activeTab !== 'manage' && (
        <div style={{
          maxWidth: '720px',
          margin: '30px auto',
          backgroundColor: '#f6f1e3',
          backgroundImage: `
            radial-gradient(circle at 50% 0%, rgba(255, 235, 180, 0.25) 0%, rgba(240, 225, 195, 0.95) 100%),
            url('https://www.transparenttextures.com/patterns/aged-paper.png')
          `,
          border: '2px solid #5d4037',
          boxShadow: '0 12px 35px rgba(0,0,0,0.5), 0 0 0 4px #d7ccc8',
          borderRadius: '6px',
          padding: '35px 30px',
          textAlign: 'center',
          fontFamily: "'Courier New', Courier, monospace"
        }}>
          <div style={{
            fontFamily: "'Special Elite', monospace",
            fontSize: '0.9rem',
            color: '#b71c1c',
            letterSpacing: '1.5px',
            border: '2px solid #b71c1c',
            display: 'inline-block',
            padding: '3px 10px',
            borderRadius: '3px',
            marginBottom: '15px'
          }}>
            RESTRICTED // HOMICIDE BUREAU CLEARANCE REQUIRED
          </div>

          <div style={{ fontSize: '3rem', margin: '8px 0' }}>🔒</div>

          <h3 style={{ fontFamily: "'Special Elite', monospace", fontSize: '1.9rem', color: '#3e2723', margin: '0 0 10px 0' }}>
            {activeTab === 'ai'
              ? 'AI Mystery Generator is Locked'
              : activeTab === 'form'
              ? 'Custom Case Builder Form is Locked'
              : 'Confidential Case Solutions are Locked'}
          </h3>

          <p style={{ color: '#5d4037', fontSize: '0.95rem', lineHeight: '1.6', maxWidth: '580px', margin: '0 auto 20px auto' }}>
            Guests can freely investigate and play all saved cases. However, AI mystery generation algorithms, custom homicide authoring, and sealed case solutions require an official Department Detective Badge.
          </p>

          <div style={{ display: 'flex', gap: '15px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button
              onClick={() => openAuthModal('register', 'Register an official badge to unlock AI Generation, Case Creation, and Case Solutions!')}
              style={{
                backgroundColor: '#8b3a3a',
                color: '#ffd54f',
                border: '2px solid #5c1818',
                padding: '12px 24px',
                borderRadius: '4px',
                fontFamily: "'Special Elite', monospace",
                fontSize: '1rem',
                cursor: 'pointer',
                fontWeight: 'bold',
                boxShadow: '0 3px 8px rgba(0,0,0,0.3)'
              }}
            >
              🎖️ Issue Official Detective Badge (Free)
            </button>
            <button
              onClick={() => openAuthModal('login')}
              style={{
                backgroundColor: '#3e2723',
                color: '#fff',
                border: '1px solid #5d4037',
                padding: '12px 20px',
                borderRadius: '4px',
                fontFamily: "'Special Elite', monospace",
                fontSize: '0.95rem',
                cursor: 'pointer'
              }}
            >
              📂 Sign In to Existing Badge
            </button>
          </div>
        </div>
      )}

      {/* TAB 2: AI MYSTERY GENERATOR */}
      {!isGuest && activeTab === 'ai' && (
        <div style={styles.container}>
          <h2 className="handwritten" style={{ fontSize: '2.5rem', color: '#2c3e50', marginBottom: '10px' }}>
            AI Dynamic Lead-Web Mystery Generator
          </h2>
          <p style={{ fontFamily: 'monospace', color: '#555', marginBottom: '25px', lineHeight: '1.6' }}>
            Harness Groq to invent a completely new, coherent dynamic lead-web murder mystery with suspects, psychological personalities, forensic crime scenes, hidden physical clues, and dynamic lead triggers.
          </p>

          <form onSubmit={handleAiGenerate} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* ARCHETYPE SELECTOR */}
            <div>
              <label style={styles.formLabel}>Mystery Archetype & Deduction Trap:</label>
              <select
                value={aiArchetype}
                onChange={(e) => setAiArchetype(e.target.value)}
                style={{
                  ...styles.textArea,
                  padding: '12px',
                  fontWeight: 'bold',
                  fontFamily: 'monospace',
                  cursor: 'pointer'
                }}
                disabled={aiGenerating}
              >
                <option value="random">🎲 Random / Detective Surprise (Recommended - Agent Picks Random Archetype)</option>
                {ARCHETYPE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.icon} {opt.label} — {opt.tagline}
                  </option>
                ))}
              </select>

              {/* Dynamic preview card of the selected archetype */}
              {(() => {
                const selected = ARCHETYPE_OPTIONS.find((a) => a.value === aiArchetype);
                if (selected) {
                  return (
                    <div style={{
                      marginTop: '12px',
                      backgroundColor: 'rgba(255, 255, 255, 0.85)',
                      borderLeft: '4px solid #8b3a3a',
                      borderRadius: '4px',
                      padding: '14px 18px',
                      fontFamily: 'monospace'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                        <span style={{ fontSize: '1.3rem' }}>{selected.icon}</span>
                        <strong style={{ color: '#2c3e50', fontSize: '1.05rem' }}>{selected.label}</strong>
                      </div>
                      <p style={{ margin: '0 0 8px 0', fontSize: '0.86rem', color: '#333', lineHeight: '1.5' }}>
                        {selected.description}
                      </p>
                      <div style={{
                        backgroundColor: '#fff4e5',
                        border: '1px solid #ffe0b2',
                        borderRadius: '3px',
                        padding: '8px 12px',
                        fontSize: '0.80rem',
                        color: '#b75800'
                      }}>
                        <strong>⚠️ The Deduction Trap:</strong> {selected.trap}
                      </div>
                    </div>
                  );
                }
                return (
                  <div style={{
                    marginTop: '12px',
                    backgroundColor: 'rgba(255, 255, 255, 0.75)',
                    borderLeft: '4px solid #34495e',
                    borderRadius: '4px',
                    padding: '12px 16px',
                    fontFamily: 'monospace',
                    fontSize: '0.84rem',
                    color: '#444'
                  }}>
                    🎲 <strong>Detective Surprise Mode:</strong> Groq will randomly pick one of the 6 archetypes (Classic Noir, Multi-Crime Convergence, Deliberate Frame Job, Cause-of-Death Twist, False Confession, or Non-Linear Web of Lies). You won't know which trap is in play until you investigate!
                  </div>
                );
              })()}
            </div>

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
      {!isGuest && activeTab === 'form' && (
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
                    <div style={{ ...formStyles.fieldGroup, display: 'flex', justifyContent: 'center' }}>
                      <label style={{ ...formStyles.label, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <input
                          type="checkbox"
                          checked={loc.isInitiallyUnlocked}
                          onChange={(e) => handleUpdateLocation(idx, 'isInitiallyUnlocked', e.target.checked)}
                        />
                        Accessible at Start (Primary Scene)
                      </label>
                      <span style={{ fontSize: '0.72rem', color: '#666', fontFamily: 'monospace' }}>
                        Checked: Open on Day 1 · Unchecked: Discovered via interrogation/leads
                      </span>
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
                  <div style={formStyles.row}>
                    <div style={formStyles.fieldGroup}>
                      <label style={formStyles.label}>Hidden Evidence IDs Uncovered via Forensic Canvass</label>
                      <input
                        style={formStyles.input}
                        value={loc.hiddenEvidenceIds}
                        onChange={(e) => handleUpdateLocation(idx, 'hiddenEvidenceIds', e.target.value)}
                        placeholder="e.g., cyanide_whiskey_glass, torn_roulette_voucher"
                      />
                    </div>
                    <div style={{ ...formStyles.fieldGroup, gridColumn: 'span 2' }}>
                      <label style={formStyles.label}>CSI Forensic Field Canvass Report *</label>
                      <input
                        style={formStyles.input}
                        value={loc.canvassReport}
                        onChange={(e) => handleUpdateLocation(idx, 'canvassReport', e.target.value)}
                        placeholder="e.g., Forensics dusted the mahogany desk and recovered a crystal tumbler coated with cyanide crystals."
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
                    <div style={{ ...formStyles.fieldGroup, display: 'flex', justifyContent: 'center' }}>
                      <label style={{ ...formStyles.label, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <input
                          type="checkbox"
                          checked={ev.isInitiallyUnlocked}
                          onChange={(e) => handleUpdateEvidence(idx, 'isInitiallyUnlocked', e.target.checked)}
                        />
                        Discovered at Scene (Initially Unlocked)
                      </label>
                      <span style={{ fontSize: '0.72rem', color: '#666', fontFamily: 'monospace' }}>
                        Checked: In locker at case start · Unchecked: Hidden until canvassed/revealed
                      </span>
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
                    <div style={formStyles.fieldGroup}>
                      <label style={formStyles.label}>Location ID Where Hidden / Found</label>
                      <input
                        style={formStyles.input}
                        value={ev.locationId}
                        onChange={(e) => handleUpdateEvidence(idx, 'locationId', e.target.value)}
                        placeholder="e.g., vip_backroom"
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
                    <div style={formStyles.fieldGroup}>
                      <label style={formStyles.label}>Personality Type *</label>
                      <select
                        style={formStyles.input}
                        value={susp.personality || 'defensive'}
                        onChange={(e) => handleUpdateSuspect(idx, 'personality', e.target.value)}
                      >
                        <option value="confident">💼 Confident (Smug, unflappable unless hit with hard evidence)</option>
                        <option value="nervous">😰 Nervous (Fidgety, sweats, breaks quickly under pressure)</option>
                        <option value="cunning">🦊 Cunning (Evasive, redirects blame, subtle slip-ups)</option>
                        <option value="aggressive">⚡ Aggressive (Hostile, confrontational, lashes out)</option>
                        <option value="defensive">🛡️ Defensive (Guarded, stonewalls until cornered)</option>
                      </select>
                    </div>
                    <div style={{ ...formStyles.fieldGroup, display: 'flex', justifyContent: 'center' }}>
                      <label style={{ ...formStyles.label, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <input
                          type="checkbox"
                          checked={susp.isInitiallyUnlocked}
                          onChange={(e) => handleUpdateSuspect(idx, 'isInitiallyUnlocked', e.target.checked)}
                        />
                        Initially Identified (Available at Start)
                      </label>
                      <span style={{ fontSize: '0.72rem', color: '#666', fontFamily: 'monospace' }}>
                        Checked: On board Day 1 · Unchecked: Undisclosed lead unlocked dynamically
                      </span>
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

                  {/* DYNAMIC LEAD UNLOCKS SUB-SECTION */}
                  <div style={{
                    marginTop: '16px',
                    padding: '14px',
                    backgroundColor: 'rgba(0,0,0,0.03)',
                    border: '1px dashed #a5b4fc',
                    borderRadius: '6px'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                      <div>
                        <strong style={{ fontFamily: 'monospace', color: '#3730a3', fontSize: '0.9rem' }}>
                          ⚡ Dynamic Lead Unlocks ({(susp.dynamicUnlocks || []).length})
                        </strong>
                        <span style={{ display: 'block', fontSize: '0.75rem', color: '#666', fontFamily: 'monospace' }}>
                          What new scene, physical clue, or person does this suspect blurt out when pressured or shown evidence?
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleAddDynamicUnlock(idx)}
                        style={{ ...formStyles.smallBtn, backgroundColor: '#4338ca', color: '#fff' }}
                      >
                        ➕ Add Unlock Rule
                      </button>
                    </div>

                    {(susp.dynamicUnlocks || []).map((unlock, uIdx) => (
                      <div key={uIdx} style={{
                        backgroundColor: '#fff',
                        border: '1px solid #c7d2fe',
                        borderRadius: '4px',
                        padding: '12px',
                        marginBottom: '10px'
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                          <span style={{ fontFamily: 'monospace', fontSize: '0.82rem', fontWeight: 'bold', color: '#312e81' }}>
                            Lead Unlock #{uIdx + 1}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleRemoveDynamicUnlock(idx, uIdx)}
                            style={{ ...formStyles.smallBtn, backgroundColor: '#ef4444', color: '#fff', padding: '2px 8px', fontSize: '0.75rem' }}
                          >
                            ✕ Remove
                          </button>
                        </div>
                        <div style={formStyles.row}>
                          <div style={formStyles.fieldGroup}>
                            <label style={formStyles.label}>Unlock Type *</label>
                            <select
                              style={formStyles.input}
                              value={unlock.type}
                              onChange={(e) => handleUpdateDynamicUnlock(idx, uIdx, 'type', e.target.value)}
                            >
                              <option value="location">📍 New Location</option>
                              <option value="evidence">🔍 New Forensic Evidence</option>
                              <option value="character">👤 New Person of Interest</option>
                            </select>
                          </div>
                          <div style={formStyles.fieldGroup}>
                            <label style={formStyles.label}>Target Slug / ID to Unlock *</label>
                            <input
                              style={formStyles.input}
                              value={unlock.targetId}
                              onChange={(e) => handleUpdateDynamicUnlock(idx, uIdx, 'targetId', e.target.value)}
                              placeholder="e.g., pier_19_cold_storage or salvatore_vance"
                              required
                            />
                          </div>
                          <div style={formStyles.fieldGroup}>
                            <label style={formStyles.label}>Trigger Stress Threshold (%)</label>
                            <input
                              type="number"
                              style={formStyles.input}
                              value={unlock.triggerStress}
                              onChange={(e) => handleUpdateDynamicUnlock(idx, uIdx, 'triggerStress', e.target.value === '' ? '' : Number(e.target.value))}
                              placeholder="e.g., 55 (triggers when stress >= 55)"
                              min={0}
                              max={100}
                            />
                          </div>
                          <div style={formStyles.fieldGroup}>
                            <label style={formStyles.label}>OR Trigger Evidence ID</label>
                            <input
                              style={formStyles.input}
                              value={unlock.triggerEvidenceId || ''}
                              onChange={(e) => handleUpdateDynamicUnlock(idx, uIdx, 'triggerEvidenceId', e.target.value)}
                              placeholder="e.g., silver_powder_compact"
                            />
                          </div>
                        </div>
                        <div style={{ marginTop: '8px' }}>
                          <label style={formStyles.label}>Spoken Reveal Dialogue (What suspect blurts out) *</label>
                          <input
                            style={formStyles.input}
                            value={unlock.revealDialogue || ''}
                            onChange={(e) => handleUpdateDynamicUnlock(idx, uIdx, 'revealDialogue', e.target.value)}
                            placeholder="e.g., 'Alright! If you want the truth, go check Pier 19 cold storage! Salvatore runs his chemicals out of there!'"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* SECTION 7: DYNAMIC LEAD-WEB ARCHITECTURE OVERVIEW */}
            <div style={formStyles.sectionCard}>
              <div style={formStyles.sectionTitle}>
                <span>7. Dynamic Lead-Web & Forensic Investigation Architecture</span>
              </div>
              <div style={{
                backgroundColor: 'rgba(255, 255, 255, 0.75)',
                borderLeft: '4px solid #10b981',
                borderRadius: '4px',
                padding: '16px 20px',
                fontFamily: 'monospace'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <span style={{ fontSize: '1.4rem' }}>🕸️</span>
                  <strong style={{ color: '#065f46', fontSize: '1.05rem' }}>
                    Non-Linear Dynamic Lead-Web Architecture Active
                  </strong>
                </div>
                <p style={{ margin: '0 0 10px 0', fontSize: '0.88rem', color: '#1f2937', lineHeight: '1.6' }}>
                  This case uses an organic, non-linear investigation system rather than rigid artificial stages.
                  As lead detective, players uncover leads through two organic actions:
                </p>
                <ul style={{ margin: '0 0 12px 0', paddingLeft: '20px', fontSize: '0.84rem', color: '#374151', lineHeight: '1.6' }}>
                  <li>
                    <strong>Forensic Canvassing:</strong> Sweeping crime scenes dispatches CSI units to unlock hidden physical evidence and generate forensic reports.
                  </li>
                  <li>
                    <strong>Psychological Interrogation:</strong> Pressing suspects past their stress breakdown thresholds or presenting incriminating evidence triggers dynamic blurts that reveal new locations, clues, or undisclosed associates.
                  </li>
                  <li>
                    <strong>DA Closing Window:</strong> When all crime scenes have been canvassed and all physical evidence uncovered, Officer Davis alerts the player that the case is closing. The player is granted a limited interrogation window (12 questions) to finalize their deductions before submitting the Arrest Warrant.
                  </li>
                </ul>
                <div style={{
                  backgroundColor: '#ecfdf5',
                  border: '1px solid #a7f3d0',
                  borderRadius: '4px',
                  padding: '10px 14px',
                  fontSize: '0.80rem',
                  color: '#047857'
                }}>
                  ✨ <strong>Case Lead Inventory:</strong> {formData.locations.length} Locations ({formData.locations.filter(l => l.isInitiallyUnlocked).length} Initial) · {formData.evidence.length} Forensic Clues ({formData.evidence.filter(e => e.isInitiallyUnlocked).length} Initial) · {formData.suspects.length} Characters ({formData.suspects.filter(s => s.isInitiallyUnlocked).length} Initial)
                </div>
              </div>
            </div>

            {/* SECTION 8: GROUND TRUTH & AI JUDGE SOLUTION */}
            <div style={formStyles.sectionCard}>
              <div style={formStyles.sectionTitle}>
                <span>8. Ground Truth & AI Judge Solution Architecture</span>
              </div>
              <p style={{ fontFamily: 'monospace', fontSize: '0.85rem', color: '#555', marginTop: 0 }}>
                Configure the case architecture and the forensic ground truth evaluated by the AI Judge in the courtroom trial.
              </p>

              {/* ARCHETYPE SELECTOR */}
              <div style={{ marginBottom: '16px' }}>
                <label style={formStyles.label}>Mystery Archetype & Case Architecture *</label>
                <select
                  style={{ ...formStyles.input, fontWeight: 'bold' }}
                  value={formData.groundArchetype}
                  onChange={(e) => setFormData({ ...formData, groundArchetype: e.target.value as MysteryArchetype })}
                >
                  {ARCHETYPE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.icon} {opt.label}
                    </option>
                  ))}
                </select>

                {/* Archetype Description Box */}
                {(() => {
                  const arch = ARCHETYPE_OPTIONS.find((a) => a.value === formData.groundArchetype);
                  if (!arch) return null;
                  return (
                    <div style={{
                      marginTop: '10px',
                      backgroundColor: 'rgba(255, 255, 255, 0.9)',
                      borderLeft: '4px solid #8b3a3a',
                      borderRadius: '4px',
                      padding: '12px 16px',
                      fontFamily: 'monospace',
                      fontSize: '0.83rem'
                    }}>
                      <div style={{ fontWeight: 'bold', color: '#2c3e50', marginBottom: '4px' }}>
                        {arch.icon} {arch.label} ({arch.tagline})
                      </div>
                      <div style={{ color: '#444', marginBottom: '6px' }}>
                        {arch.description}
                      </div>
                      <div style={{ color: '#b75800', fontWeight: 'bold' }}>
                        ⚠️ The Trap: {arch.trap}
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* CONDITIONAL ARCHETYPE FIELDS */}
              {formData.groundArchetype === 'multi_crime_convergence' && (
                <div style={{
                  backgroundColor: '#f5efe6',
                  border: '1px solid #d4c5b3',
                  borderRadius: '4px',
                  padding: '14px',
                  marginBottom: '16px'
                }}>
                  <strong style={{ display: 'block', color: '#8b3a3a', fontFamily: 'monospace', fontSize: '0.9rem', marginBottom: '10px' }}>
                    💼 Multi-Crime Setup (The "Guilty But Innocent" Suspect)
                  </strong>
                  <div style={formStyles.row}>
                    <div style={formStyles.fieldGroup}>
                      <label style={formStyles.label}>Secondary Offender / Burglar (Fall Guy) *</label>
                      <select
                        style={formStyles.input}
                        value={formData.groundFallGuy}
                        onChange={(e) => setFormData({ ...formData, groundFallGuy: e.target.value })}
                      >
                        <option value="">-- Select Suspect --</option>
                        {formData.suspects.map((s, idx) => (
                          <option key={idx} value={s.id || `suspect_${idx + 1}`}>
                            {s.name || `Suspect ${idx + 1}`} ({s.role})
                          </option>
                        ))}
                      </select>
                    </div>
                    <div style={formStyles.fieldGroup}>
                      <label style={formStyles.label}>Secondary Crime Description *</label>
                      <input
                        style={formStyles.input}
                        value={formData.groundRedHerringCrime}
                        onChange={(e) => setFormData({ ...formData, groundRedHerringCrime: e.target.value })}
                        placeholder="e.g., Safe Burglary at 9:45 PM / Embezzlement"
                      />
                    </div>
                  </div>
                </div>
              )}

              {formData.groundArchetype === 'deliberate_frame_job' && (
                <div style={{
                  backgroundColor: '#f5efe6',
                  border: '1px solid #d4c5b3',
                  borderRadius: '4px',
                  padding: '14px',
                  marginBottom: '16px'
                }}>
                  <strong style={{ display: 'block', color: '#8b3a3a', fontFamily: 'monospace', fontSize: '0.9rem', marginBottom: '10px' }}>
                    🎭 Deliberate Frame-Up Setup (The Planted Patsy)
                  </strong>
                  <div style={formStyles.fieldGroup}>
                    <label style={formStyles.label}>Framed Fall Guy (Patsy) *</label>
                    <select
                      style={formStyles.input}
                      value={formData.groundFallGuy}
                      onChange={(e) => setFormData({ ...formData, groundFallGuy: e.target.value })}
                    >
                      <option value="">-- Select Framed Suspect --</option>
                      {formData.suspects.map((s, idx) => (
                        <option key={idx} value={s.id || `suspect_${idx + 1}`}>
                          {s.name || `Suspect ${idx + 1}`} ({s.role})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {formData.groundArchetype === 'cause_of_death_twist' && (
                <div style={{
                  backgroundColor: '#f5efe6',
                  border: '1px solid #d4c5b3',
                  borderRadius: '4px',
                  padding: '14px',
                  marginBottom: '16px'
                }}>
                  <strong style={{ display: 'block', color: '#8b3a3a', fontFamily: 'monospace', fontSize: '0.9rem', marginBottom: '10px' }}>
                    🧪 Cause-of-Death Twist (The Stunner vs. The Killer)
                  </strong>
                  <div style={formStyles.row}>
                    <div style={formStyles.fieldGroup}>
                      <label style={formStyles.label}>Suspect Who Struck Victim (The Stunner) *</label>
                      <select
                        style={formStyles.input}
                        value={formData.groundFallGuy}
                        onChange={(e) => setFormData({ ...formData, groundFallGuy: e.target.value })}
                      >
                        <option value="">-- Select Assailant Suspect --</option>
                        {formData.suspects.map((s, idx) => (
                          <option key={idx} value={s.id || `suspect_${idx + 1}`}>
                            {s.name || `Suspect ${idx + 1}`} ({s.role})
                          </option>
                        ))}
                      </select>
                    </div>
                    <div style={formStyles.fieldGroup}>
                      <label style={formStyles.label}>True Fatal Mechanism (Coroner / Toxicology) *</label>
                      <input
                        style={formStyles.input}
                        value={formData.groundTrueFatalMechanism}
                        onChange={(e) => setFormData({ ...formData, groundTrueFatalMechanism: e.target.value })}
                        placeholder="e.g., Acute Cyanide Poisoning in tea 20 mins prior"
                      />
                    </div>
                  </div>
                </div>
              )}

              {formData.groundArchetype === 'false_confession' && (
                <div style={{
                  backgroundColor: '#f5efe6',
                  border: '1px solid #d4c5b3',
                  borderRadius: '4px',
                  padding: '14px',
                  marginBottom: '16px'
                }}>
                  <strong style={{ display: 'block', color: '#8b3a3a', fontFamily: 'monospace', fontSize: '0.9rem', marginBottom: '10px' }}>
                    ⚖️ False Confession Setup (The Coerced Scapegoat)
                  </strong>
                  <div style={formStyles.fieldGroup}>
                    <label style={formStyles.label}>Suspect Who Breaks Down Into False Confession *</label>
                    <select
                      style={formStyles.input}
                      value={formData.groundFallGuy}
                      onChange={(e) => setFormData({ ...formData, groundFallGuy: e.target.value })}
                    >
                      <option value="">-- Select Scapegoat Suspect --</option>
                      {formData.suspects.map((s, idx) => (
                        <option key={idx} value={s.id || `suspect_${idx + 1}`}>
                          {s.name || `Suspect ${idx + 1}`} ({s.role})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {/* CORE SOLUTION FIELDS */}
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

      {/* TAB 4: CASE SOLUTIONS & TRUE STORIES */}
      {!isGuest && activeTab === 'solutions' && (
        <CaseSolutionsTab stories={stories} />
      )}
    </div>
  );
}

const styles = {
  tabBar: {
    display: 'flex',
    gap: '10px',
    marginBottom: '20px',
    flexWrap: 'wrap' as const,
    justifyContent: 'center'
  },
  tabBtn: {
    padding: '10px 18px',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    fontFamily: 'monospace',
    fontSize: '0.9rem',
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
    padding: 'clamp(18px, 4vw, 35px)',
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
    gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 200px), 1fr))',
    gap: '14px',
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
