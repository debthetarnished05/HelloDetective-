import { IStory } from '../types/index';

// CASE 2: 1930s Gothic Noir Opera House Mystery
export const OPERA_STORY: IStory = {
  title: 'The Gilded Aria: Poison at the Blackwood Opera',
  caseNumber: '1934-1024-VV',
  leadDetective: 'Inspector Silas Thorne',
  status: 'Active Homicide Investigation',
  victimProfile: {
    name: 'Madame Vivienne Vance',
    age: 38,
    occupation: 'Prima Donna Soprano, Blackwood Grand Opera',
    discovered: 'October 24, 1934, 10:05 PM in Star Dressing Room #1',
    causeOfDeath: 'Acute lethal ingestion of belladonna (deadly nightshade alkaloid)',
    timeOfDeath: 'Between 9:35 PM and 9:55 PM, during the Act II intermission'
  },
  briefing: {
    initialBriefing: 'Madame Vivienne Vance collapsed inside her locked dressing room minutes before her final curtain call in Tosca. A crystal voice-atomizer scented with bitter almond and nightshade was discovered shattered on her Persian rug. Outside in the gaslit alley, heavy rain has washed away footprints, but five members of the company were backstage during the intermission.',
    detectiveInsights: 'Vivienne was as feared as she was adored. Behind the velvet drapes and golden proscenium lies a web of embezzled pension funds, desperate understudies, and illegal narcotics. The theater stage door was guarded, meaning the killer is undoubtedly one of the Blackwood players or patrons.'
  },
  objectives: {
    progress: [
      'Secured Star Dressing Room #1 and summoned the coroner',
      'Impounded the opera stage door entry ledger',
      'Confiscated the shattered crystal perfume atomizer for chemical analysis',
      'Isolated the prime suspects in the Green Room for questioning'
    ],
    currentObjectives: [
      'Interrogate Julian Blackwood, Camille Dupré, and Dr. Pendelton',
      'Establish which suspect had access to pharmaceutical grade belladonna',
      'Cross-reference the stage door guard\'s testimony with the box seat alibis',
      'Present deduction to Officer Davis to secure a warrant for the private theater dispensary'
    ]
  },
  locations: [
    {
      id: 'star_dressing_room',
      title: 'Star Dressing Room #1',
      subtitle: 'Blackwood Grand Opera - Backstage Hallway',
      status: 'Active Crime Scene',
      lastVisited: 'October 24, 1934',
      witnesses: 'Wardrobe Mistress Eleanor Vance, Call Boy Tommy',
      notes: 'Lavish dressing room with mahogany vanity, gilded mirror, and shattered perfume atomizer. The aroma of bitter almonds lingers in the air.',
      unlockStage: 1
    },
    {
      id: 'the_green_room',
      title: 'The Green Room & Orchestra Pit',
      subtitle: 'Sub-Stage Musicians\' Lounge',
      status: 'Witness Gathering Area',
      lastVisited: 'October 25, 1934',
      witnesses: 'Conductor Maestro Bellini, Understudy Camille Dupré',
      notes: 'Dimly lit salon where performers wait between acts. Sheet music scattered across velvet settees. Stained tea cups left on the side tables.',
      unlockStage: 2
    },
    {
      id: 'blackwood_dispensary',
      title: 'Company Medical Dispensary',
      subtitle: 'Mezzanine Level - Office #4',
      status: 'Search Warrant Executed',
      lastVisited: 'October 25, 1934',
      witnesses: 'Dr. Arthur Pendelton',
      notes: 'Locked medicine cabinets containing pharmaceutical extracts, ether, and tinctures. A secret service dumbwaiter connects directly to the star dressing room hallway.',
      unlockStage: 3
    },
    {
      id: 'prop_workshop_vault',
      title: 'Stage Rigging Catwalks & Boiler Crypt',
      subtitle: 'Beneath the Main Fly Gallery',
      status: 'Forensic Recovery Site',
      lastVisited: 'Pending Detective Sweep',
      witnesses: 'Stage Master Gideon Cross',
      notes: 'Industrial network of counterweight pulleys and coal-burning furnaces. Ideal location to incinerate bloody rags or discard empty poison vials.',
      unlockStage: 4
    }
  ],
  evidence: [
    {
      id: 'shattered_atomizer',
      title: 'Shattered Crystal Voice Atomizer',
      subtitle: 'Personal Throat Spray of Victim',
      details: 'French cut-crystal spray bottle engraved with "V.V." The amber liquid inside tested positive for a lethal concentration of purified atropine and scopolamine from belladonna. A single deep inhalation would cause vocal paralysis followed by cardiac arrest within ten minutes.',
      date: 'October 24, 1934',
      location: 'Star Dressing Room Floor',
      priority: 'Critical',
      unlockStage: 1
    },
    {
      id: 'apothecary_purchase_slip',
      title: 'Apothecary Receipt for Belladonna Tincture',
      subtitle: 'Manning & Sons Chemists, High Street',
      details: 'Receipt dated October 20, 1934, logging the purchase of 50ml Concentrated Belladonna Tincture by "The Blackwood Opera Medical Staff". Signed with an illegible scrawl resembling the theater\'s physician.',
      date: 'October 24, 1934',
      location: 'Found tucked in dressing room wastebasket',
      priority: 'High',
      unlockStage: 1
    },
    {
      id: 'stage_door_ledger',
      title: 'Stage Door Guard Sign-In Ledger',
      subtitle: 'Logbook of Watchman Felix Quinn',
      details: 'Official theater logbook for October 24. While Julian Blackwood claims he remained in Box A drinking champagne with the mayor, the ledger notes a mysterious gentleman in a charcoal Inverness cape slipped out the stage door into the carriage alley at exactly 9:48 PM.',
      date: 'October 24, 1934',
      location: 'Stage Door Security Kiosk',
      priority: 'Critical',
      unlockStage: 1
    },
    {
      id: 'blackwood_pension_audit',
      title: 'Secret Theater Embezzlement Audit',
      subtitle: 'Auditor\'s Confidential Report',
      details: 'Financial records showing over £15,000 missing from the Blackwood Actors Pension Fund. A handwritten note in Vivienne Vance\'s handwriting warns Julian Blackwood: "Return the performers\' life savings before Sunday mass, or the Board of Trustees and Scotland Yard will receive this ledger."',
      date: 'October 22, 1934',
      location: 'Vivienne Vance\'s Hatbox Safe',
      priority: 'Critical',
      unlockStage: 2
    },
    {
      id: 'tampered_honey_jar',
      title: 'Infused Chamomile & Honey Jar',
      subtitle: 'Vocal Preparation Mixture',
      details: 'Glazed porcelain jar prepared by understudy Camille Dupré. Chemical analysis shows pure honey and chamomile with trace amounts of belladonna residue around the threaded lid, proving the poison was transferred from another vessel.',
      date: 'October 25, 1934',
      location: 'The Green Room Kitchenette',
      priority: 'High',
      unlockStage: 2
    },
    {
      id: 'dispensary_key_log',
      title: 'Medical Poison Cabinet Logbook',
      subtitle: 'Dr. Pendelton\'s Medical Office',
      details: 'Dispensary register showing the poisonous alkaloids cabinet was unlocked at 7:15 PM on the night of the murder. Dr. Pendelton claims his key went missing from his waistcoat, but the brass lock shows no signs of forced entry.',
      date: 'October 25, 1934',
      location: 'Company Medical Dispensary',
      priority: 'Critical',
      unlockStage: 3
    },
    {
      id: 'dumbwaiter_belladonna_vial',
      title: 'Brown Glass Poison Dropper Vial',
      subtitle: 'Discarded Dropper Bottle',
      details: 'Unlabeled amber bottle found wrapped in a monogrammed silk handkerchief inside the backstage dumbwaiter shaft. Forensics confirms belladonna alkaloid matching the atomizer liquid, and latent wax seal fingerprints matching Julian Blackwood\'s signet ring.',
      date: 'October 26, 1934',
      location: 'Service Dumbwaiter Shaft',
      priority: 'Critical',
      unlockStage: 4
    }
  ],
  suspects: [
    {
      id: 'julian_blackwood',
      name: 'Julian Blackwood',
      role: 'Theater Impresario & Blackwood Estate Heir',
      trait: 'Arrogant aristocrat, suave, desperate gambler drowning in debt',
      initialTrust: 40,
      initialStress: 30,
      isPrimeSuspect: true,
      category: 'prime_suspect',
      alibi: 'Claims he spent the entire intermission sipping vintage champagne in private Box A with the Lord Mayor and prominent socialites.',
      motive: 'Vivienne discovered he embezzled £15,000 from the actors\' pension fund to pay off illegal gaming houses, and was going to hand the audit to Scotland Yard the following morning.',
      privateKnowledge: 'He slipped away from Box A through the private mezzanine passage at 9:35 PM, entered Vivienne\'s dressing room while she was speaking to wardrobe, emptied Dr. Pendelton\'s stolen belladonna vial into her voice atomizer, and fled through the stage door alley into the carriage mews at 9:48 PM.',
      secrets: [
        'Admitted leaving Box A during the intermission to speak with Vivienne',
        'Confessed he was facing bankruptcy and public ruin over the missing £15,000 pension fund',
        'Admitted taking the poison vial from Dr. Pendelton\'s coat earlier that afternoon',
        'Broke down in tears and confessed to poisoning her throat atomizer so she would lose her voice permanently, claiming he never meant for the dose to be fatal'
      ],
      breakdownThreshold: 80,
      evidenceReactions: {
        stage_door_ledger: 'His monocle trembles. He stammers that he merely stepped outside for a puff of Egyptian tobacco in the rain.',
        blackwood_pension_audit: 'He turns ghost-white: "Vivienne was ruthless... She would have had me sent to Dartmoor Prison without a second thought!"',
        dumbwaiter_belladonna_vial: 'He grabs the table edge as his knees buckle: "That handkerchief... My signet ring... My God, what have I done?"'
      }
    },
    {
      id: 'camille_dupre',
      name: 'Camille Dupré',
      role: 'Soprano Understudy & Chorus Leader',
      trait: 'Bitter, fiercely ambitious, religious fanatic, repressed jealousy',
      initialTrust: 50,
      initialStress: 40,
      isPrimeSuspect: true,
      category: 'prime_suspect',
      alibi: 'Claims she was kneeling in prayer in the chorus dressing room, preparing to sing her minor chorus role.',
      motive: 'Lived seven years in Vivienne\'s shadow enduring public humiliation; instantly took the lead role for Act III and received thunderous applause.',
      privateKnowledge: 'She prepared Vivienne\'s hot honey water at 9:15 PM and saw Julian Blackwood lurking near the star dressing room with a silver pocket watch. She prayed for divine retribution against Vivienne, but did not administer the poison.',
      secrets: [
        'Admitted wishing Vivienne dead so she could take the lead soprano role',
        'Confessed she saw Julian Blackwood exit Vivienne\'s dressing room at 9:40 PM looking terrified',
        'Revealed she found the discarded draft of the pension audit on the floor and hid it'
      ],
      breakdownThreshold: 75,
      evidenceReactions: {
        tampered_honey_jar: 'She gasps and clutches her crucifix: "I only put clover honey and lemon in her tea! The Lord is my shepherd, I swear it!"',
        shattered_atomizer: 'She looks at the crystal: "Vivienne used that atomizer every single night before Act III. Whoever poisoned it knew her ritual intimately."'
      }
    },
    {
      id: 'dr_arthur_pendelton',
      name: 'Dr. Arthur Pendelton',
      role: 'Resident Theater Physician & Toxicologist',
      trait: 'Fastidious, sweating profusely, secret morphine addict in debt to Blackwood',
      initialTrust: 45,
      initialStress: 50,
      isPrimeSuspect: true,
      category: 'prime_suspect',
      alibi: 'Claims he was bandaging a stagehand\'s crushed wrist in the mezzanine dispensary during the intermission.',
      motive: 'Vivienne discovered he was writing illegal morphine prescriptions for high-society addicts and threatened to revoke his medical license.',
      privateKnowledge: 'He purchased the belladonna under pressure from Julian Blackwood, who claimed it was for an exotic botanical heart condition. Julian stole the remaining vial from his dispensary desk.',
      secrets: [
        'Admitted purchasing the concentrated belladonna extract from Manning & Sons chemists',
        'Confessed Julian Blackwood blackmailed him using his secret morphine addiction',
        'Revealed Julian forced him to leave the poison cabinet key on the desk at 7:00 PM'
      ],
      breakdownThreshold: 70,
      evidenceReactions: {
        apothecary_purchase_slip: 'He wipes his brow with a trembling handkerchief: "Blackwood threatened to have me struck off the medical register if I didn\'t sign that chemist slip!"',
        dispensary_key_log: 'He admits: "The cabinet was unlocked for Julian. I knew he was up to no good, but I swear on my Hippocratic oath I didn\'t know he would kill her!"'
      }
    },
    {
      id: 'gideon_cross',
      name: 'Gideon Cross',
      role: 'Stage Master & Fly-System Machinist',
      trait: 'Gruff, weathered veteran stagehand, protective of stage crew',
      initialTrust: 65,
      initialStress: 15,
      isPrimeSuspect: false,
      category: 'witness',
      alibi: 'Up in the high fly-gallery checking the iron counterweights and gas pipe valves during the entire intermission.',
      motive: 'None. Detested the wealthy patrons, respected Vivienne\'s singing talent.',
      privateKnowledge: 'From his vantage point on the catwalks 40 feet up, he saw Julian Blackwood dart into the private corridor behind dressing room #1 at 9:36 PM wearing an evening coat, then rush toward the service dumbwaiter five minutes later.',
      secrets: [
        'Admitted seeing Julian Blackwood sneak backstage when he was supposed to be in Box A with the mayor',
        'Confessed he heard glass shatter in the dumbwaiter shaft around 9:45 PM',
        'Revealed Julian offered him twenty sovereigns the next morning to say the backstage corridor was empty'
      ],
      breakdownThreshold: 65,
      evidenceReactions: {
        stage_door_ledger: 'He grins grimly: "Old Quinn\'s ledger don\'t lie. Mr. Blackwood always thinks he can buy his way out of a hanging."',
        dumbwaiter_belladonna_vial: 'He points up: "That dumbwaiter connects straight from the dispensary on floor two down to the dressing rooms."'
      }
    },
    {
      id: 'eleanor_vance',
      name: 'Eleanor Vance',
      role: 'Wardrobe Mistress & Victim\'s Sister',
      trait: 'Grief-stricken, timid, fiercely protective of her sister\'s reputation',
      initialTrust: 60,
      initialStress: 40,
      isPrimeSuspect: false,
      category: 'person_of_interest',
      alibi: 'Hemming the burgundy velvet coronation robe in the wardrobe room on the fourth floor.',
      motive: 'Stood to inherit Vivienne\'s personal estate and Parisian townhouse; tired of being treated like a domestic servant.',
      privateKnowledge: 'Vivienne told her that afternoon: "Julian Blackwood will either return every shilling he stole from the chorus girls, or tomorrow he will be sleeping in a cell at Newgate." Eleanor also saw Julian threatening Vivienne through the dressing room door before curtain call.',
      secrets: [
        'Admitted she hated how Vivienne humiliated her in front of the cast, but loved her too much to hurt her',
        'Confessed she hid Vivienne\'s private journal containing details of Julian\'s embezzlement',
        'Revealed Vivienne caught Julian trying to open her jewel safe three days prior'
      ],
      breakdownThreshold: 70,
      evidenceReactions: {
        blackwood_pension_audit: 'She breaks into sobs: "Vivienne was doing it for the dancers! Julian gambled their pensions on Monte Carlo roulette!"',
        shattered_atomizer: 'She covers her mouth: "I polished that silver casing this morning. Vivienne never sang a high C without spraying her throat first."'
      }
    },
    {
      id: 'felix_quinn',
      name: 'Felix "Rattler" Quinn',
      role: 'Night Stage Door Watchman',
      trait: 'Cigar-smoking, dry, cynical Cockney watchman, stickler for his sign-in ledger',
      initialTrust: 70,
      initialStress: 20,
      isPrimeSuspect: false,
      category: 'witness',
      alibi: 'Guarding the iron stage door alley entrance from 6:00 PM until 2:00 AM.',
      motive: 'None. Only cares about his five-shilling wage and cold stout.',
      privateKnowledge: 'Julian Blackwood threw a ten-shilling note on his desk at 9:48 PM, breathless and soaked in sweat, telling him: "Keep this door locked and forget you saw me." Blackwood then vanished into the fog down Drury Lane.',
      secrets: [
        'Admitted taking the ten-shilling bribe from Julian Blackwood at 9:48 PM',
        'Confessed Julian\'s hands were shaking so hard he dropped his umbrella',
        'Revealed Blackwood smelled strongly of bitter almonds and cologne when he sprinted past the gate'
      ],
      breakdownThreshold: 60,
      evidenceReactions: {
        stage_door_ledger: 'He taps the page: "My handwriting don\'t lie, Guv\'nor. 9:48 PM, gentleman in Inverness cape. That was Julian Blackwood, plain as day."',
        dumbwaiter_belladonna_vial: 'He snorts: "Bitter almonds? That was the exact stink on Blackwood\'s coat when he barged through my turnstile."'
      }
    }
  ],
  stages: [
    {
      stage: 1,
      title: 'Stage 1: The Initial Scene (The Tainted Tincture)',
      description: 'Establish how the deadly belladonna was administered to the prima donna and expose the falsified theater alibis.',
      gateRules: 'The detective must identify that Vivienne Vance was murdered via the poisoned voice atomizer and that Julian Blackwood\'s Box A alibi is false because the stage door ledger proves he slipped backstage during intermission.',
      unlockEvidenceIds: ['blackwood_pension_audit', 'tampered_honey_jar'],
      unlockLocationIds: ['the_green_room']
    },
    {
      stage: 2,
      title: 'Stage 2: The Hidden Web (The Embezzlement & Blackmail)',
      description: 'Uncover why the prima donna was targeted. Cross-examine the suspects regarding financial fraud and theater contracts.',
      gateRules: 'The detective must deduce the true motive: Julian Blackwood embezzled £15,000 from the actors\' pension fund to pay off gambling debts, and Vivienne was going to report him to Scotland Yard.',
      unlockEvidenceIds: ['dispensary_key_log'],
      unlockLocationIds: ['blackwood_dispensary']
    },
    {
      stage: 3,
      title: 'Stage 3: The Cornered Suspects (The Poison Supply & Delivery)',
      description: 'Pin down how the killer obtained the pharmaceutical belladonna and delivered it directly into her private quarters.',
      gateRules: 'The detective must prove Dr. Pendelton was coerced into procuring the belladonna and that the killer used the backstage service dumbwaiter connecting the dispensary to Star Dressing Room #1.',
      unlockEvidenceIds: ['dumbwaiter_belladonna_vial'],
      unlockLocationIds: ['prop_workshop_vault']
    },
    {
      stage: 4,
      title: 'Stage 4: The Final Squeeze',
      description: 'Confront Julian Blackwood with the signet-imprinted poison vial, stage door testimony, and the pension audit to break his aristocratic composure before the Magistrate.',
      gateRules: 'Submit the completed Arrest Warrant to the Crown Prosecutor and High Court Judge.',
      unlockEvidenceIds: [],
      unlockLocationIds: []
    }
  ],
  groundTruth: {
    killer: 'julian_blackwood',
    motive: 'embezzlement_blackmail_and_breach_of_contract',
    weapon: 'shattered_atomizer',
    keyContradiction: 'stage_door_ledger',
    timelineSummary: 'Julian Blackwood embezzled £15,000 from the theater pension fund. Vivienne Vance confronted him and prepared an audit for Scotland Yard. Blackwood blackmailed Dr. Pendelton for concentrated belladonna, sneaked from his box at 9:35 PM, poured the poison into Vivienne\'s voice atomizer, dumped the vial down the dumbwaiter, and slipped out the stage door into Drury Lane at 9:48 PM before the curtain rose for Act III.'
  },
  isDefault: false
};

// CASE 3: Arctic Research Station Cryo-Thriller
export const ARCTIC_STORY: IStory = {
  title: 'The Frostbite Protocol: Murder at Station Boreas',
  caseNumber: '2026-0114-BOREAS',
  leadDetective: 'Special Agent Nina Kouris',
  status: 'Active Polar Homicide Investigation',
  victimProfile: {
    name: 'Dr. Erik Lindstrom',
    age: 51,
    occupation: 'Chief Glaciologist & Project Director, Station Boreas',
    discovered: 'January 14, 2026, 04:30 UTC in Deep Sub-Ice Core Vault B4',
    causeOfDeath: 'Acute cryogenic shock and asphyxiation from vented liquid nitrogen coolant, followed by blunt trauma to helmet faceplate',
    timeOfDeath: 'Between 03:05 UTC and 03:25 UTC during Category 5 geomagnetic storm'
  },
  briefing: {
    initialBriefing: 'Station Boreas sits 400 miles inside the Greenland ice sheet, completely cut off by a Category 5 winter blizzard. Chief Glaciologist Dr. Erik Lindstrom was found frozen solid inside the pressurized sub-ice drill vault at Level B4. The vault\'s emergency liquid nitrogen purge valve had been manually tripped from the interior corridor, and Lindstrom\'s pressurized survival helmet was shattered from the outside with a pneumatic rock hammer.',
    detectiveInsights: 'The station\'s exterior airlocks remained sealed tight against the -65°C gale outside—meaning the killer is trapped inside the habitat dome with us. Behind the facade of pure climate science lies a cutthroat battle over trillion-dollar rare-earth minerals buried beneath the melting ice sheet.'
  },
  objectives: {
    progress: [
      'Placed Station Boreas on complete biometric lockdown',
      'Secured Level B4 Cryo-Drill Vault and quarantined life-support telemetry',
      'Gathered all surviving research crew in the Central Mess Dome',
      'Impounded the engineering tool crib and pneumatic drill registers'
    ],
    currentObjectives: [
      'Interrogate Dr. Nikolai Vance, Chief Engineer Maya Zhang, and Sven Olsen',
      'Investigate the looped sleep telemetry logs in the crew quarters',
      'Discover who possessed administrative override credentials for the nitrogen purge system',
      'Present deduction to Officer Davis to authorize forensic sweep of the deep core scanner lab'
    ]
  },
  locations: [
    {
      id: 'cryo_drill_vault',
      title: 'Level B4 Sub-Ice Core Vault',
      subtitle: 'Station Boreas - 120 Meters Beneath Glacier',
      status: 'Active Crime Scene',
      lastVisited: 'January 14, 2026',
      witnesses: 'Dr. Anya Petrova, Specialist Jonas Reed',
      notes: 'Sub-zero drilling chamber where prehistoric ice cores are extracted. Heavy frost coats every surface. Liquid nitrogen venting manifold valve left open at position 4.',
      unlockStage: 1
    },
    {
      id: 'central_habitat_quarters',
      title: 'Crew Living Quarters & Mess Dome',
      subtitle: 'Upper Habitat Level A',
      status: 'Quarantined Living Area',
      lastVisited: 'January 14, 2026',
      witnesses: 'Quartermaster Kari Vinter',
      notes: 'Prefabricated crew pods equipped with biometric vital-sign sleep trackers and personal workstation terminals. Sealed against polar gales.',
      unlockStage: 2
    },
    {
      id: 'engineering_tool_crib',
      title: 'Heavy Machinery Bay & Maintenance Crib',
      subtitle: 'Sub-Surface Level B2',
      status: 'Search Warrant Executed',
      lastVisited: 'January 15, 2026',
      witnesses: 'Chief Engineer Maya Zhang, Rig Operator Sven Olsen',
      notes: 'Workshop containing snowcat tractors, hydraulic winches, and heavy mining tools. The pneumatic rock hammer rack shows slot #3 empty.',
      unlockStage: 3
    },
    {
      id: 'communications_array_hub',
      title: 'Satellite Uplink & Deep Sensor Lab',
      subtitle: 'Tower Dome Level C',
      status: 'Restricted Forensic Site',
      lastVisited: 'Pending Detective Sweep',
      witnesses: 'Comms Officer Jonas Reed',
      notes: 'High-frequency microwave antennae and encrypted satellite data servers. Terminal screens show evidence of a scrubbed external data transmission.',
      unlockStage: 4
    }
  ],
  evidence: [
    {
      id: 'smashed_cryo_helmet',
      title: 'Shattered Pressurized Survival Helmet',
      subtitle: 'Victim\'s Protective Gear',
      details: 'Dr. Lindstrom\'s reinforced polycarbonate faceplate was fractured by multiple high-velocity impacts from a blunt cylindrical tool. Forensic microscopes reveal microscopic blue nylon fibers and hydraulic grease embedded in the perimeter silicone seal.',
      date: 'January 14, 2026',
      location: 'Level B4 Drill Vault Deck',
      priority: 'Critical',
      unlockStage: 1
    },
    {
      id: 'nitrogen_vent_audit',
      title: 'Emergency Coolant Manifold Audit Log',
      subtitle: 'Automated Life Support SCADA Record',
      details: 'Automated telemetry showing Level B4 liquid nitrogen coolant flood was initiated at 03:12 UTC using administrative keycard credential "DIR-OVERRIDE-02" assigned to Deputy Science Director Dr. Nikolai Vance.',
      date: 'January 14, 2026',
      location: 'Base Central Mainframe',
      priority: 'Critical',
      unlockStage: 1
    },
    {
      id: 'looped_sleep_tracker',
      title: 'Falsified Biometric Sleep Telemetry',
      subtitle: 'Crew Pod #3 Health Monitor',
      details: 'Dr. Nikolai Vance\'s sleep band recorded steady REM sleep between 01:00 and 06:00 UTC. However, diagnostic analysis shows the heart rate waveform is a 12-minute repeating loop uploaded from an external memory stick at 02:45 UTC.',
      date: 'January 14, 2026',
      location: 'Medical Monitoring Console',
      priority: 'Critical',
      unlockStage: 1
    },
    {
      id: 'falsified_climate_core_report',
      title: 'Subglacial Rare-Earth Mining Survey',
      subtitle: 'Project DeepCore Confidential Findings',
      details: 'Encrypted document showing Dr. Lindstrom caught Nikolai Vance falsifying polar climate models to hide a massive subterranean deposit of neodymium and lithium worth $40 billion, which Vance was secretly brokering to an offshore consortium.',
      date: 'January 12, 2026',
      location: 'Dr. Lindstrom\'s Biometric Tablet',
      priority: 'High',
      unlockStage: 2
    },
    {
      id: 'clandestine_burst_transmission',
      title: 'Encrypted High-Frequency Burst Log',
      subtitle: 'Satellite Comm Channel 88-Delta',
      details: 'Log of an unauthorized 30-second laser satellite burst beamed through the blizzard at 02:58 UTC to a private IP in Geneva, transmitting Lindstrom\'s private encryption keys and drill coordinates.',
      date: 'January 14, 2026',
      location: 'Comms Array Buffer Memory',
      priority: 'High',
      unlockStage: 2
    },
    {
      id: 'pneumatic_rock_hammer',
      title: 'Pneumatic Core-Sample Rock Hammer',
      subtitle: 'Model Atlas-9 Heavy Impact Chisel',
      details: 'Heavy 12-pound pneumatic percussion hammer retrieved from the snowcat exhaust duct. Traces of Lindstrom\'s blood and blue parka synthetic thread are present on the steel striking head.',
      date: 'January 15, 2026',
      location: 'Hangar Snowcat Exhaust Cowling',
      priority: 'Critical',
      unlockStage: 3
    },
    {
      id: 'cleanroom_thermal_parka',
      title: 'Blue Polar Cleanroom Parka with Grease Stains',
      subtitle: 'Personal Cold-Weather Gear',
      details: 'Nikolai Vance\'s assigned thermal parka found stuffed behind the Level B2 HVAC filter. Chemical spectrometry confirms matching synthetic fibers from the broken helmet gasket and microscopic spatter of aerosolized liquid nitrogen lubricant on the cuffs.',
      date: 'January 15, 2026',
      location: 'HVAC Air Recirculation Duct',
      priority: 'Critical',
      unlockStage: 4
    }
  ],
  suspects: [
    {
      id: 'nikolai_vance',
      name: 'Dr. Nikolai Vance',
      role: 'Deputy Science Director & Geophysicist',
      trait: 'Cold, hyper-intellectual, ruthless academic egoist with zero empathy',
      initialTrust: 40,
      initialStress: 30,
      isPrimeSuspect: true,
      category: 'prime_suspect',
      alibi: 'Claims he was asleep in his bunk pod from midnight until the morning klaxon sounded, pointing to his logged biometric sleep tracker as proof.',
      motive: 'Lindstrom discovered Nikolai was falsifying climate core data to hide a multi-billion dollar lithium-platinum deposit that Nikolai was selling to a Swiss private military mining syndicate.',
      privateKnowledge: 'He hacked his sleep monitor with a looped script at 02:45 UTC, took Sven\'s pneumatic hammer from the crib, cornered Lindstrom in Vault B4, opened the liquid nitrogen coolant valve, smashed Lindstrom\'s helmet faceplate when Lindstrom tried to activate the emergency beacon, and stashed his parka in the air duct.',
      secrets: [
        'Admitted looping his biometric sleep monitor using a programmed USB script',
        'Confessed to transmitting the confidential core deposit coordinates to Geneva at 02:58 UTC',
        'Admitted confronting Lindstrom in Vault B4 over the scientific fraud allegations',
        'Cracked completely and confessed to venting the liquid nitrogen and smashing Lindstrom\'s helmet so he wouldn\'t freeze the Swiss mining contract'
      ],
      breakdownThreshold: 80,
      evidenceReactions: {
        looped_sleep_tracker: 'His clinical expression fractures. He tries to claim his sleep monitor must have experienced an electromagnetic glitch from the aurora.',
        falsified_climate_core_report: 'He sneers: "Lindstrom was an academic dinosaur! That lithium deposit will power the next century of autonomous robotics!"',
        cleanroom_thermal_parka: 'He clutches his temples and collapses onto the interrogation table: "He was going to destroy thirty years of my life\'s work!"'
      }
    },
    {
      id: 'maya_zhang',
      name: 'Chief Engineer Maya Zhang',
      role: 'Senior Life Support & Power Systems Engineer',
      trait: 'Gruff, protective of crew survival, exhausted, disdainful of academic politics',
      initialTrust: 55,
      initialStress: 35,
      isPrimeSuspect: true,
      category: 'prime_suspect',
      alibi: 'Claims she spent the whole night monitoring the main reactor heat exchangers in the generator room to prevent blackout during the storm.',
      motive: 'Lindstrom had cut power to crew heating pods by 40% to run his sub-ice drills, which Maya openly stated would kill someone before winter ended.',
      privateKnowledge: 'She saw someone entering the Level B elevator shaft at 03:00 UTC wearing a blue scientific parka, but assumed it was Lindstrom doing an inspection. She did not trip the nitrogen valve.',
      secrets: [
        'Admitted having a screaming match with Lindstrom at 18:00 UTC over habitat power cuts',
        'Confessed she bypassed safety interlocks on the generator to keep the habitat warm',
        'Revealed she saw Nikolai Vance whispering with Sven Olsen near the tool crib earlier that afternoon'
      ],
      breakdownThreshold: 75,
      evidenceReactions: {
        nitrogen_vent_audit: 'Her eyes blaze: "That coolant loop is designed to preserve ice samples, not humans! Whoever opened that valve knew it would create an instant cryogenic coffin!"',
        smashed_cryo_helmet: 'She shudders: "The force needed to smash that visor... It had to be a pneumatic percussion hammer. Nothing else could crack reinforced Lexan."'
      }
    },
    {
      id: 'sven_olsen',
      name: 'Sven Olsen',
      role: 'Heavy Drilling Rig Operator & Deep Miner',
      trait: 'Massive, scarred, blunt-spoken, suspicious of corporate suits',
      initialTrust: 45,
      initialStress: 40,
      isPrimeSuspect: true,
      category: 'prime_suspect',
      alibi: 'Claims he was rebuilding a frozen hydraulic fuel pump on snowcat tractor #2 in the vehicle bay.',
      motive: 'Lindstrom caught Sven smuggling raw core crystal specimens into his private footlocker to sell on the black market.',
      privateKnowledge: 'Sven noticed his pneumatic rock hammer was missing from rack #3 at 02:30 UTC when he went to service a drill bit. He went down to Level B4 looking for it and smelled nitrogen gas, panicked, and ran back up without reporting it.',
      secrets: [
        'Admitted his pneumatic hammer went missing hours before the murder',
        'Confessed he went down to Level B4 around 03:20 UTC and saw thick white nitrogen fog spilling under the airlock door',
        'Revealed Nikolai Vance offered him $50,000 in crypto to "lose" the drilling logs for core layer 88'
      ],
      breakdownThreshold: 70,
      evidenceReactions: {
        pneumatic_rock_hammer: 'He slams his fist: "That\'s my rig hammer! But look at the grease on the handle—I wear size 13 mittens, whoever held that had small hands like Vance!"',
        falsified_climate_core_report: 'He spits on the floor: "Vance always talked like a savior, but he was measuring the mineral veins in dollar signs."'
      }
    },
    {
      id: 'dr_anya_petrova',
      name: 'Dr. Anya Petrova',
      role: 'Station Chief Medical Officer & Cryobiologist',
      trait: 'Methodical, forensic mindset, calm under extreme pressure',
      initialTrust: 65,
      initialStress: 20,
      isPrimeSuspect: false,
      category: 'witness',
      alibi: 'Analyzing tissue cultures in the main clinical lab on Level A.',
      motive: 'None. Lindstrom was her mentor and close professional ally.',
      privateKnowledge: 'During the initial examination of Lindstrom\'s frozen remains, she preserved microscopic fibers from the helmet shatter line before anyone could contaminate the scene. She recognized the blue dye from Vance\'s cleanroom gear.',
      secrets: [
        'Admitted she kept the blue synthetic fiber samples hidden because she suspected a senior officer',
        'Confessed Lindstrom confided in her that he feared for his life two days prior to the storm',
        'Revealed that Vance visited med-bay that morning asking if cryogenic shock leaves identifiable forensic toxins'
      ],
      breakdownThreshold: 65,
      evidenceReactions: {
        smashed_cryo_helmet: 'She nods gravely: "Blunt force trauma didn\'t kill him first; his lungs crystallized the second the nitrogen vapor breached the faceplate."',
        cleanroom_thermal_parka: 'She compares the samples: "The spectrometer peaks are identical. These threads came from Nikolai Vance\'s parka."'
      }
    },
    {
      id: 'jonas_reed',
      name: 'Jonas Reed',
      role: 'Communications Specialist & Radar Tech',
      trait: 'Nervous, caffeinated, tech savant, terrified of isolation',
      initialTrust: 60,
      initialStress: 30,
      isPrimeSuspect: false,
      category: 'witness',
      alibi: 'At the radar console attempting to align the emergency storm transponder.',
      motive: 'None. Only wants the storm to pass so the supply transport can evacuate the station.',
      privateKnowledge: 'He intercepted the high-frequency burst transmission at 02:58 UTC. Because it bypassed the main console firewall, it could only have been sent using the director\'s emergency cryptographic token—which Nikolai Vance had stolen from Lindstrom\'s desk.',
      secrets: [
        'Admitted capturing the raw encrypted packet of the secret 02:58 UTC burst',
        'Confessed Vance ordered him to wipe the satellite relay logs at 06:00 UTC under threat of termination',
        'Revealed the destination server was registered to Aegis Polar Resources in Geneva'
      ],
      breakdownThreshold: 60,
      evidenceReactions: {
        clandestine_burst_transmission: 'He nods frantically: "That\'s the packet! I logged the handshake ID: it used Vance\'s private encryption signature!"',
        looped_sleep_tracker: 'He laughs nervously: "That script is an amateur loop. Anyone with a high school coding certificate could spot the identical heartbeat rhythm."'
      }
    },
    {
      id: 'kari_vinter',
      name: 'Kari Vinter',
      role: 'Station Quartermaster & Logistics Head',
      trait: 'Meticulous, strict inventory keeper, suspicious of anyone touching supplies',
      initialTrust: 70,
      initialStress: 15,
      isPrimeSuspect: false,
      category: 'witness',
      alibi: 'Conducting emergency food and heating fuel audits in storage pod 2.',
      motive: 'None. Strict rules-and-regulations officer.',
      privateKnowledge: 'Nikolai Vance came to her supply desk at 21:00 UTC requesting access to the Level B4 emergency nitrogen isolation panel keys, claiming he needed to calibrate the sample chillers before the blizzard knocked out the auxiliary grid.',
      secrets: [
        'Admitted giving Nikolai Vance the emergency isolation panel key override card at 21:00 UTC',
        'Confessed Vance was breathing erratically and refused to sign the checkout registry',
        'Revealed Vance returned the key at 04:00 UTC with fresh frost on his boots'
      ],
      breakdownThreshold: 65,
      evidenceReactions: {
        nitrogen_vent_audit: 'She confirms: "DIR-OVERRIDE-02 is the exact access badge I handed to Nikolai Vance last night."',
        pneumatic_rock_hammer: 'She checks her clipboard: "Sven didn\'t take that hammer out. That tool was logged out under a master research override."'
      }
    }
  ],
  stages: [
    {
      stage: 1,
      title: 'Stage 1: The Initial Scene (The Falsified Sleep Log)',
      description: 'Discover how the pressurized drill vault was breached during base lockdown and expose the looped biometric alibi.',
      gateRules: 'The detective must prove that the liquid nitrogen coolant was vented intentionally and that Dr. Nikolai Vance\'s sleep telemetry was a fraudulent programmed loop created to fake an alibi.',
      unlockEvidenceIds: ['falsified_climate_core_report', 'clandestine_burst_transmission'],
      unlockLocationIds: ['central_habitat_quarters']
    },
    {
      stage: 2,
      title: 'Stage 2: The Hidden Web (The Stolen Rare-Earth Deposit)',
      description: 'Uncover the real motive behind the murder of the station director and decode the clandestine burst transmission.',
      gateRules: 'The detective must establish the financial motive: Lindstrom caught Nikolai Vance falsifying climate models to secretly broker a multi-billion dollar subterranean lithium-platinum deposit to a Swiss syndicate.',
      unlockEvidenceIds: ['pneumatic_rock_hammer'],
      unlockLocationIds: ['engineering_tool_crib']
    },
    {
      stage: 3,
      title: 'Stage 3: The Cornered Suspects (The Weapon & Broken Visor)',
      description: 'Pin down the murder weapon and identify whose cleanroom gear was present during the fatal cryogenic decompression.',
      gateRules: 'The detective must identify that the pneumatic core-sample rock hammer was used to shatter Lindstrom\'s helmet faceplate and match the blue cleanroom parka fibers to Nikolai Vance.',
      unlockEvidenceIds: ['cleanroom_thermal_parka'],
      unlockLocationIds: ['communications_array_hub']
    },
    {
      stage: 4,
      title: 'Stage 4: The Final Squeeze',
      description: 'Confront Dr. Nikolai Vance with the recovered parka fibers, cryptographic burst transmission, and pneumatic hammer forensics to force a full confession before rescue aircraft arrive.',
      gateRules: 'Submit the definitive Arrest Warrant and forensic brief to the Polar Bureau Tribunal.',
      unlockEvidenceIds: [],
      unlockLocationIds: []
    }
  ],
  groundTruth: {
    killer: 'nikolai_vance',
    motive: 'falsified_climate_core_report',
    weapon: 'pneumatic_rock_hammer',
    keyContradiction: 'looped_sleep_tracker',
    timelineSummary: 'Nikolai Vance falsified Project DeepCore research data to hide a $40 billion lithium deposit. Lindstrom caught him and prepared to expose his fraud. Vance looped his biometric sleep tracker, transmitted the core coordinates to Geneva at 02:58 UTC, cornered Lindstrom in Vault B4, opened the liquid nitrogen coolant valve, and smashed Lindstrom\'s helmet faceplate with a pneumatic rock hammer to ensure immediate cryogenic death.'
  },
  isDefault: false
};
