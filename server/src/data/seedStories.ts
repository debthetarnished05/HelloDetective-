import { IStory } from '../types/index';

// ============================================================================
// CASE 2: The Gilded Aria (Deliberate Frame Job)
// Trope: The Planted Patsy & "Too Convenient" Clue
// ============================================================================
export const OPERA_STORY: IStory = {
  title: 'The Gilded Aria: Poison at the Blackwood Opera',
  caseNumber: '1934-1024-VV',
  leadDetective: 'Inspector Silas Thorne',
  status: 'Active Homicide Investigation',
  archetype: 'deliberate_frame_job',
  trope: 'The Planted Patsy & "Too Convenient" Clue',
  victimProfile: {
    name: 'Madame Vivienne Vance',
    age: 38,
    occupation: 'Prima Donna Soprano, Blackwood Grand Opera',
    discovered: 'October 24, 1934, 10:05 PM in Star Dressing Room #1',
    causeOfDeath: 'Acute lethal ingestion of pharmaceutical-grade belladonna (deadly nightshade alkaloid)',
    timeOfDeath: 'Between 9:35 PM and 9:55 PM, during the Act II intermission'
  },
  briefing: {
    initialBriefing: 'Madame Vivienne Vance collapsed inside her star dressing room minutes before her final curtain call in Tosca. A cut-crystal voice atomizer was found shattered on the Persian rug, heavily laced with concentrated belladonna. A monogrammed lace handkerchief belonging to her ambitious understudy Camille Dupré was conspicuously left beside the vanity, and an apothecary receipt in Camille\'s name was discovered in the wastebasket.',
    detectiveInsights: 'Everything points screamingly at Camille Dupré—almost too cleanly. Behind the gilded proscenium, theater impresario Julian Blackwood faces imminent bankruptcy, while theater physician Dr. Pendelton has been trembling and guarding his private dispensary. A careful detective must question whether the incriminating trail was deliberately manufactured.'
  },
  objectives: {
    progress: [
      'Secured Star Dressing Room #1 and summoned the Scotland Yard coroner',
      'Impounded the shattered crystal atomizer and stage door entry ledger',
      'Isolated Julian Blackwood and Camille Dupré for interrogation'
    ],
    currentObjectives: [
      'Interrogate Julian Blackwood and Camille Dupré regarding the dressing room clues',
      'Canvass the Opera Green Room and Private Dispensary for forensic traces',
      'Cross-examine the apothecary receipt timeline with the rehearsal call-sheet',
      'Consult Officer Davis to verify whether Camille was deliberately framed'
    ]
  },
  locations: [
    {
      id: 'star_dressing_room',
      title: 'Star Dressing Room #1',
      subtitle: 'Blackwood Grand Opera - Backstage Hallway',
      status: 'Primary Crime Scene',
      lastVisited: 'October 24, 1934',
      witnesses: 'Wardrobe Mistress Eleanor Vance, Call Boy Tommy',
      notes: 'Lavish vanity room with gilded mirrors and silk drapes. Shattered crystal perfume atomizer rests near the velvet settee.',
      isInitiallyUnlocked: true,
      hiddenEvidenceIds: ['shattered_atomizer', 'monogrammed_handkerchief'],
      canvassReport: 'Forensic sweep recovered the shattered cut-crystal atomizer reeking of bitter almond, along with a monogrammed lace handkerchief smelling faintly of Turkish tobacco and lavender oil.'
    },
    {
      id: 'the_green_room',
      title: 'The Green Room & Musicians\' Salon',
      subtitle: 'Sub-Stage Lounge - Drury Lane Level',
      status: 'Witness Gathering Area',
      lastVisited: 'October 25, 1934',
      witnesses: 'Conductor Maestro Bellini, Understudy Camille Dupré',
      notes: 'Dimly lit performers salon where tea and spirits were served during intermission. Stage door call-board hangs beside the piano.',
      isInitiallyUnlocked: true,
      hiddenEvidenceIds: ['dress_rehearsal_callsheet', 'opera_tea_service'],
      canvassReport: 'Detectives seized the official Stage Master call-sheet signed by Maestro Bellini, confirming Camille was on stage in front of 400 patrons during the exact timestamp of the apothecary purchase.'
    },
    {
      id: 'blackwood_dispensary',
      title: 'Company Medical Dispensary',
      subtitle: 'Mezzanine Level - Office #4',
      status: 'Search Warrant Executed',
      lastVisited: 'Pending Detective Sweep',
      witnesses: 'Dr. Arthur Pendelton',
      notes: 'Locked medical repository with glass ampoules and tinctures. A private service dumbwaiter shaft leads directly down into the star dressing room corridor.',
      isInitiallyUnlocked: false,
      hiddenEvidenceIds: ['dispensary_logbook', 'poison_vial_dumbwaiter'],
      canvassReport: 'Forensic investigators opened the locked narcotics cabinet and recovered the dispensary stock ledger with page 44 excised, along with an amber vial bearing Julian Blackwood\'s signet wax seal.'
    },
    {
      id: 'blackwood_private_office',
      title: 'Julian Blackwood\'s Executive Suite',
      subtitle: 'Royal Box Corridor - Upper Gallery',
      status: 'Restricted Office',
      lastVisited: 'Pending Detective Sweep',
      witnesses: 'Julian Blackwood',
      notes: 'Opulent wood-paneled office with a locked brass desk safe. Odor of expensive Turkish cigars and lavender cologne.',
      isInitiallyUnlocked: false,
      hiddenEvidenceIds: ['embezzled_pension_audit', 'blackwood_bank_demand'],
      canvassReport: 'CSI cracked the mahogany roll-top desk and recovered bank foreclosure notices totaling £15,000, and a confidential audit prepared by Vivienne Vance threatening Scotland Yard prosecution.'
    }
  ],
  evidence: [
    {
      id: 'shattered_atomizer',
      title: 'Shattered Crystal Voice Atomizer',
      subtitle: 'Victim\'s Personal Throat Spray',
      details: 'French cut-crystal spray flask engraved "V.V.". Chemical reagents test positive for lethal concentrated belladonna alkaloid. Inhaling the mist caused acute laryngeal edema and respiratory paralysis.',
      date: 'October 24, 1934',
      location: 'Star Dressing Room Floor',
      priority: 'Critical',
      isInitiallyUnlocked: true,
      locationId: 'star_dressing_room'
    },
    {
      id: 'monogrammed_handkerchief',
      title: 'Monogrammed Lace Handkerchief ("C.D.")',
      subtitle: 'Planted Clue Bearing Understudy Monogram',
      details: 'Fine silk handkerchief embroidered with the initials "C.D." belonging to Camille Dupré. However, forensic analysis notes it is perfumed with Spanish lavender oil and Turkish tobacco smoke—Julian Blackwood\'s exclusive personal blend.',
      date: 'October 24, 1934',
      location: 'Found on floor beside dressing room vanity',
      priority: 'High',
      isInitiallyUnlocked: false,
      locationId: 'star_dressing_room'
    },
    {
      id: 'dress_rehearsal_callsheet',
      title: 'Maestro Bellini\'s Rehearsal Call-Sheet',
      subtitle: 'Key Timeline Contradiction Document',
      details: 'Official production register proving Camille Dupré was on stage rehearsing Act I under Maestro Bellini\'s direct baton from 2:00 PM to 4:30 PM on October 20—the exact afternoon the belladonna was purchased across town in her name.',
      date: 'October 24, 1934',
      location: 'The Green Room Call-Board',
      priority: 'Critical',
      isInitiallyUnlocked: false,
      locationId: 'the_green_room'
    },
    {
      id: 'dispensary_logbook',
      title: 'Excised Pharmaceutical Inventory Log',
      subtitle: 'Company Dispensary Record',
      details: 'Logbook showing that 100ml of concentrated belladonna extract was requisitioned on October 22 under emergency theatrical authorization. The authorization slip was signed with Julian Blackwood\'s corporate seal.',
      date: 'October 25, 1934',
      location: 'Company Medical Dispensary',
      priority: 'High',
      isInitiallyUnlocked: false,
      locationId: 'blackwood_dispensary'
    },
    {
      id: 'poison_vial_dumbwaiter',
      title: 'Signet-Wax Amber Poison Vial',
      subtitle: 'Direct Opportunity & Delivery Weapon',
      details: 'Small brown glass apothecary vial recovered from the bottom of the backstage dumbwaiter shaft. Traces of belladonna residue match the atomizer. The cork stopper retains an imprint of Julian Blackwood\'s gold signet crest.',
      date: 'October 25, 1934',
      location: 'Base of Service Dumbwaiter',
      priority: 'Critical',
      isInitiallyUnlocked: false,
      locationId: 'blackwood_dispensary'
    },
    {
      id: 'embezzled_pension_audit',
      title: 'Vivienne\'s Handwritten Embezzlement Audit',
      subtitle: 'The Incontrovertible Financial Motive',
      details: 'Detailed accounting sheets compiled by Vivienne Vance proving Julian Blackwood siphoned £15,000 from the company pension fund to cover gambling losses at the Carlton Club. Dated October 23 with a note: "To Inspector Thorne if not repaid by curtain call."',
      date: 'October 25, 1934',
      location: 'Blackwood Executive Desk Safe',
      priority: 'Critical',
      isInitiallyUnlocked: false,
      locationId: 'blackwood_private_office'
    }
  ],
  suspects: [
    {
      id: 'julian_blackwood',
      name: 'Julian Blackwood',
      role: 'Theater Impresario & Owner',
      trait: 'Arrogant aristocrat who reeks of lavender pomade and Turkish tobacco.',
      personality: 'cunning',
      isInitiallyUnlocked: true,
      category: 'prime_suspect',
      isPrimeSuspect: true,
      initialTrust: 40,
      initialStress: 25,
      alibi: 'Claims he was entertaining civic patrons in Royal Box A throughout the entire second act and never stepped foot backstage.',
      motive: 'Vivienne discovered he embezzled £15,000 from the company fund and had drafted a complaint for Scotland Yard.',
      privateKnowledge: 'Knows he planted Camille\'s handkerchief and forged her name on the pharmacy slip to frame her.',
      secrets: [
        'He is completely broke and faces criminal bankruptcy if the audit reaches the magistrate.',
        'He obtained the belladonna by blackmailing Dr. Pendelton over his revoked medical license.',
        'He used the service dumbwaiter from the mezzanine to bypass stage door guards.'
      ],
      breakdownThreshold: 80,
      dynamicUnlocks: [
        {
          type: 'location',
          targetId: 'blackwood_private_office',
          triggerStress: 60,
          revealDialogue: "You want to talk about finances? Fine, search my office! You won't find anything but legitimate production ledger books!"
        },
        {
          type: 'character',
          targetId: 'dr_pendelton',
          triggerStress: 75,
          revealDialogue: "If you're looking for pharmaceutical poisons, speak to Dr. Pendelton! The man runs the mezzanine dispensary, not me!"
        }
      ]
    },
    {
      id: 'camille_dupre',
      name: 'Camille Dupré',
      role: 'Understudy Soprano (Framed Patsy)',
      trait: 'Pale, nervous, and terrified of being sent to the gallows for a crime she did not commit.',
      personality: 'nervous',
      isInitiallyUnlocked: true,
      category: 'prime_suspect',
      isPrimeSuspect: true,
      initialTrust: 65,
      initialStress: 60,
      alibi: 'Was in the Green Room and chorus rehearsal hall warming up her scales with Maestro Bellini.',
      motive: 'Stood to inherit the lead role of Tosca upon Vivienne\'s sudden demise.',
      privateKnowledge: 'Lost her monogrammed handkerchief two days ago after leaving it in Blackwood\'s office.',
      secrets: [
        'Admitted she resented Vivienne\'s cruel insults during vocal coaching.',
        'Her monogrammed handkerchief was stolen from her dressing basket Tuesday evening.',
        'She has never purchased belladonna and was on stage during the alleged purchase.'
      ],
      breakdownThreshold: 85,
      dynamicUnlocks: [
        {
          type: 'evidence',
          targetId: 'dress_rehearsal_callsheet',
          triggerStress: 65,
          revealDialogue: "Check Maestro Bellini's call-sheet! I was on stage singing the duet when that apothecary slip was supposedly signed! I was never in the East End!"
        },
        {
          type: 'location',
          targetId: 'blackwood_dispensary',
          triggerStress: 75,
          revealDialogue: "Mr. Blackwood has keys to the private dispensary on the mezzanine! I saw him slipping up the service stairs during intermission!"
        }
      ]
    },
    {
      id: 'dr_pendelton',
      name: 'Dr. Arthur Pendelton',
      role: 'Theater Resident Physician',
      trait: 'Sweating, defensive doctor with trembling hands and stained tweed lapels.',
      personality: 'defensive',
      isInitiallyUnlocked: false,
      category: 'person_of_interest',
      isPrimeSuspect: false,
      initialTrust: 45,
      initialStress: 50,
      alibi: 'Was tending to a stagehand who sprained an ankle in the prop workshop.',
      motive: 'Was being blackmailed by Vivienne over prescribing illegal morphine to society patrons.',
      privateKnowledge: 'Admits Julian Blackwood coerced him into surrendering concentrated belladonna extract.',
      secrets: [
        'Practicing medicine without an active license after an incident in Edinburgh.',
        'Julian Blackwood threatened to report his drug prescriptions unless he provided the belladonna.',
        'Saw Blackwood carry an amber glass vial toward the dumbwaiter shaft.'
      ],
      breakdownThreshold: 75,
      dynamicUnlocks: [
        {
          type: 'evidence',
          targetId: 'poison_vial_dumbwaiter',
          triggerStress: 70,
          revealDialogue: "God forgive me! Blackwood took the belladonna! He told me he needed it for rat extermination in the boiler rooms, then dropped the empty vial down the dumbwaiter!"
        }
      ]
    },
    {
      id: 'maestro_bellini',
      name: 'Maestro Marco Bellini',
      role: 'Principal Opera Conductor',
      trait: 'Stern Italian maestro obsessed with precision, timing, and musical discipline.',
      personality: 'confident',
      isInitiallyUnlocked: false,
      category: 'witness',
      isPrimeSuspect: false,
      initialTrust: 70,
      initialStress: 20,
      alibi: 'Conducting orchestra rehearsals and checking score manuscripts in the pit.',
      motive: 'None. Adored Vivienne\'s voice as a masterpiece of European opera.',
      privateKnowledge: 'Can vouch with absolute musical certainty for Camille Dupré\'s exact whereabouts.',
      secrets: [
        'Heard loud shouting between Vivienne and Blackwood regarding "the police and stolen funds" two nights ago.',
        'Saw Julian Blackwood leave Royal Box A at 9:35 PM during the second act.'
      ],
      breakdownThreshold: 80,
      dynamicUnlocks: [
        {
          type: 'evidence',
          targetId: 'embezzled_pension_audit',
          triggerStress: 60,
          revealDialogue: "Vivienne told me she had cornered Blackwood. She kept her audit locked in his desk safe after threatening to hand it to Scotland Yard!"
        }
      ]
    }
  ],
  groundTruth: {
    killer: 'julian_blackwood',
    motive: 'embezzled_pension_audit',
    weapon: 'poison_vial_dumbwaiter',
    keyContradiction: 'dress_rehearsal_callsheet',
    timelineSummary: 'Julian Blackwood embezzled £15,000 from the actors pension fund. When Vivienne Vance threatened him with her audit, he blackmailed Dr. Pendelton for concentrated belladonna, planted Camille Dupré\'s stolen lace handkerchief and a forged receipt, slipped from Royal Box A at 9:35 PM, dosed Vivienne\'s vocal atomizer, dumped the vial down the dumbwaiter, and slipped back to his box before the curtain rose.',
    archetype: 'deliberate_frame_job',
    fallGuy: 'camille_dupre'
  },
  isDefault: false
};

// ============================================================================
// CASE 3: The Frostbite Protocol (Cause-of-Death Twist)
// Trope: The Stunner vs. The Killer / Assault Confession Trap
// ============================================================================
export const ARCTIC_STORY: IStory = {
  title: 'The Frostbite Protocol: Murder at Station Boreas',
  caseNumber: '2026-0114-BOREAS',
  leadDetective: 'Special Agent Nina Kouris',
  status: 'Active Polar Homicide Investigation',
  archetype: 'cause_of_death_twist',
  trope: 'The Assault Confession Trap',
  victimProfile: {
    name: 'Dr. Erik Lindqvist',
    age: 51,
    occupation: 'Chief Glaciologist & Project Director, Station Boreas',
    discovered: 'January 14, 2026, 04:30 UTC in Deep Sub-Ice Core Vault B4',
    causeOfDeath: 'Acute cryogenic flash-freeze and liquid nitrogen asphyxiation after sustaining a non-fatal blunt skull concussion',
    timeOfDeath: 'Between 03:15 UTC and 03:30 UTC during Category 5 blizzard'
  },
  briefing: {
    initialBriefing: 'Station Boreas sits 400 miles inside the Greenland ice sheet, isolated by a -65°C polar gale. Chief Glaciologist Dr. Erik Lindqvist was found dead inside the pressurized sub-ice drill vault at Level B4. Dr. Nikolai Vance broke down in tears and confessed to striking Lindqvist across the head with a titanium wrench after a violent argument. However, preliminary forensic scans show the blow to the skull was merely a stunner—the true killer triggered the automated liquid nitrogen coolant purge valve 20 minutes later while Lindqvist was unconscious on the deck.',
    detectiveInsights: 'A confession to assault is not a confession to murder. Dr. Vance believes he killed his colleague, but the coroner reveals Lindqvist was breathing normally for 25 minutes after the blow. Deputy Director Dr. Ingrid Meyer has been cool, calm, and cooperative—perhaps too eager to let Nikolai take the fall for a $40 billion rare-earth mining survey.'
  },
  objectives: {
    progress: [
      'Station Boreas placed on full environmental lockdown',
      'Secured Level B4 Cryo-Drill Vault and quarantined life-support telemetry',
      'Interrogated Dr. Nikolai Vance following his assault confession'
    ],
    currentObjectives: [
      'Examine the preliminary autopsy to prove blunt trauma did not cause death',
      'Sweep the Life Support SCADA terminals for the nitrogen purge override code',
      'Interrogate Dr. Ingrid Meyer regarding the rare-earth mining survey',
      'Submit the warrant for the true assassin, not the remorseful attacker'
    ]
  },
  locations: [
    {
      id: 'cryo_drill_vault',
      title: 'Level B4 Sub-Ice Core Vault',
      subtitle: 'Station Boreas - 120 Meters Beneath Glacier',
      status: 'Primary Crime Scene',
      lastVisited: 'January 14, 2026',
      witnesses: 'Dr. Nikolai Vance, Dr. Ingrid Meyer',
      notes: 'Sub-zero drilling vault where ancient ice cores are stored. Liquid nitrogen manifold purge valve #2 was manually locked into the open position.',
      isInitiallyUnlocked: true,
      hiddenEvidenceIds: ['shattered_faceplate', 'nitrogen_manifold_audit'],
      canvassReport: 'CSI sweep verified that while Lindqvist suffered a fractured helmet faceplate from a wrench, the chamber air was 100% displaced by liquid nitrogen at -196°C, causing instant pulmonary freeze.'
    },
    {
      id: 'scada_control_room',
      title: 'Station Life Support SCADA Hub',
      subtitle: 'Habitat Ring Level A',
      status: 'Digital Forensics Site',
      lastVisited: 'Pending Detective Sweep',
      witnesses: 'Chief Engineer Maya Zhang',
      notes: 'Control terminals monitoring oxygen, coolant valves, and atmospheric pressure throughout the polar dome.',
      isInitiallyUnlocked: true,
      hiddenEvidenceIds: ['nitrogen_override_log', 'looped_sleep_tracker'],
      canvassReport: 'System logs prove the nitrogen purge was activated from terminal SCADA-02 using Director Override code "MEYER-ADMIN-77" at 03:22 UTC—twenty minutes after Nikolai fled the vault.'
    },
    {
      id: 'ingrid_private_office',
      title: 'Dr. Ingrid Meyer\'s Research Quarters',
      subtitle: 'Executive Module Suite #2',
      status: 'Restricted Quarters',
      lastVisited: 'Pending Detective Sweep',
      witnesses: 'Dr. Ingrid Meyer',
      notes: 'Sterile, meticulous office with satellite communication uplinks and locked scientific filing safes.',
      isInitiallyUnlocked: false,
      hiddenEvidenceIds: ['rare_earth_mining_concession', 'scrubbed_satellite_transmission'],
      canvassReport: 'Forensic extraction of Ingrid\'s personal hard drive revealed an unredacted survey proving $40 billion in neodymium reserves beneath the glacier, brokered to an offshore consortium.'
    }
  ],
  evidence: [
    {
      id: 'shattered_faceplate',
      title: 'Cracked Titanium Helmet & Autopsy Report',
      subtitle: 'Proof of the Cause-of-Death Twist',
      details: 'Dr. Lindqvist\'s helmet was cracked by a titanium wrench, inflicting a mild skull concussion. However, the coroner\'s autopsy proves zero cerebral hemorrhage; the bronchial tree is coated with frozen nitrogen ice crystals. The victim was alive and breathing for 25 minutes after the blow.',
      date: 'January 14, 2026',
      location: 'Level B4 Drill Vault Deck',
      priority: 'Critical',
      isInitiallyUnlocked: true,
      locationId: 'cryo_drill_vault'
    },
    {
      id: 'nitrogen_override_log',
      title: 'SCADA Nitrogen Coolant Purge Log',
      subtitle: 'The Real Murder Weapon',
      details: 'Automated environmental record showing Level B4 liquid nitrogen flood was initiated at 03:22 UTC using administrative keycard "MEYER-ADMIN-77" belonging to Deputy Director Dr. Ingrid Meyer.',
      date: 'January 14, 2026',
      location: 'SCADA Mainframe Console',
      priority: 'Critical',
      isInitiallyUnlocked: false,
      locationId: 'scada_control_room'
    },
    {
      id: 'looped_sleep_tracker',
      title: 'Falsified Biometric Sleep Telemetry',
      subtitle: 'Ingrid\'s Fabricated Digital Alibi',
      details: 'Dr. Ingrid Meyer\'s biometric wristband logged steady REM sleep in her bunk between 02:00 and 05:00 UTC. Forensic diagnostics reveal the telemetry was an 8-minute repeating simulator loop patched from a USB drive.',
      date: 'January 14, 2026',
      location: 'Habitat Ring Medical Server',
      priority: 'High',
      isInitiallyUnlocked: false,
      locationId: 'scada_control_room'
    },
    {
      id: 'rare_earth_mining_concession',
      title: 'Subglacial $40B Rare-Earth Contract',
      subtitle: 'The Incontrovertible Financial Motive',
      details: 'Encrypted contract between Dr. Ingrid Meyer and Nordic Mining Holdings. Lindqvist had discovered Ingrid was falsifying climate core samples to permit subglacial strip-mining and was going to have her arrested upon relief transport arrival.',
      date: 'January 13, 2026',
      location: 'Ingrid Meyer\'s Encrypted Laptop',
      priority: 'Critical',
      isInitiallyUnlocked: false,
      locationId: 'ingrid_private_office'
    }
  ],
  suspects: [
    {
      id: 'nikolai_vance',
      name: 'Dr. Nikolai Vance',
      role: 'Senior Drilling Specialist (False Confessor)',
      trait: 'Shaken, remorseful scientist sobbing in the holding cell, clutching his head.',
      personality: 'aggressive',
      isInitiallyUnlocked: true,
      category: 'prime_suspect',
      isPrimeSuspect: true,
      initialTrust: 40,
      initialStress: 85,
      alibi: 'Admits to striking Lindqvist with a wrench during a dispute over drill data, then fleeing in sheer terror.',
      motive: 'Lindqvist threatened to revoke his academic tenure and remove him from the station.',
      privateKnowledge: 'Believes in his heart that his strike killed Lindqvist, not knowing Lindqvist was still breathing.',
      secrets: [
        'He was drinking high-proof ethanol in the machine shop before confronting Lindqvist.',
        'He dropped the wrench and ran at exactly 03:02 UTC—twenty minutes before the nitrogen purge.',
        'Saw Dr. Ingrid Meyer walking toward the B4 vault elevator as he was running away.'
      ],
      breakdownThreshold: 60,
      dynamicUnlocks: [
        {
          type: 'location',
          targetId: 'scada_control_room',
          triggerStress: 90,
          revealDialogue: "I swear I hit him and ran! But I never touched the nitrogen valves! When I was sprinting for the stairs, I saw Ingrid entering the elevator corridor with a keycard!"
        }
      ]
    },
    {
      id: 'ingrid_meyer',
      name: 'Dr. Ingrid Meyer',
      role: 'Deputy Station Director (The Actual Killer)',
      trait: 'Cold, hyper-composed, and seemingly helpful; speaks with detached scientific precision.',
      personality: 'cunning',
      isInitiallyUnlocked: true,
      category: 'prime_suspect',
      isPrimeSuspect: true,
      initialTrust: 60,
      initialStress: 15,
      alibi: 'Claims she was asleep in Bunk Pod #2 throughout the night storm, supported by her biometric sleep band.',
      motive: 'Lindqvist caught her selling $40 billion in subglacial mining concessions to Nordic Mining Holdings.',
      privateKnowledge: 'Found Lindqvist unconscious on the deck after Nikolai\'s assault, seized the opportunity, and vented liquid nitrogen into the room to permanently silence him.',
      secrets: [
        'Her biometric sleep data is an uploaded loop designed to give her an airtight digital alibi.',
        'Used her administrative override code to trigger the nitrogen flood.',
        'Knew Nikolai\'s fight with the victim would provide the perfect cover story.'
      ],
      breakdownThreshold: 80,
      dynamicUnlocks: [
        {
          type: 'location',
          targetId: 'ingrid_private_office',
          triggerStress: 65,
          revealDialogue: "You have Nikolai's signed confession! Why are you rifling through my private research office? Everything in there is proprietary corporate property!"
        },
        {
          type: 'evidence',
          targetId: 'nitrogen_override_log',
          triggerEvidenceId: 'shattered_faceplate',
          revealDialogue: "The autopsy says asphyxiation? Well, accidents happen in polar cryo-vaults... but that doesn't link me to any valve malfunctions!"
        }
      ]
    },
    {
      id: 'maya_zhang',
      name: 'Maya Zhang',
      role: 'Chief Habitat Engineer',
      trait: 'Methodical engineer in oil-stained overalls who knows every valve in the station.',
      personality: 'defensive',
      isInitiallyUnlocked: false,
      category: 'witness',
      isPrimeSuspect: false,
      initialTrust: 70,
      initialStress: 30,
      alibi: 'Was in the generator room balancing the turbine load during the blizzard.',
      motive: 'None. Respected Lindqvist\'s safety protocols.',
      privateKnowledge: 'Confirmed the nitrogen purge cannot trigger by accident—it requires an executive override keycard.',
      secrets: [
        'Noticed Ingrid Meyer asking strange questions about the vault\'s automated purging system last week.',
        'Examined the SCADA server and discovered the admin login originated from Meyer\'s credentials.'
      ],
      breakdownThreshold: 75,
      dynamicUnlocks: [
        {
          type: 'evidence',
          targetId: 'looped_sleep_tracker',
          triggerStress: 50,
          revealDialogue: "Check the medical telemetry server! Dr. Meyer's heart rate doesn't have a single normal arrhythmia—it's a synthetic loop file!"
        }
      ]
    }
  ],
  groundTruth: {
    killer: 'ingrid_meyer',
    motive: 'rare_earth_mining_concession',
    weapon: 'nitrogen_override_log',
    keyContradiction: 'shattered_faceplate',
    timelineSummary: 'Nikolai struck Lindqvist with a wrench at 03:02 UTC and fled in terror, believing he killed him. However, Lindqvist was merely unconscious. At 03:22 UTC, Dr. Ingrid Meyer arrived to find Lindqvist down, used her administrative override to flood the vault with liquid nitrogen to protect her $40B rare-earth mining deal, and looped her biometric sleep tracker to create an alibi.',
    archetype: 'cause_of_death_twist',
    trueFatalMechanism: 'Liquid nitrogen cryogenic flash-freeze and oxygen displacement, not the non-fatal skull trauma admitted to by Nikolai Vance'
  },
  isDefault: false
};

// ============================================================================
// CASE 4: The Velvet Alibi (Classic Fair-Play Procedural Noir)
// Trope: Direct Procedural Fair-Play Noir
// ============================================================================
export const JAZZ_STORY: IStory = {
  title: 'The Velvet Alibi: Jazz & Blood at the Blue Note',
  caseNumber: '1952-0814-BN',
  leadDetective: 'Lieutenant Jack Callahan',
  status: 'Active Homicide Investigation',
  archetype: 'classic_procedural',
  trope: 'Direct Procedural Fair-Play Noir',
  victimProfile: {
    name: "Vincent 'Lucky' Moretti",
    age: 47,
    occupation: 'Nightclub Proprietor & Syndicate Loan Shark',
    discovered: 'August 14, 1952, 11:55 PM in the VIP Backroom of the Blue Note Lounge',
    causeOfDeath: 'Single gunshot wound to the thoracic cavity from a .38 caliber snubnose revolver',
    timeOfDeath: 'Between 11:35 PM and 11:45 PM during the final trumpet crescendo'
  },
  briefing: {
    initialBriefing: 'Syndicate boss and nightclub owner Vincent Moretti was found slumped across his counting table in the soundproofed VIP backroom of the Blue Note Lounge. A single bullet from a .38 revolver pierced his heart. The shooting occurred during the climax of the club\'s midnight jazz set, masking the gunshot report behind roaring brass and drums.',
    detectiveInsights: 'Moretti made a fortune running loan operations and extortion rackets. The club was packed with patrons, but backstage access is restricted to band members, the club singer, and his enforcer. Pianist Frankie Valenti swears he never left the piano bench, but the sound booth recording tells a different story.'
  },
  objectives: {
    progress: [
      'Secured Blue Note VIP counting backroom and impounded the safe contents',
      'Corralled musicians and club staff in the main parlor',
      'Dispatched coroner for ballistics extraction'
    ],
    currentObjectives: [
      'Interrogate primary suspects Frankie Valenti and songstress Dolores Dawn',
      'Canvass the stage piano and backstage alley for the murder weapon',
      'Break suspect composure to uncover syndicate associates and hidden witnesses',
      'Review the sound booth recording wire to expose the musical timeline contradiction',
      'Submit the formal arrest warrant with definitive physical ballistics'
    ]
  },
  locations: [
    {
      id: 'vip_backroom',
      title: 'Blue Note VIP Counting Parlor',
      subtitle: 'Behind Soundproofed Velvet Curtains',
      status: 'Primary Crime Scene',
      lastVisited: 'August 14, 1952',
      witnesses: 'Bartender Leo Russo, Enforcer Big Tony',
      notes: 'Soundproofed mahogany room with leather banquettes and a steel safe. Smoke hangs heavy in the air; gunpowder stippling on the doorframe.',
      isInitiallyUnlocked: true,
      hiddenEvidenceIds: ['spent_38_casing', 'moretti_extortion_ledger'],
      canvassReport: 'Forensics dusted the counting table and recovered a spent .38 caliber brass casing with custom cross-groove striations, along with Moretti\'s black extortion ledger.'
    },
    {
      id: 'main_stage_piano',
      title: 'The Blue Note Stage & Parlor Piano',
      subtitle: 'Main Lounge Performance Area',
      status: 'Performance Venue',
      lastVisited: 'August 15, 1952',
      witnesses: 'Frankie Valenti, Dolores Dawn',
      notes: 'Velvet-lined stage with a vintage Steinway upright piano, brass horns, and drum kit. Acoustic soundboards behind the piano bench.',
      isInitiallyUnlocked: true,
      hiddenEvidenceIds: ['snubnose_revolver', 'sound_booth_recording_wire'],
      canvassReport: 'CSI opened the lower acoustic soundbox of the upright piano and recovered a nickel-plated .38 snubnose revolver wrapped in an oily polishing cloth, warm from recent discharge.'
    },
    {
      id: 'backstage_alley_exit',
      title: 'Musicians\' Backstage Dressing Alley',
      subtitle: 'Rear Service Corridor onto 4th Street',
      status: 'Secondary Search Site',
      lastVisited: 'Pending Detective Sweep',
      witnesses: 'Dolores Dawn',
      notes: 'Damp brick alleyway with fire escapes and trash bins. Service mirrors line the backstage door.',
      isInitiallyUnlocked: false,
      hiddenEvidenceIds: ['pawn_ticket_38', 'lipstick_cigarette_butt'],
      canvassReport: 'Found a damp lipstick-stained Turkish cigarette in the backstage ashcan, along with a 3-day-old pawnshop ticket registered to Frankie Valenti for a .38 caliber revolver.'
    }
  ],
  evidence: [
    {
      id: 'snubnose_revolver',
      title: 'Nickel-Plated .38 Snubnose Revolver',
      subtitle: 'The Murder Weapon',
      details: 'Smith & Wesson .38 Special hidden inside the Steinway piano soundbox. Ballistics rifling matches the bullet extracted from Moretti\'s chest. Fingerprints on the cylinder match Frankie Valenti.',
      date: 'August 15, 1952',
      location: 'Steinway Piano Soundbox',
      priority: 'Critical',
      isInitiallyUnlocked: false,
      locationId: 'main_stage_piano'
    },
    {
      id: 'sound_booth_recording_wire',
      title: 'Blue Note Audio Recording Wire',
      subtitle: 'The Decisive Musical Contradiction',
      details: 'Sound engineer wire spool recording the full midnight set. While Frankie claimed he played non-stop piano chords throughout the set, the recording wire proves the piano was completely silent between 11:36 PM and 11:44 PM during an extended drum solo.',
      date: 'August 15, 1952',
      location: 'Sound Engineer Booth',
      priority: 'Critical',
      isInitiallyUnlocked: false,
      locationId: 'main_stage_piano'
    },
    {
      id: 'spent_38_casing',
      title: 'Spent .38 Caliber Shell Casing',
      subtitle: 'Crime Scene Ballistic Exhibit',
      details: 'Remington-Peters .38 cartridge case ejected onto the Persian rug. Gunpowder burn residue indicates the shot was fired from less than three feet away.',
      date: 'August 14, 1952',
      location: 'VIP Backroom Rug',
      priority: 'High',
      isInitiallyUnlocked: true,
      locationId: 'vip_backroom'
    },
    {
      id: 'moretti_extortion_ledger',
      title: 'Moretti\'s Syndicate Debt Ledger',
      subtitle: 'The Incontrovertible Motive Document',
      details: 'Black leather book recording Frankie Valenti\'s $12,000 gambling debt and signed lifetime copyright surrender. A notation states: "Frankie pays in full by midnight or fingers get broken."',
      date: 'August 14, 1952',
      location: 'Moretti\'s Counting Safe',
      priority: 'Critical',
      isInitiallyUnlocked: false,
      locationId: 'vip_backroom'
    },
    {
      id: 'pawn_ticket_38',
      title: 'Pawn Ticket for .38 Revolver',
      subtitle: 'Premeditation Paper Trail',
      details: 'Pawn redemption receipt from Goldblatt\'s Loan Office dated August 11, 1952, logging redemption of the nickel .38 revolver by Frankie Valenti.',
      date: 'August 15, 1952',
      location: 'Backstage Alley Wastecan',
      priority: 'High',
      isInitiallyUnlocked: false,
      locationId: 'backstage_alley_exit'
    }
  ],
  suspects: [
    {
      id: 'frankie_valenti',
      name: "Frankie 'Keys' Valenti",
      role: 'Club Pianist & Arranger',
      trait: 'Sweating musician in a rumpled tux, nervously drumming his fingers on his knees.',
      personality: 'cunning',
      isInitiallyUnlocked: true,
      category: 'prime_suspect',
      isPrimeSuspect: true,
      initialTrust: 45,
      initialStress: 35,
      alibi: 'Swears on his mother\'s grave he was glued to the piano bench playing non-stop from 11:15 PM until the police arrived at midnight.',
      motive: 'Moretti owned his music rights and was extorting his life savings under threat of violence.',
      privateKnowledge: 'Knows he slipped into the backroom during the 8-minute drum solo, shot Moretti point-blank, and stuffed the gun into the piano.',
      secrets: [
        'He owed $12,000 to Moretti\'s loan shark syndicate.',
        'He arranged the extended 8-minute drum solo specifically to create a window to kill Moretti.',
        'His right French cuff has microscopic gunpowder burn residue.'
      ],
      breakdownThreshold: 80,
      dynamicUnlocks: [
        {
          type: 'location',
          targetId: 'backstage_alley_exit',
          triggerStress: 60,
          revealDialogue: "Look, I had a cigarette out in the alley before the set with Dolores! That's all! Search the alley if you don't believe me!"
        },
        {
          type: 'evidence',
          targetId: 'sound_booth_recording_wire',
          triggerStress: 75,
          revealDialogue: "The sound booth wire? What about it? We were just improvising on stage... lots of rhythm changes..."
        }
      ]
    },
    {
      id: 'dolores_dawn',
      name: 'Dolores Dawn',
      role: 'Jazz Torch Singer',
      trait: 'Smoky-voiced songstress in emerald satin, smoking through an ivory holder.',
      personality: 'defensive',
      isInitiallyUnlocked: true,
      category: 'prime_suspect',
      isPrimeSuspect: true,
      initialTrust: 55,
      initialStress: 40,
      alibi: 'Was on stage singing vocal choruses, and taking a powder in the dressing room between songs.',
      motive: 'Was Moretti\'s secret lover, but discovered he was two-timing her with a chorus dancer.',
      privateKnowledge: 'Noticed Frankie slipped away from the piano during the drum solo and returned looking pale as a ghost.',
      secrets: [
        'Moretti threatened to fire her and ruin her recording contract.',
        'Lent Frankie a cigarette backstage right before the midnight set.',
        'Saw Frankie stash something heavy into the piano casing after the applause died down.'
      ],
      breakdownThreshold: 75,
      dynamicUnlocks: [
        {
          type: 'evidence',
          targetId: 'snubnose_revolver',
          triggerStress: 65,
          revealDialogue: "Frankie didn't just play the piano! I saw him reach into the lower cabinet behind the pedals after the drum solo! Check the piano soundbox!"
        }
      ]
    },
    {
      id: 'big_tony_marcone',
      name: "Big Tony Marcone",
      role: 'Syndicate Enforcer & Bodyguard',
      trait: 'Heavy-set bruiser with broken knuckles and a sharp pinstripe suit.',
      personality: 'aggressive',
      isInitiallyUnlocked: false,
      category: 'person_of_interest',
      isPrimeSuspect: false,
      initialTrust: 30,
      initialStress: 25,
      alibi: 'Was out front by the velvet rope turning away drunken patrons.',
      motive: 'Had a dispute over his cut of the casino loan collection.',
      privateKnowledge: 'Moretti told him earlier that evening he was going to squeeze Frankie Valenti until he bled dry.',
      secrets: [
        'He carries a .45 automatic, not a .38 caliber revolver.',
        'Heard the muffled gunshot but thought it was the drummer hitting the rimshot.'
      ],
      breakdownThreshold: 85,
      dynamicUnlocks: [
        {
          type: 'evidence',
          targetId: 'moretti_extortion_ledger',
          triggerStress: 50,
          revealDialogue: "Moretti kept all his debts in the safe behind the painting. Check the ledger—Frankie was on the hook for twelve grand and his hands were about to be broken."
        }
      ]
    }
  ],
  groundTruth: {
    killer: 'frankie_valenti',
    motive: 'moretti_extortion_ledger',
    weapon: 'snubnose_revolver',
    keyContradiction: 'sound_booth_recording_wire',
    timelineSummary: 'Frankie Valenti owed Moretti $12,000 and faced having his hands broken. Frankie arranged an extended 8-minute drum solo into the midnight set, slipped off the piano bench at 11:36 PM, entered the soundproofed VIP room, shot Moretti in the chest with his pawned .38 snubnose, hid the weapon inside the piano soundbox, and resumed playing at 11:44 PM.',
    archetype: 'classic_procedural'
  },
  isDefault: false
};

// ============================================================================
// CASE 5: A Coerced Silence (The False Confession Scapegoat)
// Trope: Coerced Scapegoat Under Maximum Stress
// ============================================================================
export const HARBOR_STORY: IStory = {
  title: 'A Coerced Silence: The Pier 42 Homicide',
  caseNumber: '1978-1103-P42',
  leadDetective: 'Detective Ray Kowalski',
  status: 'Active Waterfront Homicide Investigation',
  archetype: 'false_confession',
  trope: 'Coerced Scapegoat Under Maximum Stress',
  victimProfile: {
    name: "Donald 'Big Don' Higgins",
    age: 56,
    occupation: 'Longshoremen Union Local 302 President',
    discovered: 'November 3, 1978, 06:15 AM floating beneath Pier 42 pilings',
    causeOfDeath: 'Manual ligature strangulation with galvanized industrial wire prior to water submersion',
    timeOfDeath: 'Between 10:00 PM and 11:30 PM, November 2, 1978'
  },
  briefing: {
    initialBriefing: 'Union boss Donald Higgins was pulled dead from the freezing river beneath Pier 42. Under aggressive squad room pressure, 19-year-old forklift apprentice Tommy Ryan broke down and confessed: "I pushed him off the container crane into the river! I saw him drown!" However, the medical examiner preliminary autopsy tells an entirely different story: Higgins was strangled to death inside a dry warehouse two hours before entering the water, and his lungs contain zero river water.',
    detectiveInsights: 'A hasty detective will take Tommy\'s tearful confession and close the case, winning a false conviction and leaving the true harbor syndicate untouched. Harbor Master Sean Callahan has been suspiciously eager to push Tommy into the electric chair, while contraband manifests from Warehouse 9 are mysteriously missing.'
  },
  objectives: {
    progress: [
      'Impounded Pier 42 container crane logbooks',
      'Secured coroner autopsy preliminary findings',
      'Took Tommy Ryan into precinct custody'
    ],
    currentObjectives: [
      'Examine the autopsy to prove the victim was strangled, not drowned from the crane',
      'Canvass Warehouse 9 for the real murder scene and industrial mooring wire',
      'Interrogate Harbor Master Sean Callahan regarding shipping contraband kickbacks',
      'Avoid convicting the coerced teen and indict the real killer'
    ]
  },
  locations: [
    {
      id: 'pier_42_docks',
      title: 'Pier 42 Shipping Gantry & Pilings',
      subtitle: 'Waterfront Container Crane Deck',
      status: 'Recovery Location',
      lastVisited: 'November 3, 1978',
      witnesses: 'Derrick Operator Mac Sullivan, Tommy Ryan',
      notes: 'Fog-shrouded shipping slip where the body was pulled from the water. Crane cab towers 80 feet above the bay.',
      isInitiallyUnlocked: true,
      hiddenEvidenceIds: ['water_recovery_log', 'crane_shift_roster'],
      canvassReport: 'CSI swept the crane gantry where Tommy claimed to push the victim; zero signs of struggle or blood. Recovery logs confirm the victim\'s watch was broken during the drag down the pier.'
    },
    {
      id: 'warehouse_9_drydock',
      title: 'Warehouse 9 Secure Storage',
      subtitle: 'Customs Bonded Freight Terminal',
      status: 'Primary Crime Scene',
      lastVisited: 'Pending Detective Sweep',
      witnesses: 'Harbor Master Sean Callahan',
      notes: 'Industrial warehouse filled with wooden crates and heavy mooring cable spools. Heavy grease stains on the concrete floor.',
      isInitiallyUnlocked: true,
      hiddenEvidenceIds: ['galvanized_mooring_wire', 'bloodstained_freight_manifest'],
      canvassReport: 'Forensics detected Higgins\'s blood spatter behind crate pallet #408, alongside a severed spool of galvanized mooring wire matching the ligature wounds on the victim\'s neck.'
    },
    {
      id: 'harbor_master_office',
      title: 'Harbor Master Administrative Office',
      subtitle: 'Pier 42 Pierhead Building',
      status: 'Restricted Office',
      lastVisited: 'Pending Detective Sweep',
      witnesses: 'Sean Callahan',
      notes: 'Overlooks the shipping channel. Steel desk with customs cargo clearance stamps and encrypted Telex machine.',
      isInitiallyUnlocked: false,
      hiddenEvidenceIds: ['contraband_smuggling_audit', 'callahan_flight_ticket'],
      canvassReport: 'Recovered a hidden audit detailing $500,000 in unmanifested electronics smuggled through Warehouse 9, which Higgins had flagged for federal customs seizure.'
    }
  ],
  evidence: [
    {
      id: 'coroner_submersion_report',
      title: 'Medical Examiner Strangulation Autopsy',
      subtitle: 'Proof of the False Confession',
      details: 'Autopsy conclusively establishing cause of death as ligature strangulation with thin wire, fracturing the thyroid cartilage. Zero water found in the lungs, proving the victim was dead hours before entering the river. Tommy\'s confession that he "pushed him off the crane to drown" is impossible.',
      date: 'November 3, 1978',
      location: 'County Morgue Record',
      priority: 'Critical',
      isInitiallyUnlocked: true,
      locationId: 'pier_42_docks'
    },
    {
      id: 'galvanized_mooring_wire',
      title: 'Galvanized Industrial Mooring Wire',
      subtitle: 'The True Murder Weapon',
      details: 'High-tensile steel cable with traces of petroleum grease and victim skin cells. Found stashed behind oil drums in Warehouse 9. Wire gauge matches the deep horizontal throat grooves exactly.',
      date: 'November 3, 1978',
      location: 'Warehouse 9 Floor',
      priority: 'Critical',
      isInitiallyUnlocked: false,
      locationId: 'warehouse_9_drydock'
    },
    {
      id: 'bloodstained_freight_manifest',
      title: 'Blood-Spattered Shipping Manifest',
      subtitle: 'Crime Scene Proximity Exhibit',
      details: 'Customs manifest for Container Ship Titan-4 spattered with Higgins\'s Type-A blood, stamped with Harbor Master Sean Callahan\'s private inspection seal.',
      date: 'November 3, 1978',
      location: 'Warehouse 9 Pallet #408',
      priority: 'High',
      isInitiallyUnlocked: false,
      locationId: 'warehouse_9_drydock'
    },
    {
      id: 'contraband_smuggling_audit',
      title: 'Port Authority Smuggling Indictment',
      subtitle: 'The Incontrovertible Motive',
      details: 'Audit prepared by Donald Higgins detailing Sean Callahan\'s multi-million dollar smuggling pipeline through Pier 42. Higgins was scheduled to deliver it to the FBI the morning after his murder.',
      date: 'November 2, 1978',
      location: 'Harbor Master Desk Drawer',
      priority: 'Critical',
      isInitiallyUnlocked: false,
      locationId: 'harbor_master_office'
    }
  ],
  suspects: [
    {
      id: 'tommy_ryan',
      name: 'Tommy Ryan',
      role: 'Apprentice Forklift Driver (Coerced Scapegoat)',
      trait: '19-year-old kid terrified of the police, trembling in handcuffs, desperate to protect his ailing mother.',
      personality: 'nervous',
      isInitiallyUnlocked: true,
      category: 'prime_suspect',
      isPrimeSuspect: true,
      initialTrust: 45,
      initialStress: 75,
      alibi: 'Gives a frantic, coerced confession claiming he pushed Higgins off the crane gantry after an argument.',
      motive: 'Higgins fired his father from the union last month for alcohol abuse.',
      privateKnowledge: 'Falsely confessed because detective interrogators threatened to charge his mother with harboring stolen tools.',
      secrets: [
        'He was actually asleep in the break room locker at 11:00 PM.',
        'He has no idea what weapon was used and guessed "pushing him off the crane" because that\'s where the body was found.',
        'Saw Sean Callahan dragging a heavy tarp toward the pier edge at midnight.'
      ],
      breakdownThreshold: 85,
      dynamicUnlocks: [
        {
          type: 'location',
          targetId: 'harbor_master_office',
          triggerStress: 90,
          revealDialogue: "I lied! I lied to make you stop yelling! I didn't push him! I was hiding in the breakroom! It was Sean Callahan—I saw him dragging something heavy out of Warehouse 9!"
        }
      ]
    },
    {
      id: 'sean_callahan',
      name: 'Sean Callahan',
      role: 'Pier 42 Harbor Master (The Actual Killer)',
      trait: 'Aggressive, arrogant dock boss who chews unlit cigars and yells at detectives.',
      personality: 'aggressive',
      isInitiallyUnlocked: true,
      category: 'prime_suspect',
      isPrimeSuspect: true,
      initialTrust: 30,
      initialStress: 20,
      alibi: 'Claims he was doing paperwork in his office and having dinner at the diner across the street.',
      motive: 'Higgins discovered his contraband smuggling operation and was reporting him to federal marshals.',
      privateKnowledge: 'Ambushed Higgins in Warehouse 9, strangled him with mooring wire, and dumped his corpse in the water using the crane hoist.',
      secrets: [
        'His fingerprints are on the bloodstained manifest in Warehouse 9.',
        'He coerced the night watchman to alter the pier gate logs.',
        'Booked a one-way flight to Rio under an alias for tomorrow morning.'
      ],
      breakdownThreshold: 80,
      dynamicUnlocks: [
        {
          type: 'evidence',
          targetId: 'galvanized_mooring_wire',
          triggerEvidenceId: 'coroner_submersion_report',
          revealDialogue: "Higgins didn't drown? What kind of coroner quack are you listening to? Warehouse 9 is a working pier, you won't find anything there!"
        },
        {
          type: 'evidence',
          targetId: 'contraband_smuggling_audit',
          triggerStress: 75,
          revealDialogue: "You want to talk about manifests? The Port Authority has been riding my back for months! Higgins had no right to snoop in my freight!"
        }
      ]
    },
    {
      id: 'martha_higgins',
      name: 'Martha Higgins',
      role: 'Victim\'s Widow',
      trait: 'Grief-stricken but sharp woman who knows all the politics of the dockworkers union.',
      personality: 'defensive',
      isInitiallyUnlocked: false,
      category: 'witness',
      isPrimeSuspect: false,
      initialTrust: 65,
      initialStress: 40,
      alibi: 'At home waiting for Don to return for late supper.',
      motive: 'None. Loved her husband of 30 years.',
      privateKnowledge: 'Don told her that Callahan was threatening his life over a federal smuggling investigation.',
      secrets: [
        'Don kept an emergency safety copy of his audit notes in his home lockbox.',
        'Said: "If anything happens to me, tell the police to look at Callahan\'s offshore bank accounts."'
      ],
      breakdownThreshold: 75,
      dynamicUnlocks: [
        {
          type: 'evidence',
          targetId: 'bloodstained_freight_manifest',
          triggerStress: 55,
          revealDialogue: "Don told me Callahan had been forging freight manifests for months. Look in Warehouse 9 where Callahan keeps his private cargo!"
        }
      ]
    }
  ],
  groundTruth: {
    killer: 'sean_callahan',
    motive: 'contraband_smuggling_audit',
    weapon: 'galvanized_mooring_wire',
    keyContradiction: 'coroner_submersion_report',
    timelineSummary: 'Sean Callahan was running an illegal $500,000 smuggling ring through Warehouse 9. When union president Donald Higgins prepared an audit for the FBI, Callahan ambushed him in Warehouse 9 at 10:45 PM, strangled him with galvanized mooring wire, and dumped his corpse under Pier 42. When 19-year-old Tommy Ryan broke under aggressive interrogation and falsely confessed to drowning him, Callahan tried to let the boy take the rap.',
    archetype: 'false_confession',
    fallGuy: 'tommy_ryan'
  },
  isDefault: false
};

// ============================================================================
// CASE 6: The Cobblestone Web (Non-Linear Web of Lies)
// Trope: 3 Guilty Suspects, 1 Lethal Window
// ============================================================================
export const MANOR_STORY: IStory = {
  title: 'The Cobblestone Web: Murder at Ravenscroft',
  caseNumber: '1928-1115-RM',
  leadDetective: 'Inspector Alistair Finch',
  status: 'Active Country Estate Homicide',
  archetype: 'non_linear_web',
  trope: '3 Guilty Suspects, 1 Lethal Window',
  victimProfile: {
    name: 'Lord Alistair Ravenscroft',
    age: 84,
    occupation: 'Railway Tycoon & Devonshire Landowner',
    discovered: 'November 15, 1928, 00:15 AM in his locked library armchair',
    causeOfDeath: 'Mechanical asphyxiation via velvet parlor pillow smothering while paralyzed by sub-lethal arsenic',
    timeOfDeath: 'Exactly between 11:35 PM and 11:40 PM, November 14, 1928'
  },
  briefing: {
    initialBriefing: 'During a tempestuous thunderstorm at Ravenscroft Manor, 84-year-old railway baron Lord Alistair Ravenscroft was found dead in his winged armchair in the locked library. Three different suspects entered the study that night, each guilty of a sinister act: the butler slipped arsenic into his bedtime port, his disowned son broke through the terrace window with a brass poker to steal the will, and his young widow Lady Eleanor smothered him with a parlor pillow while he was incapacitated. Advancing through the investigation will strip away their alibis, leaving all three looking guilty of murder.',
    detectiveInsights: 'This is not a case of who wanted him dead—they all did. The challenge is calculating the exact lethal timeline window: arsenic takes four hours to kill and only caused stomach cramps; the son broke the window at 11:45 PM and found his father already cold; only Lady Eleanor entered at 11:35 PM when the lethal smothering occurred.'
  },
  objectives: {
    progress: [
      'Secured Ravenscroft Manor library and impounded the will drafts',
      'Isolated Lady Eleanor, Arthur Jenkins, and Roderick in the drawing room',
      'Summoned county physician for toxicological analysis'
    ],
    currentObjectives: [
      'Examine the library armchair pillow for mechanical smothering fibers',
      'Determine why the arsenic dose administered by Jenkins was not the lethal cause',
      'Establish the exact 11:35 PM lethal window before Roderick broke the window',
      'Indict Lady Eleanor for execution-style murder, not the other two schemers'
    ]
  },
  locations: [
    {
      id: 'manor_library',
      title: 'The Great Oak Library',
      subtitle: 'Ravenscroft Manor - West Wing Ground Floor',
      status: 'Primary Crime Scene',
      lastVisited: 'November 15, 1928',
      witnesses: 'Butler Arthur Jenkins, Maid Clara Pemberton',
      notes: 'Grand two-story library with a massive stone hearth. Rain lashes through a shattered terrace French door. Velvet armchair rests near the fireplace.',
      isInitiallyUnlocked: true,
      hiddenEvidenceIds: ['pillow_down_fibers', 'half_empty_port_goblet'],
      canvassReport: 'Forensic sweep discovered microscopic goose-down pillow feathers packed inside the victim\'s nasal cavity and petechial hemorrhages in his eyelids, proving death was caused by rapid mechanical smothering.'
    },
    {
      id: 'butler_pantry_service',
      title: 'Butler\'s Pantry & Silver Vault',
      subtitle: 'Domestic Service Wing',
      status: 'Secondary Search Site',
      lastVisited: 'Pending Detective Sweep',
      witnesses: 'Arthur Jenkins',
      notes: 'Lined with silver tea sets and decanters. A concealed dumbwaiter leads up to the master bedchamber.',
      isInitiallyUnlocked: true,
      hiddenEvidenceIds: ['arsenic_pest_powder', 'jenkins_stolen_folios'],
      canvassReport: 'Found an opened tin of white arsenic trioxide pest powder behind the crystal decanters, alongside three priceless stolen first-edition Shakespeare folios.'
    },
    {
      id: 'terrace_conservatory',
      title: 'South Terrace & Conservatory',
      subtitle: 'Exterior Garden Entrance',
      status: 'Intrusion Site',
      lastVisited: 'Pending Detective Sweep',
      witnesses: 'Roderick Ravenscroft',
      notes: 'Muddy flagstones beneath the broken library terrace window. Trellis vines torn away by a heavy climber.',
      isInitiallyUnlocked: false,
      hiddenEvidenceIds: ['shattered_terrace_glass', 'roderick_gold_cufflink'],
      canvassReport: 'Recovered a heavy brass fireplace poker dropped in the mud, along with Roderick\'s monogrammed gold cufflink and muddy bootprints stamped at 11:45 PM.'
    },
    {
      id: 'eleanor_boudoir',
      title: 'Lady Eleanor\'s Private Boudoir',
      subtitle: 'East Wing Master Suite',
      status: 'Restricted Suite',
      lastVisited: 'Pending Detective Sweep',
      witnesses: 'Lady Eleanor Ravenscroft',
      notes: 'Opulent French boudoir with silk tapestries. Grandfather clock in the foyer chimes on the half hour.',
      isInitiallyUnlocked: false,
      hiddenEvidenceIds: ['revised_inheritance_will', 'down_feathered_dressing_gown'],
      canvassReport: 'Discovered the newly drafted revised will leaving 100% of the railway fortune to Eleanor, plus a silk dressing gown bearing two crushed goose-down feathers on the sleeve.'
    }
  ],
  evidence: [
    {
      id: 'pillow_down_fibers',
      title: 'Velvet Parlor Pillow & Facial Down Feathers',
      subtitle: 'The Real Lethal Mechanism',
      details: 'Microscopic analysis of the velvet armchair pillow reveals saliva and deep epidermal abrasions. Down feathers match fibers found compressed inside Lord Alistair\'s nostrils and mouth, establishing suffocation as the immediate cause of death.',
      date: 'November 15, 1928',
      location: 'Library Armchair',
      priority: 'Critical',
      isInitiallyUnlocked: true,
      locationId: 'manor_library'
    },
    {
      id: 'half_empty_port_goblet',
      title: 'Drugged Crystal Port Goblet',
      subtitle: 'Jenkins\'s Sub-Lethal Arsenic Dose',
      details: 'Goblet containing 20-year-old vintage port laced with 50mg of arsenic trioxide. Chemical pathology proves this sub-lethal dose caused severe muscular weakness and paralysis at 11:30 PM, but takes 4 to 6 hours to be fatal. It incapacitated the victim so he could not fight off the smothering pillow.',
      date: 'November 15, 1928',
      location: 'Library Side Table',
      priority: 'High',
      isInitiallyUnlocked: true,
      locationId: 'manor_library'
    },
    {
      id: 'roderick_gold_cufflink',
      title: 'Roderick\'s Broken Gold Cufflink',
      subtitle: 'Proof of Late Intrusion at 11:45 PM',
      details: 'Gold monogrammed cufflink snagged on the broken terrace glass. Mud timestamp matches 11:45 PM—proving Roderick arrived 10 minutes after his father was already dead.',
      date: 'November 15, 1928',
      location: 'Terrace Flagstones',
      priority: 'High',
      isInitiallyUnlocked: false,
      locationId: 'terrace_conservatory'
    },
    {
      id: 'down_feathered_dressing_gown',
      title: 'Silk Dressing Gown with Down Feathers',
      subtitle: 'The Decisive Physical Match',
      details: 'Lady Eleanor\'s emerald silk dressing gown. The cuff contains two crushed white down feathers identical to the filler in the library smothering pillow, proving physical contact with the pillow.',
      date: 'November 15, 1928',
      location: 'Lady Eleanor\'s Wardrobe',
      priority: 'Critical',
      isInitiallyUnlocked: false,
      locationId: 'eleanor_boudoir'
    },
    {
      id: 'revised_inheritance_will',
      title: 'Revised Ravenscroft Testament',
      subtitle: 'The Incontrovertible Motive Document',
      details: 'Lord Alistair\'s newly penned will dated November 14, disinheriting Roderick entirely and leaving the entire £2,000,000 estate to Lady Eleanor, provided she remained his wife at his time of death.',
      date: 'November 15, 1928',
      location: 'Eleanor\'s Secret Vanity Drawer',
      priority: 'Critical',
      isInitiallyUnlocked: false,
      locationId: 'eleanor_boudoir'
    }
  ],
  suspects: [
    {
      id: 'lady_eleanor_ravenscroft',
      name: 'Lady Eleanor Ravenscroft',
      role: 'Young Widow & Sole Beneficiary (The Actual Killer)',
      trait: 'Composed, beautiful, and calculating 38-year-old widow who maintains imperial dignity.',
      personality: 'confident',
      isInitiallyUnlocked: true,
      category: 'prime_suspect',
      isPrimeSuspect: true,
      initialTrust: 50,
      initialStress: 20,
      alibi: 'Claims she was reading novels in her second-floor boudoir from 10:00 PM until the maid discovered the body at midnight.',
      motive: 'Inherited the entire £2,000,000 railway fortune; Alistair was threatening to divorce her tomorrow morning.',
      privateKnowledge: 'Knew Jenkins was drugging Alistair\'s port. Slipped into the library at 11:35 PM while Alistair was paralyzed, held the pillow over his face until he stopped moving, and slipped back up the service stair.',
      secrets: [
        'Alistair caught her having an affair and drafted divorce papers scheduled for delivery tomorrow.',
        'Her dressing gown cuff has two down feathers from the murder pillow.',
        'Maid Clara saw her shadow slip out of the library passage at the 11:30 half-hour chime.'
      ],
      breakdownThreshold: 80,
      dynamicUnlocks: [
        {
          type: 'location',
          targetId: 'eleanor_boudoir',
          triggerStress: 60,
          revealDialogue: "My boudoir is private! You have no right to rummage through my personal effects! Alistair loved me and provided for me!"
        },
        {
          type: 'evidence',
          targetId: 'down_feathered_dressing_gown',
          triggerEvidenceId: 'pillow_down_fibers',
          revealDialogue: "Pillow feathers? In his throat? Why are you asking me about pillows when Jenkins was poisoning his wine and Roderick smashed the terrace window?"
        }
      ]
    },
    {
      id: 'arthur_jenkins',
      name: 'Arthur Jenkins',
      role: 'Head Butler (The Poisoner)',
      trait: 'Fastidious, dignified butler of 30 years who speaks in polite, measured whispers.',
      personality: 'cunning',
      isInitiallyUnlocked: true,
      category: 'prime_suspect',
      isPrimeSuspect: true,
      initialTrust: 45,
      initialStress: 45,
      alibi: 'Served Lord Alistair his evening port at 10:30 PM, then retired to polish silver in the pantry.',
      motive: 'Lord Alistair discovered he was stealing rare first-edition folios from the library and selling them to London dealers.',
      privateKnowledge: 'Admitted slipping arsenic into the port to cause an incapacitating illness so he could flee with the stolen books.',
      secrets: [
        'He poisoned the wine, but arsenic takes 4 hours to kill—he was stunned to hear Alistair died before midnight.',
        'Kept three stolen Shakespeare folios hidden in his pantry silver vault.',
        'Saw Lady Eleanor sneaking down the west service stairs in her silk robe at 11:32 PM.'
      ],
      breakdownThreshold: 75,
      dynamicUnlocks: [
        {
          type: 'location',
          targetId: 'terrace_conservatory',
          triggerStress: 65,
          revealDialogue: "I didn't break into the library! Look at the terrace! Roderick was shouting outside in the garden with a brass poker!"
        },
        {
          type: 'character',
          targetId: 'roderick_ravenscroft',
          triggerStress: 70,
          revealDialogue: "Roderick Ravenscroft came back to the estate tonight! He swore he would kill his father if he didn't get his inheritance!"
        }
      ]
    },
    {
      id: 'roderick_ravenscroft',
      name: 'Roderick Ravenscroft',
      role: 'Disowned Gambler Son (The Break-In Intruder)',
      trait: 'Hot-headed, aggressive young aristocrat in wet tweed with mud on his boots.',
      personality: 'aggressive',
      isInitiallyUnlocked: false,
      category: 'prime_suspect',
      isPrimeSuspect: true,
      initialTrust: 30,
      initialStress: 65,
      alibi: 'Claims he was in London playing cards at the Mayfair Club all evening.',
      motive: 'Was completely cut out of his father\'s will and owed £30,000 to ruthless loan sharks.',
      privateKnowledge: 'Climbed the terrace trellis at 11:45 PM with a brass poker, smashed the window, but found his father already dead and cold in the armchair!',
      secrets: [
        'He broke the terrace glass, cut his hand, and dropped his gold cufflink.',
        'He arrived at 11:45 PM—after the murder had already occurred.',
        'Panicked when he touched his father\'s face and felt no pulse, dropping the poker and fleeing into the storm.'
      ],
      breakdownThreshold: 75,
      dynamicUnlocks: [
        {
          type: 'evidence',
          targetId: 'roderick_gold_cufflink',
          triggerStress: 70,
          revealDialogue: "Alright! Yes, I smashed the terrace window at a quarter to midnight! But he was already dead! His hands were cold and his eyes were open! I didn't touch him!"
        }
      ]
    },
    {
      id: 'clara_pemberton',
      name: 'Clara Pemberton',
      role: 'Parlour Maid',
      trait: 'Observant young maid who knows all the domestic secrets of the manor.',
      personality: 'nervous',
      isInitiallyUnlocked: false,
      category: 'witness',
      isPrimeSuspect: false,
      initialTrust: 75,
      initialStress: 35,
      alibi: 'Extinguishing hallway gaslamps and checking bedroom hearths.',
      motive: 'None. Devoted servant.',
      privateKnowledge: 'Heard the grandfather clock chime 11:30 PM just as Lady Eleanor passed her in the corridor toward the library.',
      secrets: [
        'Saw Lady Eleanor wearing her green silk robe heading toward the library passage.',
        'Noticed Lady Eleanor was breathing heavily and hiding something in her pocket when she returned upstairs at 11:42 PM.'
      ],
      breakdownThreshold: 70,
      dynamicUnlocks: [
        {
          type: 'evidence',
          targetId: 'revised_inheritance_will',
          triggerStress: 50,
          revealDialogue: "Milady Eleanor had Lord Alistair sign a new will yesterday morning. She told me to make sure the library was kept completely quiet tonight."
        }
      ]
    }
  ],
  groundTruth: {
    killer: 'lady_eleanor_ravenscroft',
    motive: 'revised_inheritance_will',
    weapon: 'pillow_down_fibers',
    keyContradiction: 'down_feathered_dressing_gown',
    timelineSummary: 'Three suspects acted against Lord Alistair: Jenkins poisoned his port with slow-acting arsenic at 10:30 PM, causing paralysis by 11:30 PM. At 11:35 PM, Lady Eleanor entered the library, used the velvet parlor pillow to smother the paralyzed Lord to secure his £2M estate before he could file for divorce, and fled by 11:40 PM. At 11:45 PM, Roderick smashed the terrace window with a poker, found his father already dead, and fled in panic.',
    archetype: 'non_linear_web'
  },
  isDefault: false
};

// ============================================================================
// CASE 4: The Velvet Alibi (Midnight Lounge Draft)
// Trope: Pure deduction noir
// ============================================================================
export const MIDNIGHT_LOUNGE_STORY: IStory = {
  "title": "The Velvet Alibi: Poison at the Midnight Lounge",
  "caseNumber": "1952-0814-VL",
  "leadDetective": "Lieutenant Jack Callahan",
  "status": "Active Homicide Investigation",
  "victimProfile": {
    "name": "Vincent 'Lucky' Moretti",
    "age": 47,
    "occupation": "Nightclub Proprietor & Syndicate Boss",
    "discovered": "August 14, 1952, 2:15 AM in the VIP Backroom",
    "causeOfDeath": "Acute potassium cyanide poisoning via rye highball",
    "timeOfDeath": "Between 1:30 AM and 2:00 AM"
  },
  "briefing": {
    "initialBriefing": "Vincent Moretti was found slumped across his mahogany desk with an empty whiskey tumbler smelling of bitter almonds.",
    "detectiveInsights": "Moretti was preparing to sell the club and divorce his wife."
  },
  "objectives": {
    "progress": [
      "Secured VIP Backroom crime scene"
    ],
    "currentObjectives": [
      "Interrogate Delilah Moretti"
    ]
  },
  "locations": [
    {
      "id": "vip_backroom",
      "title": "The VIP Backroom",
      "subtitle": "Midnight Lounge - Rear Corridor",
      "status": "Active Crime Scene",
      "lastVisited": "August 14, 2:20 AM",
      "witnesses": "Club Doorman",
      "notes": "Mahogany desk, half-full rye bottle",
      "unlockStage": 1
    }
  ],
  "evidence": [
    {
      "id": "cyanide_whiskey_glass",
      "title": "Crystal Whiskey Tumbler",
      "subtitle": "Traces of lethal potassium cyanide",
      "details": "Lab tests confirm crystalline cyanide dissolved in 18-year rye whiskey.",
      "date": "Aug 14, 2:25 AM",
      "location": "VIP Backroom Desk",
      "priority": "Critical",
      "unlockStage": 1
    }
  ],
  "suspects": [
    {
      "id": "delilah_moretti",
      "name": "Delilah Moretti",
      "role": "Lead Torch Singer & Victim's Wife",
      "trait": "Glamorous, composed",
      "initialTrust": 45,
      "initialStress": 30,
      "alibi": "Performing on stage.",
      "motive": "Vincent planned to divorce her.",
      "privateKnowledge": "She stepped into the VIP backroom during the solo.",
      "secrets": [
        "Admitted arguing violently with Vincent"
      ],
      "breakdownThreshold": 75,
      "evidenceReactions": {},
      "isPrimeSuspect": true,
      "category": "prime_suspect"
    }
  ],
  "groundTruth": {
    "killer": "delilah_moretti",
    "motive": "divorce_and_insurance",
    "weapon": "cyanide_whiskey_glass",
    "keyContradiction": "stage_break_window",
    "timelineSummary": "Delilah poisoned the rye during the brass solo."
  },
  "isDefault": false,
  "archetype": "classic_procedural",
  "trope": "Pure deduction noir"
};

// ============================================================================
// CASE 5: Neon Vein: The Last Byte (Cyberpunk Mystery)
// Trope: The Stunner vs. The Killer
// ============================================================================
export const NEON_STORY: IStory = {
  "title": "Neon Vein: The Last Byte",
  "caseNumber": "2025-0442-CN",
  "leadDetective": "Detective Kaito Ren",
  "status": "Active Homicide Investigation",
  "victimProfile": {
    "name": "Jin 'Byte' Sato",
    "age": 42,
    "occupation": "Cyber-Data Broker and Heist Architect",
    "discovered": "Oct 14, 2085, 02:45 AM, Neon Alley Sector 7, by Night Watch Unit 12",
    "causeOfDeath": "Cyanide chloride gas inhalation (micro-capsule rupture from neck implant)",
    "timeOfDeath": "Oct 14, 2085, 01:30 AM - 02:00 AM"
  },
  "briefing": {
    "initialBriefing": "Jin Sato was found slumped in the rain-slicked neon alley behind the 'Kurogane' data-brokerage. A heavy bronze cybernetic arm was discovered nearby, sparking immediate suspicion of a violent struggle. Initial scenes suggest a botched heist or a turf war gone wrong, with blood spatter indicating recent trauma to the skull.",
    "detectiveInsights": "The blood pattern is inconsistent with the reported fight; the wounds are superficial compared to the blunt force object nearby. Furthermore, the victim's cybernetic neural implant shows a distinct, sudden spike in toxic chemical readings rather than impact trauma, suggesting the 'blow' was a cover-up or a misunderstanding of the actual cause of death."
  },
  "objectives": {
    "progress": [
      "Secure the crime scene and lift initial physical evidence.",
      "Identify the three primary suspects present in the vicinity during the estimated time of death.",
      "Review preliminary security footage from the Kurogane building."
    ],
    "currentObjectives": [
      "Interrogate suspects to expose the first major alibi flaw.",
      "Uncover the financial motive behind the assassination.",
      "Determine how the security breach occurred and locate the true murder weapon.",
      "Submit the final Arrest Warrant to the Judge for execution."
    ]
  },
  "locations": [
    {
      "id": "neon_alley_sector_7",
      "title": "Neon Alley Sector 7",
      "subtitle": "Backlot of Kurogane Brokerage",
      "status": "Active Crime Scene",
      "lastVisited": "Oct 14, 2085, 03:00 AM",
      "witnesses": "Night Watch Unit 12, Barista at 'Ramen Ghost' (hearsy)",
      "notes": "Rain-washed concrete. A heavy bronze cybernetic arm lies in a puddle. Smell of ozone and metallic tang. No signs of entry/exit other than the main hatch.",
      "unlockStage": 1
    },
    {
      "id": "kurogane_server_room",
      "title": "Kurogane Server Vault",
      "subtitle": "Sub-basement Level 3",
      "status": "Location of Interest",
      "lastVisited": "Pending",
      "witnesses": "None (Biometric locks only)",
      "notes": "High-security cold storage. Access logs required. This is where the 'Shadow Drive' was supposed to be stored before the heist.",
      "unlockStage": 2
    },
    {
      "id": "underground_apothecary",
      "title": "The Gray Lotus",
      "subtitle": "Black Market Clinic, Sector 4",
      "status": "Location of Interest",
      "lastVisited": "Pending",
      "witnesses": "Dr. Aris Thorne (Owner), Unidentified Courier",
      "notes": "Sells illegal bio-enhancements and antidotes. The victim had an appointment here. Check for purchase records of toxic compounds.",
      "unlockStage": 3
    },
    {
      "id": "judge_antechamber",
      "title": "Neo-Tokyo Judicial Antechamber",
      "subtitle": "Central District, Level 50",
      "status": "Arrest Warrant Processing",
      "lastVisited": "Pending",
      "witnesses": "Judge Elara Vance, Court Bailiff",
      "notes": "The final step. Present the compiled evidence and correct identification of the killer to secure the warrant.",
      "unlockStage": 4
    }
  ],
  "evidence": [
    {
      "id": "bronze_cyber_arm",
      "title": "Detached Bronze Cybernetic Arm",
      "subtitle": "Blunt Force Instrument",
      "details": "A heavy, bronze-plated prosthetic limb. Analysis shows it was used to strike the victim's temple. The force was sufficient to cause a severe concussion and unconsciousness, but not fatal trauma. The arm has no fingerprints, only smudges consistent with the victim's own hand slipping during impact.",
      "date": "Oct 14, 2085, 03:15 AM",
      "location": "neon_alley_sector_7",
      "priority": "High",
      "unlockStage": 1
    },
    {
      "id": "alibi_log_discrepancy",
      "title": "Discrepancy in Suspect A's Log",
      "subtitle": "Digital Footprint Analysis",
      "details": "Suspect A (Kael) claims he was at a club until 01:00 AM. However, geolocation data from his neural link shows he was in the alleyway sector at 00:45 AM, 15 minutes earlier than he stated. This proves he was present at the scene before the 'fight' supposedly occurred.",
      "date": "Oct 15, 2085, 09:00 AM",
      "location": "Precinct Database",
      "priority": "Critical",
      "unlockStage": 1
    },
    {
      "id": "financial_ledger_leak",
      "title": "Encrypted Financial Ledger",
      "subtitle": "Data Extraction from Victim's Drive",
      "details": "Recovered from Jin Sato's personal implant. It reveals a massive debt owed to Suspect C (Vex). Vex is not just a rival; he is Jin's silent partner who was to be cut out of a $50M credit chit. The motive is purely financial survival for Vex, while Jin planned to default on the debt.",
      "date": "Oct 15, 2085, 11:30 AM",
      "location": "Precinct Forensics Lab",
      "priority": "High",
      "unlockStage": 2
    },
    {
      "id": "toxicology_report",
      "title": "Toxicology & Neural Spike Analysis",
      "subtitle": "Autopsy Addendum",
      "details": "The official autopsy confirms no fatal skull fracture. However, toxicology reveals a lethal dose of Cyanide Chloride was released directly into the bloodstream via the victim's cervical neural port. The timestamp of the chemical release is 01:45 AM. This is the true cause of death. The blunt trauma occurred at 02:15 AM, *after* the victim was already dead or dying, likely as a panicked reaction to the victim's collapse.",
      "date": "Oct 16, 2085, 08:00 AM",
      "location": "Neo-Tokyo Medical Examiner's Office",
      "priority": "Critical",
      "unlockStage": 3
    },
    {
      "id": "micro_capsule_residue",
      "title": "Micro-Capsule Residue",
      "subtitle": "Physical Trace",
      "details": "Fragments of a bio-degradable micro-capsule were found embedded in the victim's neck port. Spectroscopy matches the residue to a specific, rare batch of cyanide precursor sold only at The Gray Lotus. The capsule was designed to rupture upon a specific signal from a remote device.",
      "date": "Oct 16, 2085, 10:00 AM",
      "location": "Precinct Forensics Lab",
      "priority": "High",
      "unlockStage": 3
    },
    {
      "id": "remote_trigger_device",
      "title": "Modified Remote Trigger",
      "subtitle": "Weapon Component",
      "details": "Found hidden in the ventilation duct of the Kurogane Server Vault. It is a modified data-jack transmitter capable of sending the specific burst needed to rupture the micro-capsule. The device has a biometric signature link to Suspect C's neural ID.",
      "date": "Oct 16, 2085, 14:00 PM",
      "location": "kurogane_server_room",
      "priority": "Critical",
      "unlockStage": 3
    }
  ],
  "suspects": [
    {
      "id": "kael_vance",
      "name": "Kael Vance",
      "role": "Rival Data Broker / Ex-Partner",
      "trait": "Aggressive, defensive, physically imposing. Uses intimidation to deflect questions.",
      "initialTrust": 30,
      "initialStress": 60,
      "alibi": "I was at the 'Neon Pulse' club until 01:00 AM. I didn't even know Jin was coming to the alley until I saw the body and the arm nearby. I tried to help him, but he was already gone. I hit him once when he lunged at me; I thought I killed him, but I was just scared.",
      "motive": "Jin was stealing his client base. Kael views Jin as a threat to his livelihood and had a history of violent altercations.",
      "privateKnowledge": "Kael was actually in the alley at 00:45 AM to confront Jin about a missed payment. He got into a fight, hit Jin with the bronze arm, and fled in panic when Jin collapsed. He genuinely believes he committed murder, which is why he is so stressed and defensive. He did not poison Jin.",
      "secrets": [
        "He was at the scene 15 minutes before his stated alibi.",
        "He struck the victim with the bronze arm, causing non-fatal trauma.",
        "He fled the scene in terror, believing he had killed Jin."
      ],
      "breakdownThreshold": 85,
      "evidenceReactions": {
        "bronze_cyber_arm": "Trembles. Admits to hitting Jin with it but swears it wasn't meant to kill, only to stop him. Claims Jin fell on his own afterwards.",
        "alibi_log_discrepancy": "Angered. Admits to being there early to 'settle things' but insists he left before any death occurred. Claims he returned later to check and found him dead.",
        "toxicology_report": "Shocked. Denies knowledge of cyanide. Points to the others, claiming Jin was involved in dirty deals with 'enhanced' chemicals."
      },
      "isPrimeSuspect": true,
      "category": "prime_suspect"
    },
    {
      "id": "mira_chen",
      "name": "Mira Chen",
      "role": "Jin's Secretary / Scapegoat",
      "trait": "Nervous, meticulous, overly compliant. Hides her own agency.",
      "initialTrust": 50,
      "initialStress": 40,
      "alibi": "I was in my office on the 4th floor. I heard a crash around 02:00 AM but thought it was construction. I didn't go down to the alley because I was locked in on a report.",
      "motive": "Jin was planning to fire her for embezzling small sums. She feared exposure.",
      "privateKnowledge": "Mira was not involved in the murder. She was in the office, but she ignored the distress signals from Jin's comm link because she was afraid of being implicated in his illegal activities. She is a witness, not a participant.",
      "secrets": [
        "She embezzled $2,000 credit from Jin's petty cash.",
        "She ignored Jin's final distress call.",
        "She is afraid of Kael Vance's reputation."
      ],
      "breakdownThreshold": 70,
      "evidenceReactions": {
        "financial_ledger_leak": "Cries. Admits to the small embezzlement but denies knowing about the $50M debt or the poisoning.",
        "toxicology_report": "Confused. States she didn't see anything strange. Suggests checking the black market clinics."
      },
      "isPrimeSuspect": false,
      "category": "person_of_interest"
    },
    {
      "id": "vex_riordan",
      "name": "Vex Riordan",
      "role": "Silent Partner / Credit Shark",
      "trait": "Cold, calculated, calm under pressure. Speaks in short, precise sentences.",
      "initialTrust": 60,
      "initialStress": 10,
      "alibi": "I was in my private suite in the Spire. I was reviewing market data. I had no reason to be in Sector 7. Jin and I were discussing a merger, not a murder.",
      "motive": "Jin was going to default on a $50M debt. Vex's entire criminal empire would collapse if Jin disappeared without paying. Vex needed to ensure the money was transferred and then silence Jin to prevent exposure of the debt structure.",
      "privateKnowledge": "Vex infiltrated the Kurogane building using a backdoor access code. He installed the micro-capsule trigger in Jin's neck port during a scheduled maintenance session (which Jin trusted him to perform). He triggered the capsule at 01:45 AM. When he returned at 02:15 AM to collect the drive, he found Jin unconscious (from Kael's earlier blow) and the scene disturbed. He knew Kael had been there, so he staged the scene to look like Kael's violent attack was the cause, ensuring Kael would be blamed for the murder.",
      "secrets": [
        "He installed the toxic micro-capsule in Jin's neck.",
        "He triggered the poison remotely at 01:45 AM.",
        "He used Kael's earlier presence to frame him for the death."
      ],
      "breakdownThreshold": 90,
      "evidenceReactions": {
        "financial_ledger_leak": "Unfazed. Acknowledges the debt was a 'business matter' that was being resolved. Denies illegal methods.",
        "toxicology_report": "Suggests the toxicology is flawed. Claims Jin might have had a pre-existing condition or taken illegal drugs himself.",
        "remote_trigger_device": "Pauses for 3 seconds. Claims the device was a known prototype he was testing for security purposes, not for assassination. Denies using it on Jin."
      },
      "isPrimeSuspect": false,
      "category": "person_of_interest"
    }
  ],
  "groundTruth": {
    "killer": "kael_vance",
    "motive": "cover_up",
    "weapon": "bronze_cyber_arm",
    "keyContradiction": "timeline_gap",
    "timelineSummary": "The suspect exploited an unmonitored window to execute the crime.",
    "archetype": "cause_of_death_twist"
  },
  "isDefault": false,
  "archetype": "cause_of_death_twist",
  "trope": "The Stunner vs. The Killer"
};
